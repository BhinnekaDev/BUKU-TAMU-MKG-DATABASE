import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { RegisterPengunjungDto } from '@/pengunjung/dto/register-pengunjung.dto';
import { ResetPasswordPengunjungDto } from '@/pengunjung/dto/reset-password-pengunjung.dto';
import { UpdatePengunjungDto } from '@/pengunjung/dto/update-pengunjung.dto';
import { supabase } from '@/supabase/supabase.client';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PengunjungService {
  async register(
    dto: RegisterPengunjungDto,
    ip: string | null,
    userAgent: string | null,
    file: Express.Multer.File,
  ) {
    const {
      email,
      password,
      nama_depan_pengunjung,
      nama_belakang_pengunjung,
      no_telepon_pengunjung,
      asal_pengunjung,
      keterangan_asal_pengunjung,
      alamat,
      foto_pengunjung,
    } = dto;

    // 1. Cek apakah email sudah digunakan di Supabase Auth
    let existingUsers;
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        throw new Error('Gagal ambil daftar user dari Supabase Auth');
      }

      existingUsers = data?.users?.filter((user) => user.email === email);
    } catch (err) {
      throw new BadRequestException('Gagal cek email di Supabase');
    }

    if (existingUsers?.length) {
      throw new BadRequestException('Email sudah digunakan');
    }

    // 2. Daftarkan user ke Supabase Auth
    const { data: userData, error: registerError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (registerError || !userData?.user?.id) {
      throw new BadRequestException('Gagal mendaftarkan user ke Supabase Auth');
    }

    const id_pengunjung = userData.user.id;

    // 3. Simpan alamat (jika ada)
    let alamatId = null;
    if (alamat) {
      // Cek apakah alamat yang sama sudah ada
      const { data: existingAlamat, error: checkAlamatError } = await supabase
        .from('Alamat')
        .select('ID_Alamat')
        .match({
          Provinsi: alamat.Provinsi,
          Kabupaten: alamat.Kabupaten,
          Kecamatan: alamat.Kecamatan,
          Kelurahan: alamat.Kelurahan,
          Kode_Pos: alamat.Kode_Pos,
          RT: alamat.RT,
          RW: alamat.RW,
          Alamat_Jalan: alamat.Alamat_Jalan,
        })
        .single();

      if (checkAlamatError && checkAlamatError.code !== 'PGRST116') {
        throw new BadRequestException('Gagal mengecek data alamat');
      }

      if (existingAlamat?.ID_Alamat) {
        alamatId = existingAlamat.ID_Alamat;
      } else {
        // Insert alamat baru jika belum ada
        const { error: insertAlamatError, data: alamatData } = await supabase
          .from('Alamat')
          .insert([alamat])
          .select('ID_Alamat')
          .single();

        if (insertAlamatError || !alamatData?.ID_Alamat) {
          throw new BadRequestException('Gagal menyimpan data alamat');
        }

        alamatId = alamatData.ID_Alamat;
      }
    }

    let fotoUrl: string | null = null;

    if (file) {
      const path = `${id_pengunjung}${extname(file.originalname)}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-pengunjung')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload foto error:', uploadError);
        throw new BadRequestException('Gagal mengunggah foto pengunjung');
      }

      const { data: urlData } = supabase.storage
        .from('foto-pengunjung')
        .getPublicUrl(path);

      fotoUrl = urlData.publicUrl;
    }

    // 4. Simpan data pengunjung
    const { error: pengunjungError } = await supabase
      .from('Pengunjung')
      .insert({
        ID_Pengunjung: id_pengunjung,
        ID_Alamat: alamatId,
        Nama_Depan_Pengunjung: nama_depan_pengunjung,
        Nama_Belakang_Pengunjung: nama_belakang_pengunjung,
        Email_Pengunjung: email,
        No_Telepon_Pengunjung: no_telepon_pengunjung,
        Asal_Pengunjung: asal_pengunjung,
        Keterangan_Asal_Pengunjung: keterangan_asal_pengunjung,
        Foto_Pengunjung: fotoUrl,
      });

    if (pengunjungError) {
      throw new BadRequestException(
        'Gagal menyimpan data pengunjung ke database',
      );
    }

    // 5. Catat ke Activity_Log
    await supabase.from('Activity_Log').insert({
      ID_User: id_pengunjung,
      Role: 'Pengunjung',
      Action: 'Register',
      Description: `Pengunjung ${nama_depan_pengunjung} ${nama_belakang_pengunjung} berhasil mendaftar dengan ID: ${id_pengunjung} dan Email: ${email}`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Registrasi pengunjung berhasil',
      id_pengunjung,
      email,
    };
  }

  async login(
    dto: LoginPengunjungDto,
    ip: string | null,
    userAgent: string | null,
  ) {
    const { email, password } = dto;

    // 1. Autentikasi via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 2. Validasi hasil login
    const session = data?.session;
    const user = data?.user;

    if (error || !session?.access_token || !user?.id) {
      console.error('Login error:', error);
      throw new UnauthorizedException('Email atau password salah');
    }

    const id_pengunjung = user.id;

    // 3. Catat ke Activity_Log
    await supabase.from('Activity_Log').insert({
      ID_User: id_pengunjung,
      Role: 'Pengunjung',
      Action: 'Login',
      Description: `Pengunjung dengan email ${email} berhasil login`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    // 4. Kembalikan data
    return {
      message: 'Login berhasil',
      access_token: session.access_token,
      user: {
        id: id_pengunjung,
        email,
      },
    };
  }

  async logout(token: string, ip: string | null, userAgent: string | null) {
    // Hilangkan "Bearer " jika ada
    const rawToken = token.startsWith('Bearer ')
      ? token.replace('Bearer ', '')
      : token;

    // 1. Verifikasi token ke Supabase
    const { data, error } = await supabase.auth.getUser(rawToken);

    if (error || !data?.user?.id) {
      throw new UnauthorizedException({
        message: 'Token tidak valid atau sudah logout',
        detail: error?.message || null,
      });
    }

    const id_pengunjung = data.user.id;

    // 2. Ambil nama pengunjung
    const { data: pengunjungData } = await supabase
      .from('Pengunjung')
      .select('Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung')
      .eq('ID_Pengunjung', id_pengunjung)
      .single();

    const namaLengkap = pengunjungData
      ? `${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung}`
      : 'Pengunjung';

    // 3. Log aktivitas
    await supabase.from('Activity_Log').insert({
      ID_User: id_pengunjung,
      Role: 'Pengunjung',
      Action: 'Logout',
      Description: `Pengunjung dengan nama: ${namaLengkap} berhasil logout`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Logout berhasil',
    };
  }

  async getProfile(token: string) {
    const rawToken = token.startsWith('Bearer ')
      ? token.replace('Bearer ', '')
      : token;

    let payload: any;
    try {
      const { data, error } = await supabase.auth.getUser(rawToken);

      if (error || !data?.user?.id) {
        throw new Error('Token tidak valid atau user tidak ditemukan');
      }

      payload = data.user;
    } catch (err) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const userId = payload.id;

    // Ambil data dari tabel Pengunjung
    const { data: pengunjung, error: pengunjungError } = await supabase
      .from('Pengunjung')
      .select(
        `
        ID_Pengunjung,
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
        Keterangan_Asal_Pengunjung,
        Foto_Pengunjung,
        Alamat (
          Provinsi,
          Kabupaten,
          Kecamatan,
          Kelurahan,
          Kode_Pos,
          RT,
          RW,
          Alamat_Jalan
        )
      `,
      )
      .eq('ID_Pengunjung', userId)
      .single();

    if (pengunjungError || !pengunjung) {
      throw new NotFoundException('Data pengunjung tidak ditemukan');
    }

    return pengunjung;
  }

  async updateProfile(
    token: string,
    dto: UpdatePengunjungDto,
    ip: string | null,
    userAgent: string | null,
    file?: Express.Multer.File,
  ): Promise<any> {
    const rawToken = token.startsWith('Bearer ')
      ? token.replace('Bearer ', '')
      : token;

    const { data: user, error: verifyError } =
      await supabase.auth.getUser(rawToken);

    if (verifyError || !user?.user?.id) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const id_pengunjung = user.user.id;

    const { data: existingPengunjung, error: getOldDataError } = await supabase
      .from('Pengunjung')
      .select('Foto_Pengunjung')
      .eq('ID_Pengunjung', id_pengunjung)
      .single();

    if (getOldDataError) {
      console.error(getOldDataError);
      throw new BadRequestException('Gagal mengambil data pengunjung lama');
    }

    if (!existingPengunjung) {
      throw new NotFoundException('Data pengunjung tidak ditemukan');
    }

    let fotoUrl: string | undefined;

    if (file) {
      if (existingPengunjung?.Foto_Pengunjung) {
        const oldFotoUrl = existingPengunjung.Foto_Pengunjung;

        const storageBaseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-pengunjung/`;
        const oldPath = oldFotoUrl.replace(storageBaseUrl, '');

        if (oldPath) {
          const { error: deleteOldFotoError } = await supabase.storage
            .from('foto-pengunjung')
            .remove([oldPath]);

          if (deleteOldFotoError) {
            console.error(
              `Gagal menghapus foto lama "${oldPath}":`,
              deleteOldFotoError.message || deleteOldFotoError,
            );
          }
        }
      }

      const ext = extname(file.originalname);
      const uniqueName = `${id_pengunjung}-${randomUUID()}${ext}`;
      const path = `${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-pengunjung')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload foto error:', uploadError);
        throw new BadRequestException('Gagal mengunggah foto pengunjung');
      }

      const { data: urlData } = supabase.storage
        .from('buku-tamu-mkg')
        .getPublicUrl(path);

      fotoUrl = urlData.publicUrl;
    }

    if (dto.password) {
      const { error: updateAuthError } =
        await supabase.auth.admin.updateUserById(id_pengunjung, {
          ...(dto.password && { password: dto.password }),
        });

      if (updateAuthError) {
        throw new BadRequestException('Gagal mengupdate akun Auth');
      }
    }

    let alamatId = null;
    if (dto.alamat) {
      const { data: existingAlamat, error: checkAlamatError } = await supabase
        .from('Alamat')
        .select('ID_Alamat')
        .match(
          Object.fromEntries(
            Object.entries(dto.alamat).filter(
              ([_, value]) => value !== undefined,
            ),
          ),
        )
        .single();

      if (checkAlamatError && checkAlamatError.code !== 'PGRST116') {
        throw new BadRequestException('Gagal mengecek data alamat');
      }

      if (existingAlamat?.ID_Alamat) {
        alamatId = existingAlamat.ID_Alamat;
      } else {
        const { data: alamatData, error: insertAlamatError } = await supabase
          .from('Alamat')
          .insert([dto.alamat])
          .select('ID_Alamat')
          .single();

        if (insertAlamatError) {
          throw new BadRequestException('Gagal menyimpan data alamat');
        }

        alamatId = alamatData.ID_Alamat;
      }
    }

    const updateData: any = {
      ...(dto.nama_depan_pengunjung && {
        Nama_Depan_Pengunjung: dto.nama_depan_pengunjung,
      }),
      ...(dto.nama_belakang_pengunjung && {
        Nama_Belakang_Pengunjung: dto.nama_belakang_pengunjung,
      }),
      ...(dto.no_telepon_pengunjung && {
        No_Telepon_Pengunjung: dto.no_telepon_pengunjung,
      }),
      ...(dto.keterangan_asal_pengunjung && {
        Keterangan_Asal_Pengunjung: dto.keterangan_asal_pengunjung,
      }),
      ...(alamatId !== null ? { ID_Alamat: alamatId } : {}),
      ...(fotoUrl && { Foto_Pengunjung: fotoUrl }),
    };

    const { error: pengunjungUpdateError } = await supabase
      .from('Pengunjung')
      .update(updateData)
      .eq('ID_Pengunjung', id_pengunjung);

    if (pengunjungUpdateError) {
      throw new BadRequestException('Gagal mengupdate data pengunjung');
    }

    const { error: logError } = await supabase.from('Activity_Log').insert([
      {
        ID_User: id_pengunjung,
        Role: 'Pengunjung',
        Action: 'Update Profile',
        Description: `Pengunjung dengan ID: ${id_pengunjung} berhasil memperbarui profil`,
        IP_Address: ip,
        User_Agent: userAgent,
      },
    ]);
    if (logError) {
      console.error('Gagal mencatat aktivitas:', logError);
    }

    return {
      message: 'Profil berhasil diperbarui',
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
    file: Express.Multer.File,
    ip: string | null,
    userAgent: string | null,
    token: string,
  ) {
    const { tujuan, id_stasiun: idStasiun } = dto;

    if (!file) {
      throw new BadRequestException('Tanda tangan (gambar) wajib diunggah');
    }

    const rawToken = token.startsWith('Bearer ')
      ? token.replace('Bearer ', '')
      : token;

    const { data: userData, error } = await supabase.auth.getUser(rawToken);
    if (error || !userData?.user) {
      console.error('Token tidak valid:', error);
      throw new UnauthorizedException('Token tidak valid');
    }

    const user = userData.user;
    const id_pengunjung = user.id;
    const email = user.email;

    const { data: pengunjungData, error: pengunjungError } = await supabase
      .from('Pengunjung')
      .select('Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung')
      .eq('ID_Pengunjung', id_pengunjung)
      .single();

    if (pengunjungError) {
      console.error('Error ambil data pengunjung:', pengunjungError);
    }

    const namaLengkap = pengunjungData
      ? `${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung}`
      : 'Pengunjung';

    if (!tujuan || !idStasiun) {
      throw new BadRequestException('Tujuan dan ID stasiun wajib diisi');
    }

    // Upload ke Supabase Storage
    const path = `${uuidv4()}${extname(file.originalname)}`;
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
    const fileUrl = urlData.data?.publicUrl;
    if (!fileUrl) {
      console.error('Gagal mendapatkan URL publik');
      throw new BadRequestException('Gagal mendapatkan URL tanda tangan');
    }

    // Simpan ke database
    const { error: insertError } = await supabase.from('Buku_Tamu').insert({
      ID_Pengunjung: id_pengunjung,
      ID_Stasiun: idStasiun,
      Tujuan: tujuan,
      Tanda_Tangan: fileUrl,
    });

    if (insertError) {
      console.error('Insert Buku_Tamu error:', insertError);
      throw new BadRequestException('Gagal menyimpan buku tamu');
    }

    await supabase.from('Activity_Log').insert({
      ID_User: id_pengunjung,
      Role: 'Pengunjung',
      Action: 'Isi Buku Tamu',
      Description: `Pengunjung ${namaLengkap} (${email}) mengisi buku tamu di stasiun ${idStasiun}`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Data buku tamu berhasil disimpan',
    };
  }
}
