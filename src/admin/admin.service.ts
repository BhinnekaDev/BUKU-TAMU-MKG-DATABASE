import { SupabaseService } from '@/supabase/supabase.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import dayjs from 'dayjs';
import 'dayjs/locale/id';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';

import { readFileSync } from 'fs';
import { join } from 'path';

dayjs.extend(customParseFormat);
dayjs.locale('id');
dayjs.extend(isoWeek);

import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { ResetPasswordAdminDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateProfileAdminDto } from '@/admin/dto/update-profile-admin.dto';

import { SupabaseUser } from '@/interfaces/supabase-user.interface';

interface BukuTamuWithPengunjung {
  ID_Buku_Tamu: string;
  ID_Pengunjung: string;
  ID_Stasiun: string;
  Tujuan: string;
  Waktu_Kunjungan: string;
  Tanda_Tangan: string;
  Pengunjung: {
    Nama_Depan_Pengunjung: string | null;
    Nama_Belakang_Pengunjung: string | null;
    Email_Pengunjung: string | null;
    No_Telepon_Pengunjung: string | null;
    Asal_Pengunjung: string | null;
    Asal_Instansi: string | null;
    Alamat_Lengkap: string | null;
  } | null;
  Stasiun: {
    Nama_Stasiun: string | null;
  } | null;
}

@Injectable()
export class AdminService {
  constructor(private readonly supabaseService: SupabaseService) {}

  //*** Fungsi register admin tampa verivikasi ***
  async registerAdmin(body: any, foto?: Express.Multer.File) {
    const {
      nama_depan,
      nama_belakang,
      email,
      password,
      confirmPassword,
      id_stasiun,
      peran,
    } = body;

    const cleanStasiunId = id_stasiun?.trim() || null;

    if (!nama_depan || !email || !password || !confirmPassword || !peran) {
      throw new BadRequestException('Field wajib belum lengkap');
    }

    if (peran === 'Admin' && !cleanStasiunId) {
      throw new BadRequestException('ID Stasiun wajib diisi untuk Admin');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password minimal 6 karakter');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok');
    }

    const supabase = this.supabaseService.getClient();
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const { data: existingAdmin } = await supabase
      .from('Admin')
      .select('Email_Admin')
      .eq('Email_Admin', email)
      .maybeSingle();

    if (existingAdmin) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const { data: newUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError) {
      throw new BadRequestException(
        'Gagal membuat akun: ' + createUserError.message,
      );
    }

    const newUserId = newUser.user.id;

    let fotoUrl: string;

    if (foto) {
      if (!['image/jpeg', 'image/png'].includes(foto.mimetype)) {
        throw new BadRequestException('Format foto harus JPG / PNG');
      }

      if (foto.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Ukuran foto maksimal 10MB');
      }

      const fileExt = foto.originalname.split('.').pop();
      const uniqueId = randomUUID();
      const fileName = `${newUserId}_${uniqueId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-admin')
        .upload(fileName, foto.buffer, {
          contentType: foto.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new BadRequestException('Gagal upload foto');
      }

      fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${fileName}`;
    } else {
      // Foto default
      const defaultPath = join(process.cwd(), 'src', 'public', 'Logo_BMKG.png');
      const buffer = readFileSync(defaultPath);
      const uniqueId = randomUUID();
      const fileName = `${newUserId}_${uniqueId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('foto-admin')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw new BadRequestException('Gagal upload foto default');
      }

      fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${fileName}`;
    }

