import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { LogoutPengunjungDto } from '@/pengunjung/dto/logout-pengunjung.dto';
import { RegisterPengunjungDto } from '@/pengunjung/dto/register-pengunjung.dto';
import { ResetPasswordPengunjungDto } from '@/pengunjung/dto/reset-password-pengunjung.dto';
import { UpdatePengunjungDto } from '@/pengunjung/dto/update-pengunjung.dto';
import axios from 'axios';

const API_BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

import { supabase } from '@/supabase/supabase.client';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Dinas = 'Dinas',
  Universitas = 'Universitas',
  Media = 'Media',
  LembagaNonPemerintahan = 'Lembaga Non Pemerintahan',
  Umum = 'Umum',
}

@Injectable()
export class PengunjungService {
  private readonly wilayahApi = axios.create({
    baseURL: API_BASE_URL,
  });

  getAllAsalPengunjung(): { value: string; label: string }[] {
    return Object.entries(AsalPengunjung).map(([key, value]) => ({
      value,
      label: value,
    }));
  }

  async getProvinceById(id: string): Promise<{ id: string; name: string }> {
    const { data } = await this.wilayahApi.get(`/province/${id}.json`);
    return data;
  }

  async getRegencyById(
    id: string,
  ): Promise<{ id: string; name: string; province_id: string }> {
    const { data } = await this.wilayahApi.get(`/regency/${id}.json`);
    return data;
  }

  async getDistrictById(
    id: string,
  ): Promise<{ id: string; name: string; regency_id: string }> {
    const { data } = await this.wilayahApi.get(`/district/${id}.json`);
    return data;
  }

  async getVillageById(
    id: string,
  ): Promise<{ id: string; name: string; district_id: string }> {
    const { data } = await this.wilayahApi.get(`/village/${id}.json`);
    return data;
  }

  async register(
    dto: RegisterPengunjungDto,
    ip: string | null,
    userAgent: string | null,
    file: Express.Multer.File,
  ) {
    // Debug: Log data masuk
    console.log('Data diterima:', {
      ...dto,
      alamat: typeof dto.alamat,
      file: file ? `File ${file.originalname}` : 'No file',
    });

    if (typeof dto.alamat === 'string') {
      console.log('Mengkonversi alamat dari string ke object');
      try {
        dto.alamat = JSON.parse(dto.alamat);
        console.log('Alamat setelah parse:', dto.alamat);
      } catch (e) {
        console.error('Gagal parse alamat:', e);
        throw new BadRequestException('Format alamat tidak valid');
      }
    } else if (dto.alamat) {
      console.log('Alamat sudah dalam format object');
    }

    // 1. Input Validation
    const requiredFields = [
      'email',
      'password',
      'nama_depan_pengunjung',
      'no_telepon_pengunjung',
      'asal_pengunjung',
    ];

    const missingFields = requiredFields.filter((field) => !dto[field]);
    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Field berikut wajib diisi: ${missingFields.join(', ')}`,
      );
    }

    // validasi email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new BadRequestException('Format email tidak valid');
    }

    // validasi password
    if (
      dto.password.length < 8 ||
      !/[A-Z]/.test(dto.password) ||
      !/[0-9]/.test(dto.password)
    ) {
      throw new BadRequestException(
        'Password harus minimal 8 karakter dan mengandung huruf besar dan angka',
      );
    }

    const {
      email,
      password,
      nama_depan_pengunjung,
      nama_belakang_pengunjung,
      no_telepon_pengunjung,
      asal_pengunjung,
      keterangan_asal_pengunjung,
      alamat,
    } = dto;

    // 2. Perikasa email
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error('Gagal ambil daftar user dari Supabase Auth');
      }

      const existingUsers = data?.users?.filter((user) => user.email === email);
      if (existingUsers?.length) {
        throw new BadRequestException('Email sudah digunakan');
      }
    } catch (err) {
      console.error('Error checking email:', err);
      throw new BadRequestException('Gagal memverifikasi email dikarrenakan sudah terdaftar harap masukan email lain');
    }

    // 3. Register user di Supabase Auth
    let id_pengunjung: string;
    try {
      const { data: userData, error: registerError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (registerError || !userData?.user?.id) {
        console.error('Register error:', registerError);
        throw new BadRequestException(
          'Gagal mendaftarkan user ke Supabase Auth',
        );
      }
      id_pengunjung = userData.user.id;
    } catch (err) {
      console.error('Auth registration failed:', err);
      throw new BadRequestException('Proses autentikasi gagal');
    }

    // 4. Simpan alamat (jika ada)
    let alamatId = null;
    if (typeof alamat === 'string') {
      try {
        dto.alamat = JSON.parse(alamat);
      } catch (e) {
        throw new BadRequestException('Format alamat tidak valid');
      }
    }

    if (alamat) {
      try {
        console.log('Processing address:', {
          province: alamat.province_id,
          regency: alamat.regency_id,
          district: alamat.district_id,
          village: alamat.village_id,
        });

        // validasi kelengkapan alamat
        if (
          !alamat.province_id ||
          !alamat.regency_id ||
          !alamat.district_id ||
          !alamat.village_id
        ) {
          throw new BadRequestException('Data alamat tidak lengkap');
        }

        const [province, regency, district, village] = await Promise.all([
          this.getProvinceById(alamat.province_id).catch(() => ({
            id: alamat.province_id,
            name: 'Provinsi Tidak Diketahui',
          })),
          this.getRegencyById(alamat.regency_id).catch(() => ({
            id: alamat.regency_id,
            name: 'Kabupaten Tidak Diketahui',
          })),
          this.getDistrictById(alamat.district_id).catch(() => ({
            id: alamat.district_id,
            name: 'Kecamatan Tidak Diketahui',
          })),
          this.getVillageById(alamat.village_id).catch(() => ({
            id: alamat.village_id,
            name: 'Kelurahan Tidak Diketahui',
          })),
        ]);

        const alamatData = {
          Provinsi_ID: province.id,
          Provinsi: province.name,
          Kabupaten_ID: regency.id,
          Kabupaten: regency.name,
          Kecamatan_ID: district.id,
          Kecamatan: district.name,
          Kelurahan_ID: village.id,
          Kelurahan: village.name,
        };

        const { data: existingAlamat, error: checkError } = await supabase
          .from('Alamat')
          .select('ID_Alamat')
          .match({
            Provinsi_ID: alamatData.Provinsi_ID,
            Kabupaten_ID: alamatData.Kabupaten_ID,
            Kecamatan_ID: alamatData.Kecamatan_ID,
            Kelurahan_ID: alamatData.Kelurahan_ID,
          })
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows found
          console.error('Address check error:', checkError);
          throw checkError;
        }

        if (existingAlamat?.ID_Alamat) {
          alamatId = existingAlamat.ID_Alamat;
        } else {
          const { data: insertedAlamat, error: insertError } = await supabase
            .from('Alamat')
            .insert([alamatData])
            .select('ID_Alamat')
            .single();

          if (insertError) {
            console.error('Address insert error:', insertError);
            throw insertError;
          }
          alamatId = insertedAlamat?.ID_Alamat;
        }
      } catch (error) {
        console.error('Address save error:', error);
        // Hapus pengguna jika alamat gagal
        try {
          await supabase.auth.admin.deleteUser(id_pengunjung);
        } catch (deleteError) {
          console.error('Failed to cleanup auth user:', deleteError);
        }
        throw new BadRequestException(
          'Gagal menyimpan alamat: ' + error.message,
        );
      }
    }

    // 5. upload gambar
    let fotoUrl: string | null = null;
    if (file) {
      try {
        // validasi file
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.mimetype)) {
          throw new BadRequestException('Format file harus JPG, PNG, atau GIF');
        }

        if (file.size > maxSize) {
          throw new BadRequestException('Ukuran file maksimal 5MB');
        }

        const fileExt = extname(file.originalname);
        const path = `${id_pengunjung}${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('foto-pengunjung')
          .upload(path, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw new BadRequestException('Gagal mengunggah foto pengunjung');
        }

        const { data: urlData } = supabase.storage
          .from('foto-pengunjung')
          .getPublicUrl(path);

        fotoUrl = urlData.publicUrl;
      } catch (error) {
        console.error('File handling error:', error);
        // Cleanup: hapus pengguna dan alamat jika error
        try {
          await supabase.auth.admin.deleteUser(id_pengunjung);
          if (alamatId) {
            await supabase.from('Alamat').delete().eq('ID_Alamat', alamatId);
          }
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
        }
        throw new BadRequestException(error.message);
      }
    }