    const { error: insertError } = await supabase.from('Admin').insert([
      {
        ID_Admin: newUserId,
        Nama_Depan_Admin: nama_depan,
        Nama_Belakang_Admin: nama_belakang || null,
        Email_Admin: email,
        Peran: peran,
        ID_Stasiun: cleanStasiunId,
        Foto_Admin: fotoUrl,
        Created_At: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      throw new BadRequestException(
        'Gagal menyimpan data admin: ' + insertError.message,
      );
    }

    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select(
        `
      ID_Admin,
      Email_Admin,
      Nama_Depan_Admin,
      Nama_Belakang_Admin,
      Peran,
      Foto_Admin,
      ID_Stasiun,
      Stasiun (
        Nama_Stasiun
      )
    `,
      )
      .eq('ID_Admin', newUserId)
      .single();

    if (adminError) {
      throw new BadRequestException('Gagal mengambil data admin');
    }

    return {
      message: 'Registrasi admin berhasil',
      user_id: adminData.ID_Admin,
      email: adminData.Email_Admin,
      nama_depan: adminData.Nama_Depan_Admin,
      nama_belakang: adminData.Nama_Belakang_Admin,
      peran: adminData.Peran,
      foto: adminData.Foto_Admin,
      stasiun_id: adminData.ID_Stasiun,
      stasiun_nama: adminData.Stasiun?.[0]?.Nama_Stasiun ?? null,
    };
  }

  //*** Fungsi login admin ***
  async loginAdmin(dto: LoginAdminDto) {
    //*** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();

    //*** Langkah 2: Login ke Supabase Auth ***
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (loginError || !loginData.session) {
      throw new UnauthorizedException(
        `Login gagal: ${loginError?.message || 'Email atau password salah'}`,
      );
    }

    const session = loginData.session;
    const user = loginData.user;

    // Set session ke Supabase client
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    //*** Langkah 3: Ambil data admin berdasarkan email ***
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('Admin')
      .select(
        'ID_Admin, Peran, Nama_Depan_Admin, Nama_Belakang_Admin, Email_Admin, ID_Stasiun',
      )
      .eq('Email_Admin', dto.email)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException(
        `Gagal ambil data admin: ${adminError?.message || 'Data admin tidak ditemukan'}`,
      );
    }

    //*** Langkah 4: Validasi konsistensi ID_Stasiun dengan peran ***
    const { ID_Stasiun, Peran } = adminData;

    if (ID_Stasiun) {
      const { data: stasiunData, error: stasiunError } = await supabaseAdmin
        .from('Stasiun')
        .select('ID_Stasiun')
        .eq('ID_Stasiun', ID_Stasiun)
        .single();

      if (stasiunError || !stasiunData) {
        throw new BadRequestException(
          `ID_Stasiun tidak valid atau tidak ditemukan di tabel Stasiun.`,
        );
      }

      if (Peran !== 'Admin') {
        throw new BadRequestException(
          `Peran tidak sesuai. Akun dengan ID_Stasiun harus berperan sebagai Admin.`,
        );
      }
    } else {
      if (Peran !== 'Superadmin') {
        throw new BadRequestException(
          `Peran tidak sesuai. Akun tanpa ID_Stasiun harus berperan sebagai Superadmin.`,
        );
      }
    }

    //*** Langkah 4: Kembalikan response ***
    return {
      message: 'Login berhasil',
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user_id: user.id,
      peran: adminData.Peran,
      nama_depan: adminData.Nama_Depan_Admin,
      nama_belakang: adminData.Nama_Belakang_Admin,
      id_stasiun: adminData.ID_Stasiun,
      expires_at: session.expires_at,
    };
  }

  //*** Fungsi untuk mereset password admin dengan memasukan email dan password baru ***
  async resetPasswordAdmin(dto: ResetPasswordAdminDto) {
    //*** Langkah 1: Dapatkan client Supabase Admin ***
    const supabaseAdmin = this.supabaseService.getAdminClient();

    //*** Langkah 2: Validasi input ***
    if (!dto.email || !dto.newPassword) {
      throw new BadRequestException('Email dan password baru wajib diisi');
    }

    //*** Langkah 3: Cari user berdasarkan email secara langsung ***
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw new BadRequestException(`Gagal mencari user: ${listError.message}`);
    }

    const user = listData.users.find((u) => u.email === dto.email);
    if (!user || !user.id) {
      throw new BadRequestException(
        `User dengan email ${dto.email} tidak ditemukan`,
      );
    }

    //*** Langkah 4: Update password user ***
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: dto.newPassword,
      });

    if (updateError) {
      throw new BadRequestException(
        `Gagal memperbarui password: ${updateError.message}`,
      );
    }

    //*** Langkah 6: Kembalikan response ***
    return {
      message: 'Password berhasil direset',
      email: dto.email,
    };
  }

  //*** Fungsi untuk mendapatkan profil admin ***
  async getProfile(user_id: string) {
    // *** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();

    // *** Langkah 2: Ambil data admin dari tabel Admin ***
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select(
        `
      ID_Admin, 
      Email_Admin, 
      Nama_Depan_Admin, 
      Nama_Belakang_Admin, 
      Peran,
      Foto_Admin, 
      ID_Stasiun,
      Stasiun (
        Nama_Stasiun
      )
    `,
      )
      .eq('ID_Admin', user_id)
      .single();

    if (adminError) {
      console.error('Admin data fetch error:', adminError);
      throw new BadRequestException('Gagal mengambil data admin');
    }

    if (!adminData) {
      throw new NotFoundException('Data admin tidak ditemukan');
    }

    // *** Langkah 3: Transformasi data untuk response ***
    const transformedData = {
      user_id: adminData.ID_Admin,
      email: adminData.Email_Admin,
      nama_depan: adminData.Nama_Depan_Admin,
      nama_belakang: adminData.Nama_Belakang_Admin,
      peran: adminData.Peran,
      foto: adminData.Foto_Admin,
      stasiun_id: adminData.ID_Stasiun,
      stasiun_nama: adminData.Stasiun?.[0]?.Nama_Stasiun ?? null,
    };

    // *** Langkah 4: Kembalikan response ***
    return {
      message: 'Profil admin berhasil diambil',
      data: transformedData,
    };
  }

  //*** Fungsi untuk memperbarui profil admin (nama depan, nama belakang, password, foto) ***
  async updateProfile(
    user: SupabaseUser,
    user_id: string,
    dto: UpdateProfileAdminDto,
    foto?: Express.Multer.File,
  ): Promise<any> {
    //*** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const userId = user.id;

    //*** Langkah 2: Ambil data admin dari tabel Admin ***
    const { data: existingAdmin, error: adminError } = await supabase
      .from('Admin')
      .select('Nama_Depan_Admin, Nama_Belakang_Admin, Foto_Admin')
      .eq('ID_Admin', userId)
      .single();

    if (adminError || !existingAdmin) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    let fotoUrl = existingAdmin.Foto_Admin;
    let uploadedFileName: string | null = null;
    const updatedFields: string[] = [];

    try {
      //*** Langkah 3: Handle upload foto jika ada ***
      if (foto) {
        if (!['image/jpeg', 'image/png'].includes(foto.mimetype)) {
          throw new BadRequestException('Format file harus JPG atau PNG');
        }
        if (foto.size > 10 * 1024 * 1024) {
          throw new BadRequestException('Ukuran file maksimal 10MB');
        }

        const fileExt = foto.originalname.split('.').pop();
        uploadedFileName = `${user_id}_${crypto.randomUUID()}.${fileExt}`;

        // hapus foto lama jika ada
        if (fotoUrl) {
          await this.deleteOldPhoto(fotoUrl);
        }

        const { error: uploadError } = await supabase.storage
          .from('foto-admin')
          .upload(uploadedFileName, foto.buffer, {
            contentType: foto.mimetype,
            upsert: true,
          });

        if (uploadError) {
          throw new BadRequestException('Gagal mengunggah foto baru');
        }

        fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${uploadedFileName}`;
        updatedFields.push('foto');
      }

      //*** Langkah 4: Update password jika ada ***
      if (dto.password) {
        if (dto.password !== dto.confirmPassword) {
          throw new BadRequestException('Konfirmasi password tidak cocok');
        }

        const { error: pwError } =
          await supabaseAdmin.auth.admin.updateUserById(user_id, {
            password: dto.password,
          });

        if (pwError) {
          throw new BadRequestException('Gagal memperbarui password');
        }
        updatedFields.push('password');
      }

      //*** Langkah 5: Siapkan payload update untuk tabel Admin ***
      const updatePayload: Record<string, any> = {};
      if (dto.nama_depan && dto.nama_depan !== existingAdmin.Nama_Depan_Admin) {
        updatePayload.Nama_Depan_Admin = dto.nama_depan;
        updatedFields.push('nama_depan');
      }
      if (
        dto.nama_belakang &&
        dto.nama_belakang !== existingAdmin.Nama_Belakang_Admin
      ) {
        updatePayload.Nama_Belakang_Admin = dto.nama_belakang;
        updatedFields.push('nama_belakang');
      }
      if (fotoUrl && fotoUrl !== existingAdmin.Foto_Admin) {
        updatePayload.Foto_Admin = fotoUrl;
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from('Admin')
          .update(updatePayload)
          .eq('ID_Admin', user_id);

        if (updateError) {
          throw new BadRequestException('Gagal memperbarui profil admin');
        }
      }

      const { data: updatedAdmin } = await supabase
        .from('Admin')
        .select('Nama_Depan_Admin, Nama_Belakang_Admin, Foto_Admin')
        .eq('ID_Admin', user_id)
        .single();

      //*** Langkah 6: Format response ***
      return {
        message:
          updatedFields.length > 0
            ? 'Profil admin berhasil diperbarui'
            : 'Tidak ada perubahan yang dilakukan',
        data: {
          nama_depan:
            updatedAdmin?.Nama_Depan_Admin || existingAdmin.Nama_Depan_Admin,
          nama_belakang:
            updatedAdmin?.Nama_Belakang_Admin ||
            existingAdmin.Nama_Belakang_Admin,
          foto: updatedAdmin?.Foto_Admin || existingAdmin.Foto_Admin,
        },
        updated_fields: updatedFields,
      };
    } catch (error) {
      if (uploadedFileName) {
        await supabase.storage
          .from('foto-admin')
          .remove([uploadedFileName])
          .catch((cleanupError) =>
            console.error('Gagal hapus foto baru:', cleanupError),
          );
      }
      throw error;
    }
  }

  //*** Fungsi untuk menghapus foto lama dari storage Supabase ***
  private async deleteOldPhoto(fotoUrl: string): Promise<void> {
    //*** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();
    //*** Langkah 2: Hapus file dari storage Supabase ***
    try {
      if (!fotoUrl) return; // kalau kosong, skip

      const oldFileName = fotoUrl.split('/').pop();

      if (oldFileName) {
        const { error } = await supabase.storage
          .from('foto-admin')
          .remove([oldFileName]);

        if (error) {
          console.error('Gagal menghapus foto lama:', error.message);
        }
      }
    } catch (err) {
      console.error('Gagal menghapus foto lama (exception):', err);
    }
  }

  //*** Fungsi untuk mendapatkan data Buku Tamu dengan filter periode dan stasiun ***
  async getBukuTamu(
    user: SupabaseUser,
    user_id: string,
    period?: 'today' | 'week' | 'month',
    startDate?: string,
    endDate?: string,
    filterStasiunId?: string,
  ) {
    //*** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();
    const userId = user.id;

    //*** Langkah 2: Ambil data admin untuk cek peran dan ID_Stasiun ***
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select(`ID_Admin, Peran, ID_Stasiun`)
      .eq('ID_Admin', userId)
      .single();

    if (adminError) {
      console.error('Admin data fetch error:', adminError);
      throw new BadRequestException('Gagal mengambil data admin');
    }
    if (!adminData) throw new NotFoundException('Admin tidak ditemukan');
    const isSuperadmin = adminData.Peran === 'Superadmin';
    if (!isSuperadmin && filterStasiunId) {
      throw new ForbiddenException(
        'Anda tidak boleh filter berdasarkan ID Stasiun',
      );
    }

    //*** Langkah 3: Bangun query Buku_Tamu dengan filter yang diberikan ***
    let bukuTamuQuery = supabase
      .from('Buku_Tamu')
      .select(
        `
      ID_Buku_Tamu,
      ID_Pengunjung,
      ID_Stasiun,
      Tujuan,
      Waktu_Kunjungan,
      Tanda_Tangan,
      Pengunjung:ID_Pengunjung!inner(
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
        Asal_Instansi,
        Alamat_Lengkap
      ),
      Stasiun:ID_Stasiun!inner(Nama_Stasiun)
    `,
      )
      .order('Waktu_Kunjungan', { ascending: false });

    //*** Langkah 4: Filter berdasarkan peran admin ***
    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun)
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
    } else if (filterStasiunId) {
      bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', filterStasiunId);
    }

    //*** Langkah 5: Filter berdasarkan periode atau rentang tanggal ***
    const now = dayjs();
    if (startDate && endDate) {
      bukuTamuQuery = bukuTamuQuery
        .gte('Waktu_Kunjungan', dayjs(startDate).startOf('day').toISOString())
        .lte('Waktu_Kunjungan', dayjs(endDate).endOf('day').toISOString());
    } else if (period === 'today') {
      bukuTamuQuery = bukuTamuQuery
        .gte('Waktu_Kunjungan', now.startOf('day').toISOString())
        .lte('Waktu_Kunjungan', now.endOf('day').toISOString());
    } else if (period === 'week') {
      bukuTamuQuery = bukuTamuQuery
        .gte('Waktu_Kunjungan', now.startOf('week').toISOString())
        .lte('Waktu_Kunjungan', now.endOf('week').toISOString());
    } else if (period === 'month') {
      bukuTamuQuery = bukuTamuQuery
        .gte('Waktu_Kunjungan', now.startOf('month').toISOString())
        .lte('Waktu_Kunjungan', now.endOf('month').toISOString());
    }

    const { data: bukuTamuData, error: bukuTamuError } =
      (await bukuTamuQuery) as unknown as {
        data: BukuTamuWithPengunjung[] | null;
        error?: any;
      };
    if (bukuTamuError) {
      console.error('Buku Tamu query error:', bukuTamuError);
      throw new BadRequestException('Gagal mengambil data Buku Tamu');
    }

    //*** Langkah 6: Format data untuk response ***
    const formattedData = (bukuTamuData || []).map((item) => ({
      ID_Buku_Tamu: item.ID_Buku_Tamu,
      ID_Stasiun: item.ID_Stasiun,
      Tujuan: item.Tujuan,
      Waktu_Kunjungan: dayjs(item.Waktu_Kunjungan).format(
        'dddd, D MMMM YYYY, HH.mm',
      ),
      Tanda_Tangan: item.Tanda_Tangan,
      Nama_Depan_Pengunjung: item.Pengunjung?.Nama_Depan_Pengunjung ?? null,
      Nama_Belakang_Pengunjung:
        item.Pengunjung?.Nama_Belakang_Pengunjung ?? null,
      Email_Pengunjung: item.Pengunjung?.Email_Pengunjung ?? null,
      No_Telepon_Pengunjung: item.Pengunjung?.No_Telepon_Pengunjung ?? null,
      Asal_Pengunjung: item.Pengunjung?.Asal_Pengunjung ?? null,
      Asal_Instansi: item.Pengunjung?.Asal_Instansi ?? null,
      Alamat_Lengkap: item.Pengunjung?.Alamat_Lengkap ?? null,
      Nama_Stasiun: item.Stasiun?.Nama_Stasiun ?? null,
    }));

    //*** Langkah 7: Kembalikan response ***
    return {
      filter: {
        period: period || null,
        startDate: startDate || null,
        endDate: endDate || null,
        filterStasiunId: isSuperadmin
          ? filterStasiunId || null
          : adminData.ID_Stasiun,
      },
      isSuperadmin,
      count: formattedData.length,
      data: formattedData,
    };
  }

  //*** Fungsi helper untuk mendapatkan data Buku Tamu berdasarkan periode tertentu (hari ini, minggu ini, bulan ini) ***
  async getBukuTamuByPeriod(
    user: SupabaseUser,
    user_id: string,
    period: 'today' | 'week' | 'month',
  ): Promise<any> {
    // *** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();

    const userId = user.id;

    // *** Langkah 2: Ambil data admin ***
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', userId)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    // *** Langkah 3: Query Buku_Tamu ***
    let bukuTamuQuery = supabase
      .from('Buku_Tamu')
      .select(
        `
      ID_Buku_Tamu,
      ID_Stasiun,
      Tujuan,
      Waktu_Kunjungan,
      Tanda_Tangan,
      Pengunjung:ID_Pengunjung(
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
        Asal_Instansi,
        Alamat_Lengkap
      ),
      Stasiun:ID_Stasiun(Nama_Stasiun)
    `,
      )
      .order('Waktu_Kunjungan', { ascending: false });

    // *** Langkah 4: Filter berdasarkan peran ***
    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }
      bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    // *** Langkah 5: Filter periode ***
    const now = dayjs();

    if (period === 'today') {
      bukuTamuQuery = bukuTamuQuery
        .gte('Waktu_Kunjungan', now.startOf('day').toISOString())
        .lte('Waktu_Kunjungan', now.endOf('day').toISOString());
    } else if (period === 'week') {
      bukuTamuQuery = bukuTamuQuery
        .gte('Waktu_Kunjungan', now.startOf('week').toISOString())
        .lte('Waktu_Kunjungan', now.endOf('week').toISOString());
    } else if (period === 'month') {
      bukuTamuQuery = bukuTamuQuery
        .gte('Waktu_Kunjungan', now.startOf('month').toISOString())
        .lte('Waktu_Kunjungan', now.endOf('month').toISOString());
    } else {
      throw new BadRequestException('Periode filter tidak valid');
    }

    // *** Langkah 6: Eksekusi ***
    const { data, error } = await bukuTamuQuery;
    if (error) {
      throw new BadRequestException(
        `Gagal mengambil data Buku Tamu: ${error.message}`,
      );
    }

    // *** Langkah 7: Mapping waktu ***
    const formattedData =
      data?.map((item) => ({
        ...item,
        Waktu_Kunjungan: dayjs(item.Waktu_Kunjungan).format(
          'dddd, D MMMM YYYY, HH.mm',
        ),
      })) || [];

    // *** Langkah 8: Kembalikan response ***
    return {
      period,
      isSuperadmin,
      stationFilter: !isSuperadmin ? adminData.ID_Stasiun : 'all',
      count: formattedData.length,
      data: formattedData,
    };
  }

  //*** Fungsi untuk mendapatkan data Buku Tamu hari ini ***
  async getBukuTamuHariIni(user: SupabaseUser, user_id: string) {
    return this.getBukuTamuByPeriod(user, user_id, 'today');
  }

  //*** Fungsi untuk mendapatkan data Buku Tamu minggu ini ***
  async getBukuTamuMingguIni(user: SupabaseUser, user_id: string) {
    return this.getBukuTamuByPeriod(user, user_id, 'week');
  }

  //*** Fungsi untuk mendapatkan data Buku Tamu bulan ini ***
  async getBukuTamuBulanIni(user: SupabaseUser, user_id: string) {
    return this.getBukuTamuByPeriod(user, user_id, 'month');
  }

  async deleteBukuTamu(
    user: SupabaseUser,
    user_id: string,
    idBukuTamu: string,
  ) {
    const supabase = this.supabaseService.getClient();

    const userId = user.id;

    // ================= ADMIN =================

    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', userId)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    // ================= AMBIL DATA BUKU TAMU =================

    const { data: bukuTamu, error: bukuError } = await supabase
      .from('Buku_Tamu')
      .select('*')
      .eq('ID_Buku_Tamu', idBukuTamu)
      .single();

    if (bukuError || !bukuTamu) {
      throw new NotFoundException('Data buku tamu tidak ditemukan');
    }

    // ================= VALIDASI STASIUN =================

    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new ForbiddenException(
          'Admin tidak memiliki stasiun yang terdaftar',
        );
      }

      if (String(adminData.ID_Stasiun) !== String(bukuTamu.ID_Stasiun)) {
        throw new ForbiddenException(
          'Anda tidak memiliki akses untuk menghapus data buku tamu ini',
        );
      }
    }

    // ================= HAPUS FILE TANDA TANGAN =================

    if (bukuTamu.Tanda_Tangan) {
      try {
        const url = new URL(bukuTamu.Tanda_Tangan);

        const fileName = decodeURIComponent(
          url.pathname.split('/').pop() ?? '',
        );

        if (fileName) {
          await supabase.storage.from('tanda-tangan').remove([fileName]);
        }
      } catch (error) {
        // lanjutkan proses walaupun gagal hapus file
      }
    }

    // ================= HAPUS BUKU TAMU =================

    const { error: deleteError } = await supabase
      .from('Buku_Tamu')
      .delete()
      .eq('ID_Buku_Tamu', idBukuTamu);

    if (deleteError) {
      throw new BadRequestException(
        `Gagal menghapus buku tamu: ${deleteError.message}`,
      );
    }

    // ================= OPSIONAL: HAPUS PENGUNJUNG JIKA TIDAK DIGUNAKAN =================

    const { data: remaining } = await supabase
      .from('Buku_Tamu')
      .select('ID_Buku_Tamu')
      .eq('ID_Pengunjung', bukuTamu.ID_Pengunjung);

    if (!remaining || remaining.length === 0) {
      await supabase
        .from('Pengunjung')
        .delete()
        .eq('ID_Pengunjung', bukuTamu.ID_Pengunjung);
    }

    return {
      message: 'Data buku tamu berhasil dihapus',
      id_buku_tamu: idBukuTamu,
    };
  }

  //*** Fungsi untuk mendapatkan semua data admin dengan fitur search dan filter (hanya untuk Superadmin) ***
  async getAllAdmins(
    user: SupabaseUser,
    user_id: string,
    search?: string,
    filterPeran?: string,
    filterStasiunId?: string,
  ) {
    //*** Langkah 1: Dapatkan client Supabase ***
    const supabase = this.supabaseService.getClient();
    const userId = user.id;

    const { data: currentAdmin, error: currentAdminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', userId)
      .single();

    if (currentAdminError || !currentAdmin) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    //*** Langkah 2: Cek apakah admin adalah Superadmin ***
    if (currentAdmin.Peran !== 'Superadmin') {
      throw new UnauthorizedException(
        'Hanya Superadmin yang bisa mengakses data semua admin',
      );
    }

    //*** Langkah 3: Bangun query dasar untuk mengambil data admin ***
    let query = supabase.from('Admin').select(
      `
      ID_Admin,
      Nama_Depan_Admin,
      Nama_Belakang_Admin,
      Email_Admin,
      Peran,
      Foto_Admin,
      Created_At,
      Stasiun:Stasiun(ID_Stasiun, Nama_Stasiun)
    `,
    );

    //*** Langkah 4: Terapkan pencarian jika ada ***
    if (search && search.trim() !== '') {
      const keyword = search.trim();
      query = query.or(
        `Nama_Depan_Admin.ilike."%${keyword}%",Nama_Belakang_Admin.ilike."%${keyword}%",Email_Admin.ilike."%${keyword}%"`,
      );
    }

    //*** Langkah 5: Terapkan filter jika ada ***
    if (filterPeran) {
      query = query.eq('Peran', filterPeran);
    }

    if (filterStasiunId) {
      query = query.eq('ID_Stasiun', filterStasiunId);
    }

    // *** Langkah 6: Eksekusi query ***
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException('Gagal mengambil data admin');
    }

    //*** Langkah 7: Lakukan filter tambahan pada hasil jika diperlukan ***
    let filteredData = data || [];
    if (search && search.trim() !== '') {
      const lowerSearch = search.toLowerCase();
      filteredData = filteredData.filter(
        (item) =>
          item.Stasiun?.[0]?.Nama_Stasiun?.toLowerCase().includes(
            lowerSearch,
          ) ||
          item.Nama_Depan_Admin?.toLowerCase().includes(lowerSearch) ||
          item.Nama_Belakang_Admin?.toLowerCase().includes(lowerSearch) ||
          item.Email_Admin?.toLowerCase().includes(lowerSearch),
      );
    }

    //*** Langkah 8: Kembalikan response ***
    return {
      message: 'Data admin berhasil diambil',
      count: filteredData.length,
      data: filteredData,
    };
  }

  //*** Fungsi untuk menambahkan admin baru (hanya untuk Superadmin) ***
  async createAdmin(
    body: any,
    foto?: Express.Multer.File,
    user?: SupabaseUser,
    user_id?: string,
  ) {
    const {
      nama_depan,
      nama_belakang,
      email,
      password,
      confirmPassword,
      peran,
      id_stasiun,
    } = body;

    //*** Langkah 1: Validasi input ***
    if (!nama_depan || !email || !password || !confirmPassword || !peran) {
      throw new BadRequestException(
        'Semua field wajib diisi (kecuali opsional)',
      );
    }

    if (!['Admin', 'Superadmin'].includes(peran)) {
      throw new BadRequestException(
        'Peran tidak valid (hanya Admin / Superadmin)',
      );
    }

    if (password.length < 6) {
      throw new BadRequestException('Password minimal 6 karakter');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok');
    }

    //*** Langkah 2: Dapatkan client supabase ***
    const supabase = this.supabaseService.getClient();
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const { data: roleCheck, error: roleError } = await supabase
      .from('Admin')
      .select('Peran')
      .eq('ID_Admin', user_id)
      .single();

    if (roleError || !roleCheck || roleCheck.Peran !== 'Superadmin') {
      throw new ForbiddenException(
        'Hanya Superadmin yang dapat menambahkan admin baru',
      );
    }

    //*** Langkah 3: Buat user baru di Supabase Auth ***
    const { data: newUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError) {
      throw new BadRequestException(
        'Gagal membuat user baru: ' + createUserError.message,
      );
    }

    const newUserId = newUser.user.id;

    //*** Langkah 4: Upload foto admin baru ke Supabase Storage ***
    let fotoUrl: string;
    if (foto) {
      if (!['image/jpeg', 'image/png'].includes(foto.mimetype)) {
        throw new BadRequestException('Format file harus JPG atau PNG');
      }
      if (foto.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Ukuran file maksimal 10MB');
      }

      const fileExt = foto.originalname.split('.').pop();
      const uniqueId = randomUUID();
      const uploadedFileName = `${newUserId}_${uniqueId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-admin')
        .upload(uploadedFileName, foto.buffer, {
          contentType: foto.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new BadRequestException('Gagal mengunggah foto baru');
      }

      fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${uploadedFileName}`;
    } else {
      // foto default
      const defaultPath = join(process.cwd(), 'src', 'public', 'Logo_BMKG.png');
      const fileBuffer = readFileSync(defaultPath);
      const uniqueId = randomUUID();
      const uploadedFileName = `${newUserId}_${uniqueId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('foto-admin')
        .upload(uploadedFileName, fileBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw new BadRequestException('Gagal mengunggah foto default');
      }

      fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${uploadedFileName}`;
    }

    //*** Langkah 5: Simpan data admin baru ke tabel Admin ***
    const { error: insertError } = await supabase.from('Admin').insert([
      {
        ID_Admin: newUserId,
        Peran: peran,
        ID_Stasiun: peran === 'Admin' ? id_stasiun : null,
        Created_At: new Date().toISOString(),
        Nama_Depan_Admin: nama_depan,
        Nama_Belakang_Admin: nama_belakang || null,
        Email_Admin: email,
        Foto_Admin: fotoUrl,
      },
    ]);

    if (insertError) {
      throw new BadRequestException(
        'Gagal menyimpan data admin: ' + insertError.message,
      );
    }

    //*** Langkah 6: Kembalikan response ***
    return {
      message: 'Admin berhasil dibuat',
      id: newUserId,
      email,
      peran,
    };
  }

  //*** Fungsi untuk mengupdate admin (Superadmin) ***
  async updateAdmin(
    user: SupabaseUser,
    id_admin: string,
    dto: UpdateProfileAdminDto,
    user_id: string,
  ) {
    //*** Langkah 1: Dapatkan client Supabase dan Supabase Admin ***
    const supabase = this.supabaseService.getClient();
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const userId = user.id;

    //*** Langkah 2: Ambil peran admin yang sedang login ***
    const { data: currentAdmin, error: currentError } = await supabase
      .from('Admin')
      .select('Peran')
      .eq('ID_Admin', userId)
      .single();

    if (currentError || !currentAdmin) {
      throw new UnauthorizedException('Data admin tidak ditemukan');
    }

    //*** Langkah 3: Cek izin update (Superadmin boleh siapa saja, Admin hanya dirinya sendiri) ***
    const isSuperadmin = currentAdmin.Peran === 'Superadmin';
    if (!isSuperadmin && user_id !== id_admin) {
      throw new UnauthorizedException(
        'Tidak diizinkan untuk update admin lain',
      );
    }

    //*** Langkah 4: Ambil data lama admin ***
    const { data: existingAdmin, error: existingError } = await supabase
      .from('Admin')
      .select('Foto_Admin')
      .eq('ID_Admin', id_admin)
      .single();

    if (existingError) {
      throw new BadRequestException('Gagal mengambil data admin lama');
    }

    let fotoUrl: string | null = existingAdmin?.Foto_Admin || null;

    //*** Langkah 5: Update password jika ada ***
    if (dto.password) {
      if (dto.password !== dto.confirmPassword) {
        throw new BadRequestException('Konfirmasi password tidak cocok');
      }

      const { error: updatePassError } =
        await supabaseAdmin.auth.admin.updateUserById(id_admin, {
          password: dto.password,
        });

      if (updatePassError) {
        throw new BadRequestException(
          'Gagal update password: ' + updatePassError.message,
        );
      }
    }

    //*** Langkah 6: Upload foto baru jika ada ***
    if (dto.foto) {
      if (!['image/jpeg', 'image/png'].includes(dto.foto.mimetype)) {
        throw new BadRequestException('Format file harus JPG atau PNG');
      }

      if (dto.foto.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Ukuran file maksimal 10MB');
      }

      // Hapus foto lama jika ada
      if (existingAdmin?.Foto_Admin) {
        await this.deleteOldPhoto(existingAdmin.Foto_Admin);
      }

      const fileExt = dto.foto.originalname.split('.').pop();
      const uniqueId = randomUUID();
      const filePath = `${id_admin}_${uniqueId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-admin')
        .upload(filePath, dto.foto.buffer, {
          contentType: dto.foto.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new BadRequestException(
          'Gagal upload foto: ' + uploadError.message,
        );
      }

      fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${filePath}`;
    }

    //*** Langkah 7: Update data di tabel Admin ***
    const updatePayload: Record<string, any> = {
      ...(dto.nama_depan && { Nama_Depan_Admin: dto.nama_depan }),
      ...(dto.nama_belakang && { Nama_Belakang_Admin: dto.nama_belakang }),
      ...(fotoUrl && { Foto_Admin: fotoUrl }),
    };

    const { error: updateError } = await supabase
      .from('Admin')
      .update(updatePayload)
      .eq('ID_Admin', id_admin);

    if (updateError) {
      throw new BadRequestException(
        'Gagal update data admin: ' + updateError.message,
      );
    }

    //*** Langkah 8: Return hasil ***
    return {
      message: 'Admin berhasil diupdate',
      updated_fields: updatePayload,
    };
  }

  //*** Fungsi untuk menghapus admin (hanya untuk Superadmin) ***
  async deleteAdmin(user: SupabaseUser, user_id: string, id_admin: string) {
    const supabase = this.supabaseService.getClient();
    const supabaseAdmin = this.supabaseService.getAdminClient();

    if (user.id !== user_id) {
      throw new UnauthorizedException(
        'Identitas user tidak konsisten dengan token autentikasi',
      );
    }

    const { data: currentAdmin, error: currentError } = await supabase
      .from('Admin')
      .select('Peran')
      .eq('ID_Admin', user_id)
      .single();

    if (currentError || !currentAdmin) {
      throw new UnauthorizedException('Data admin login tidak ditemukan');
    }

    if (currentAdmin.Peran !== 'Superadmin') {
      throw new ForbiddenException(
        'Hanya Superadmin yang dapat menghapus admin',
      );
    }

    if (user_id === id_admin) {
      throw new BadRequestException('Tidak dapat menghapus akun sendiri');
    }

    const { data: adminToDelete, error: adminError } = await supabase
      .from('Admin')
      .select('Foto_Admin')
      .eq('ID_Admin', id_admin)
      .single();

    if (adminError || !adminToDelete) {
      throw new NotFoundException('Admin yang akan dihapus tidak ditemukan');
    }

    if (adminToDelete.Foto_Admin) {
      try {
        await this.deleteOldPhoto(adminToDelete.Foto_Admin);
      } catch {
        throw new BadRequestException('Gagal menghapus foto admin');
      }
    }

    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(id_admin);

    if (deleteUserError) {
      throw new BadRequestException(
        'Gagal menghapus user auth: ' + deleteUserError.message,
      );
    }

    return {
      message: 'Admin berhasil dihapus',
    };
  }
}