    // 5. simpan data
    try {
      const { error: pengunjungError } = await supabase
        .from('Pengunjung')
        .insert({
          ID_Pengunjung: id_pengunjung,
          ID_Alamat: alamatId,
          Nama_Depan_Pengunjung: nama_depan_pengunjung,
          Nama_Belakang_Pengunjung: nama_belakang_pengunjung || null,
          Email_Pengunjung: email,
          No_Telepon_Pengunjung: no_telepon_pengunjung,
          Asal_Pengunjung: asal_pengunjung,
          Keterangan_Asal_Pengunjung: keterangan_asal_pengunjung || null,
          Foto_Pengunjung: fotoUrl,
        });

      if (pengunjungError) {
        console.error('Visitor save error:', pengunjungError);
        throw pengunjungError;
      }
    } catch (error) {
      console.error('Final save error:', error);
      // Hapus pengguna dan alamat jika ada error
      try {
        await supabase.auth.admin.deleteUser(id_pengunjung);
        if (alamatId) {
          await supabase.from('Alamat').delete().eq('ID_Alamat', alamatId);
        }
        if (fotoUrl) {
          const fileExt = extname(fotoUrl);
          const path = `${id_pengunjung}${fileExt}`;
          await supabase.storage.from('foto-pengunjung').remove([path]);
        }
      } catch (cleanupError) {
        console.error('Final cleanup failed:', cleanupError);
      }
      throw new BadRequestException(
        'Gagal menyimpan data pengunjung: ' + error.message,
      );
    }

    // 7. Log activity
    try {
      await supabase.from('Activity_Log').insert({
        ID_User: id_pengunjung,
        Role: 'Pengunjung',
        Action: 'Register',
        Description: `Pengunjung ${nama_depan_pengunjung} ${nama_belakang_pengunjung || ''} berhasil mendaftar`,
        IP_Address: ip,
        User_Agent: userAgent,
      });
    } catch (logError) {
      // jika log gagal, tetap lanjutkan
      // tapi tetap log error untuk debugging
      console.error('Activity log failed:', logError);
    }

    return {
      message: 'Registrasi pengunjung berhasil',
      id_pengunjung,
      email,
    };
  }

  async getAllStasiun() {
    const { data, error } = await supabase
      .from('Stasiun')
      .select('ID_Stasiun, Nama_Stasiun')
      .order('Nama_Stasiun', { ascending: true });

    if (error) {
      console.error('Error fetching stasiun:', error);
      throw new Error('Failed to retrieve stasiun data');
    }

    return {
      message: 'Stasiun data retrieved successfully',
      data: data || [],
    };
  }

  async login(
    dto: LoginPengunjungDto,
    ip: string | null,
    userAgent: string | null,
  ) {
    const { email, password } = dto;

    // 1. Autentikasi ke Supabase Auth
    const { data: authData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError || !authData?.user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const user = authData.user;
    const id_pengunjung = user.id;

    // 2. Verifikasi apakah user benar-benar ada di tabel Pengunjung
    const { data: pengunjungData, error: pengunjungError } = await supabase
      .from('Pengunjung')
      .select('Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung')
      .eq('ID_Pengunjung', id_pengunjung)
      .single();

    if (pengunjungError || !pengunjungData) {
      throw new NotFoundException('Data pengunjung tidak ditemukan');
    }

    // 3. Catat log aktivitas
    await supabase.from('Activity_Log').insert({
      ID_User: id_pengunjung,
      Role: 'Pengunjung',
      Action: 'Login',
      Description: `Pengunjung ${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung} berhasil login.`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    // 4. Kembalikan data token dan info user
    return {
      message: 'Login berhasil',
      token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      id_pengunjung,
      email,
      nama: `${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung}`,
    };
  }

  async getJumlahPengunjung(
    access_token: string,
    user_id: string,
  ): Promise<{
    hariIni: number;
    mingguIni: number;
    bulanIni: number;
  }> {
    // 1. Verify user
    const { data: authData, error: authError } = 
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    // 2. hitung jarak waktu
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      // 3. query untuk menghitung
      const queries = [
        // hari ini
        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfDay.toISOString()),

        // minggu
        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfWeek.toISOString()),

        // bulan
        supabase
          .from('Buku_Tamu')
          .select('*', { count: 'exact', head: true })
          .gte('Tanggal_Pengisian', startOfMonth.toISOString()),
      ];

      // 4. Execute  queries
      const [hariIni, mingguIni, bulanIni] = await Promise.all(queries);

      // 5. Handle errors
      if (hariIni.error || mingguIni.error || bulanIni.error) {
        console.error('Error fetching statistics:', {
          hariIniError: hariIni.error,
          mingguIniError: mingguIni.error,
          bulanIniError: bulanIni.error,
        });
        throw new BadRequestException('Gagal mengambil data statistik pengunjung');
      }

      // 6. Return
      return {
        hariIni: hariIni.count || 0,
        mingguIni: mingguIni.count || 0,
        bulanIni: bulanIni.count || 0,
      };
    } catch (error) {
      console.error('Unexpected error in getJumlahPengunjung:', error);
      throw new BadRequestException('Terjadi kesalahan saat memproses permintaan');
    }
  }


  async logout(
    dto: LogoutPengunjungDto,
    ip: string | null,
    userAgent: string | null,
  ) {
    const { id_pengunjung, access_token } = dto;

    // 1. Validasi apakah user benar-benar terautentikasi sebelumnya
    const { data: session, error } = await supabase.auth.getUser(access_token);
    if (error || !session?.user?.id || session.user.id !== id_pengunjung) {
      throw new UnauthorizedException('Token tidak valid atau tidak sesuai');
    }

    // 2. Catat log aktivitas logout
    await supabase.from('Activity_Log').insert({
      ID_User: id_pengunjung,
      Role: 'Pengunjung',
      Action: 'Logout',
      Description: `Pengunjung dengan ID ${id_pengunjung} berhasil logout`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Logout berhasil',
    };
  }

  async getProfile(
    user_id: string,
    access_token: string,
  ): Promise<{
    ID_Pengunjung: string;
    Nama_Depan_Pengunjung: string;
    Nama_Belakang_Pengunjung: string;
    Email_Pengunjung: string;
    No_Telepon_Pengunjung: string;
    Asal_Pengunjung: string;
    Keterangan_Asal_Pengunjung: string;
    Foto_Pengunjung: string | null;
    Alamat: {
      Provinsi: string;
      Provinsi_ID: string;
      Kabupaten: string;
      Kabupaten_ID: string;
      Kecamatan: string;
      Kecamatan_ID: string;
      Kelurahan: string;
      Kelurahan_ID: string;
    } | null;
  }> {
    // 1. Verify access token
    const { data: userData, error: userError } =
      await supabase.auth.getUser(access_token);

    if (userError || !userData?.user?.id || userData.user.id !== user_id) {
      console.error('Token verification failed:', {
        error: userError,
        tokenUserId: userData?.user?.id,
        requestedUserId: user_id,
      });
      throw new UnauthorizedException('Invalid token or user mismatch');
    }

    // 2. Get visitor data
    const { data: pengunjung, error: pengunjungError } = await supabase
      .from('Pengunjung')
      .select('*')
      .eq('ID_Pengunjung', user_id)
      .single();

    if (pengunjungError || !pengunjung) {
      console.error('Visitor data not found:', pengunjungError);
      throw new NotFoundException('Visitor data not found');
    }

    // 3. Get address data if available
    let alamat: {
      Provinsi: string;
      Provinsi_ID: string;
      Kabupaten: string;
      Kabupaten_ID: string;
      Kecamatan: string;
      Kecamatan_ID: string;
      Kelurahan: string;
      Kelurahan_ID: string;
    } | null = null;

    if (pengunjung.ID_Alamat) {
      const { data: alamatData, error: alamatError } = await supabase
        .from('Alamat')
        .select(
          `Provinsi, 
         Provinsi_ID,
         Kabupaten, 
         Kabupaten_ID,
         Kecamatan, 
         Kecamatan_ID,
         Kelurahan, 
         Kelurahan_ID`,
        )
        .eq('ID_Alamat', pengunjung.ID_Alamat)
        .single();

      if (!alamatError && alamatData) {
        alamat = {
          Provinsi: alamatData.Provinsi,
          Provinsi_ID: alamatData.Provinsi_ID,
          Kabupaten: alamatData.Kabupaten,
          Kabupaten_ID: alamatData.Kabupaten_ID,
          Kecamatan: alamatData.Kecamatan,
          Kecamatan_ID: alamatData.Kecamatan_ID,
          Kelurahan: alamatData.Kelurahan,
          Kelurahan_ID: alamatData.Kelurahan_ID,
        };
      }
    }

    return {
      ID_Pengunjung: pengunjung.ID_Pengunjung,
      Nama_Depan_Pengunjung: pengunjung.Nama_Depan_Pengunjung,
      Nama_Belakang_Pengunjung: pengunjung.Nama_Belakang_Pengunjung,
      Email_Pengunjung: pengunjung.Email_Pengunjung,
      No_Telepon_Pengunjung: pengunjung.No_Telepon_Pengunjung,
      Asal_Pengunjung: pengunjung.Asal_Pengunjung,
      Keterangan_Asal_Pengunjung: pengunjung.Keterangan_Asal_Pengunjung,
      Foto_Pengunjung: pengunjung.Foto_Pengunjung ?? null,
      Alamat: alamat,
    };
  }

  async updateProfile(
    dto: UpdatePengunjungDto,
    ip: string | null,
    userAgent: string | null,
    file: Express.Multer.File,
  ): Promise<{
    message: string;
    profile: {
      auth: {
        email: string;
        password_updated: boolean;
      };
      pengunjung: any;
      alamat: any;
    };
  }> {
    const { access_token, id_pengunjung } = dto;

    // 1. Verifikasi token akses dan ambil data user
    const { data: userData, error: userError } =
      await supabase.auth.getUser(access_token);
    if (
      userError ||
      !userData?.user?.id ||
      userData.user.id !== id_pengunjung
    ) {
      throw new UnauthorizedException('Token tidak valid atau tidak cocok');
    }

    // Siapkan response object
    const responseData: any = {
      auth: {
        email: userData.user.email,
        password_updated: false,
      },
      pengunjung: {},
      alamat: null,
    };

    // 2. Siapkan data untuk update
    const updateData: any = {};
    if (dto.nama_depan_pengunjung) {
      updateData.Nama_Depan_Pengunjung = dto.nama_depan_pengunjung;
      responseData.pengunjung.nama_depan = dto.nama_depan_pengunjung;
    }
    if (dto.nama_belakang_pengunjung) {
      updateData.Nama_Belakang_Pengunjung = dto.nama_belakang_pengunjung;
      responseData.pengunjung.nama_belakang = dto.nama_belakang_pengunjung;
    }
    if (dto.no_telepon_pengunjung) {
      updateData.No_Telepon_Pengunjung = dto.no_telepon_pengunjung;
      responseData.pengunjung.no_telepon = dto.no_telepon_pengunjung;
    }
    if (dto.asal_pengunjung) updateData.Asal_Pengunjung = dto.asal_pengunjung;
    if (dto.keterangan_asal_pengunjung)
      updateData.Keterangan_Asal_Pengunjung = dto.keterangan_asal_pengunjung;

    // 3. Update password jika diminta
    if (dto.password) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(
        id_pengunjung,
        { password: dto.password },
      );
      if (pwError) throw new BadRequestException('Gagal mengubah password');
      responseData.auth.password_updated = true;
    }

    // 4. Upload foto jika ada
    if (file) {
      const fileExt = extname(file.originalname);
      const filePath = `pengunjung/${id_pengunjung}${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('foto-pengunjung')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new BadRequestException('Gagal mengunggah foto');
      }

      const { data } = supabase.storage
        .from('foto-pengunjung')
        .getPublicUrl(filePath);
      updateData.Foto_Pengunjung = data.publicUrl;
      responseData.pengunjung.foto_url = data.publicUrl;
    }

    // 5. Tangani alamat baru (jika ada)
    if (dto.alamat) {
      try {
        // Validasi data alamat minimal
        if (
          !dto.alamat.province_id ||
          !dto.alamat.regency_id ||
          !dto.alamat.district_id ||
          !dto.alamat.village_id
        ) {
          throw new Error('Data wilayah administratif tidak lengkap');
        }

        // Dapatkan data wilayah
        const [province, regency, district, village] = await Promise.all([
          this.getProvinceById(dto.alamat.province_id).catch(() => ({
            id: dto.alamat?.province_id,
            name: 'Provinsi Tidak Diketahui',
          })),
          this.getRegencyById(dto.alamat.regency_id).catch(() => ({
            id: dto.alamat?.regency_id,
            name: 'Kabupaten Tidak Diketahui',
          })),
          this.getDistrictById(dto.alamat.district_id).catch(() => ({
            id: dto.alamat?.district_id,
            name: 'Kecamatan Tidak Diketahui',
          })),
          this.getVillageById(dto.alamat.village_id).catch(() => ({
            id: dto.alamat?.village_id,
            name: 'Kelurahan Tidak Diketahui',
          })),
        ]);

        // Siapkan data alamat lengkap
        const alamatData = {
          Provinsi_ID: province.id,
          Provinsi: province.name,
          Kabupaten_ID: regency.id,
          Kabupaten: regency.name,
          Kecamatan_ID: district.id,
          Kecamatan: district.name,
          Kelurahan_ID: village.id,
          Kelurahan: village.name,
        };

        // Cek alamat yang sudah ada
        const { data: existingAlamat, error: checkError } = await supabase
          .from('Alamat')
          .select('ID_Alamat')
          .match({
            Provinsi_ID: alamatData.Provinsi_ID,
            Kabupaten_ID: alamatData.Kabupaten_ID,
            Kecamatan_ID: alamatData.Kecamatan_ID,
            Kelurahan_ID: alamatData.Kelurahan_ID,
          })
          .single();

        let alamatId: string | null = null;

        // Handle error selain "not found"
        if (checkError && checkError.code !== 'PGRST116') {
          throw new Error(`Gagal memeriksa alamat: ${checkError.message}`);
        }

        // Gunakan alamat yang sudah ada atau buat baru
        if (existingAlamat?.ID_Alamat) {
          alamatId = existingAlamat.ID_Alamat;

          // Update alamat yang sudah ada jika diperlukan
          await supabase
            .from('Alamat')
            .update(alamatData)
            .eq('ID_Alamat', alamatId);
        } else {
          const { data: insertedAlamat, error: insertError } = await supabase
            .from('Alamat')
            .insert([alamatData])
            .select('ID_Alamat')
            .single();

          if (insertError)
            throw new Error(`Gagal menyimpan alamat: ${insertError.message}`);
          alamatId = insertedAlamat?.ID_Alamat;
        }

        updateData.ID_Alamat = alamatId;
        responseData.alamat = alamatData;
      } catch (error) {
        console.error('Error saat memproses alamat:', error);
        throw new BadRequestException(
          error.message || 'Gagal memproses data alamat',
        );
      }
    }

    // 6. Update ke tabel Pengunjung dan ambil data terbaru
    const { error: updateError } = await supabase
      .from('Pengunjung')
      .update(updateData)
      .eq('ID_Pengunjung', id_pengunjung);

    if (updateError) {
      throw new BadRequestException('Gagal memperbarui profil pengunjung');
    }

    // Ambil data terbaru
    const { data: pengunjungData } = await supabase
      .from('Pengunjung')
      .select('*')
      .eq('ID_Pengunjung', id_pengunjung)
      .single();

    responseData.pengunjung = pengunjungData;

    // 7. Jika ada alamat, ambil data lengkapnya
    if (pengunjungData?.ID_Alamat) {
      const { data: alamatData } = await supabase
        .from('Alamat')
        .select('*')
        .eq('ID_Alamat', pengunjungData.ID_Alamat)
        .single();

      responseData.alamat = alamatData;
    }

    // 8. Catat Activity Log
    await supabase.from('Activity_Log').insert({
      ID_User: id_pengunjung,
      Role: 'Pengunjung',
      Action: 'Update Profile',
      Description: `Pengunjung dengan ID ${id_pengunjung} melakukan update profil`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Profil pengunjung berhasil diperbarui',
      profile: responseData,
    };
  }

  async resetPasswordPengunjung(
    dto: ResetPasswordPengunjungDto,
    ip: string | null,
    userAgent: string | null,
  ): Promise<{ message: string }> {
    const { email, new_password } = dto;

    // Ambil semua user dari Supabase
    const { data: userList, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw new BadRequestException('Gagal mengambil data pengguna');
    }

    const user = userList.users.find((u) => u.email === email);

    if (!user) {
      throw new NotFoundException('Email tidak ditemukan');
    }

    // Cek apakah user ini adalah pengunjung (cek tabel Pengunjung)
    const { data: pengunjungData, error: pengunjungError } = await supabase
      .from('Pengunjung')
      .select('ID_Pengunjung')
      .eq('ID_Pengunjung', user.id)
      .single();

    if (pengunjungError || !pengunjungData) {
      throw new BadRequestException('Email bukan milik pengunjung');
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: new_password,
      },
    );

    if (updateError) {
      throw new BadRequestException('Gagal mengubah password');
    }

    // Catat aktivitas reset password
    await supabase.from('Activity_Log').insert({
      ID_User: user.id,
      Role: 'Pengunjung',
      Action: 'Reset Password',
      Description: `Pengunjung dengan email ${email} berhasil reset password`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Password berhasil direset',
    };
  }

  async isiBukuTamu(
    dto: IsiBukuTamuDto,
    access_token: string,
    user_id: string,
    ip: string | null,
    userAgent: string | null,
    file?: Express.Multer.File,
  ): Promise<{ message: string }> {
    // 1. Verifikasi token akses
    const { data: userData, error: userError } =
      await supabase.auth.getUser(access_token);
    if (userError || !userData?.user?.id || userData.user.id !== user_id) {
      throw new UnauthorizedException('Token tidak valid atau tidak cocok');
    }

    // 2. Ambil nama pengunjung
    const { data: pengunjungData, error: pengunjungError } = await supabase
      .from('Pengunjung')
      .select('Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung')
      .eq('ID_Pengunjung', user_id)
      .single();

    if (pengunjungError) {
      console.error('Error ambil data pengunjung:', pengunjungError);
    }

    const namaLengkap = pengunjungData
      ? `${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung}`
      : 'Pengunjung';

    const email = userData?.user?.email || '-';

    // 3. Validasi isian DTO
    const { tujuan, id_stasiun } = dto;
    if (!tujuan || !id_stasiun) {
      throw new BadRequestException('Tujuan dan ID stasiun wajib diisi');
    }

    // 4. Upload tanda tangan jika ada
    let fileUrl: string | null = null;
    if (file) {
      const path = `tanda-tangan/${uuidv4()}${extname(file.originalname)}`;
      const { error: uploadError } = await supabase.storage
        .from('tanda-tangan')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new BadRequestException('Gagal mengunggah tanda tangan');
      }

      const urlData = supabase.storage.from('tanda-tangan').getPublicUrl(path);
      fileUrl = urlData.data?.publicUrl;

      if (!fileUrl) {
        console.error('Gagal mendapatkan URL publik');
        throw new BadRequestException('Gagal mendapatkan URL tanda tangan');
      }
    }

    const { data: stasiunData, error: stasiunError } = await supabase
      .from('Stasiun')
      .select('ID_Stasiun')
      .eq('ID_Stasiun', id_stasiun)
      .single();

    if (stasiunError || !stasiunData) {
      throw new BadRequestException('ID Stasiun tidak ditemukan');
    }

    // Format waktu kunjungan: hari, tanggal bulan tahun, jam
    const now = new Date();
    const optionsDate: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    const hariTanggal = now.toLocaleDateString('id-ID', optionsDate);
    const jam = now.toLocaleTimeString('id-ID', optionsTime);
    const waktuKunjungan = `${hariTanggal}, ${jam}`;

    // 5. Simpan ke tabel Buku_Tamu
    const { error: insertError } = await supabase.from('Buku_Tamu').insert({
      ID_Pengunjung: user_id,
      ID_Stasiun: id_stasiun,
      Tujuan: tujuan,
      Tanda_Tangan: fileUrl,
      Waktu_Kunjungan: waktuKunjungan,
    });

    if (insertError) {
      console.error('Insert Buku_Tamu error:', insertError);
      throw new BadRequestException('Gagal menyimpan buku tamu');
    }

    // 6. Catat Activity Log
    await supabase.from('Activity_Log').insert({
      ID_User: user_id,
      Role: 'Pengunjung',
      Action: 'Isi Buku Tamu',
      Description: `Pengunjung ${namaLengkap} (${email}) mengisi buku tamu di stasiun ${id_stasiun}`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Data buku tamu berhasil disimpan',
    };
  }

  async getRiwayatBukuTamu(user_id: string, access_token: string) {
    // 1. Verifikasi token
    const { data: userData, error: userError } =
      await supabase.auth.getUser(access_token);

    if (userError || !userData?.user?.id || userData.user.id !== user_id) {
      throw new UnauthorizedException('Token tidak valid atau tidak cocok');
    }

    // 2. Ambil semua riwayat buku tamu
    const { data: bukuTamuRecords, error: bukuTamuError } = await supabase
      .from('Buku_Tamu')
      .select('*')
      .eq('ID_Pengunjung', user_id)
      .order('Waktu_Kunjungan', { ascending: false });

    if (bukuTamuError) {
      console.error('Error fetching guest book history:', bukuTamuError);
      throw new NotFoundException('Gagal mengambil riwayat buku tamu');
    }

    if (!bukuTamuRecords || bukuTamuRecords.length === 0) {
      return {
        status: 'success',
        data: [],
        message: 'Tidak ada riwayat kunjungan ditemukan',
      };
    }

    // 3. Ambil semua stasiun
    const { data: stasiunData, error: stasiunError } = await supabase
      .from('Stasiun')
      .select('ID_Stasiun, Nama_Stasiun');

    if (stasiunError) {
      console.error('Error fetching stasiun data:', stasiunError);
      throw new NotFoundException('Gagal mengambil data stasiun');
    }

    const stasiunMap = new Map(
      (stasiunData ?? []).map((s) => [s.ID_Stasiun, s.Nama_Stasiun]),
    );

    // 4. Ambil semua pengunjung
    const { data: pengunjungData, error: pengunjungError } = await supabase
      .from('Pengunjung')
      .select(
        'ID_Pengunjung, Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung, Email_Pengunjung',
      );

    if (pengunjungError) {
      console.error('Error fetching pengunjung data:', pengunjungError);
      throw new NotFoundException('Gagal mengambil data pengunjung');
    }

    const pengunjungMap = new Map(
      (pengunjungData ?? []).map((p) => [
        p.ID_Pengunjung,
        {
          nama: `${p.Nama_Depan_Pengunjung} ${p.Nama_Belakang_Pengunjung}`.trim(),
          email: p.Email_Pengunjung,
        },
      ]),
    );

    // 5. Format hasil
    const formattedData = bukuTamuRecords.map((record) => ({
      id: record.ID_Buku_Tamu,
      tujuan: record.Tujuan,
      waktu_kunjungan: record.Waktu_Kunjungan,
      tanda_tangan: record.Tanda_Tangan,
      stasiun: stasiunMap.get(record.ID_Stasiun) || 'Stasiun tidak diketahui',
      status: record.Status,
      pengunjung:
        pengunjungMap.get(record.ID_Pengunjung)?.nama ||
        'Pengunjung tidak diketahui',
      email:
        pengunjungMap.get(record.ID_Pengunjung)?.email ||
        'Email tidak tersedia',
    }));

    return {
      status: 'success',
      data: formattedData,
    };
  }
}
