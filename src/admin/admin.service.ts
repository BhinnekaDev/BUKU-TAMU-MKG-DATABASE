import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { LogoutAdminDto } from '@/admin/dto/logout-admin.dto';
import { PeranAdmin, RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
import { supabase } from '@/supabase/supabase.client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
const PDFDocument = require('pdfkit');

@Injectable()
export class AdminService {
  async register(
    dto: RegisterAdminDto,
    ip: string | null,
    userAgent: string | null,
    foto_admin?: Express.Multer.File,
  ) {
    const {
      email,
      password,
      nama_depan_admin,
      nama_belakang_admin,
      peran,
      id_stasiun,
    } = dto;

    // 1. Validasi peran dan ID_Stasiun
    if (peran === PeranAdmin.SUPERADMIN && id_stasiun) {
      throw new BadRequestException(
        'Superadmin tidak boleh memiliki ID_Stasiun',
      );
    }

    if (peran === PeranAdmin.ADMIN && !id_stasiun) {
      throw new BadRequestException('Admin harus memiliki ID_Stasiun');
    }

    // 2. Cek email sudah terdaftar di Supabase Auth
    const { data: existing, error: errorCheck } = await supabase.auth.admin
      .listUsers()
      .then(({ data, error }) => {
        if (error) {
          throw new BadRequestException('Gagal cek email di Supabase');
        }
        return {
          data: {
            users: data?.users?.filter((user) => user.email === email),
          },
          error: null,
        };
      });

    if (errorCheck) {
      throw new BadRequestException('Gagal cek email di Supabase');
    }

    if (existing?.users?.length) {
      throw new BadRequestException('Email sudah digunakan');
    }

    // 4. Daftar user ke Supabase Auth
    const { data: userData, error: registerError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (registerError || !userData?.user?.id) {
      throw new BadRequestException('Gagal mendaftarkan user ke Supabase Auth');
    }

    const user_id = userData.user.id;
    let fotoUrl: string | null = null;
    if (foto_admin) {
      const fileExt = foto_admin.originalname.split('.').pop();
      const filePath = `${user_id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-admin')
        .upload(filePath, foto_admin.buffer, {
          contentType: foto_admin.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload foto gagal:', uploadError.message);
        throw new BadRequestException('Gagal mengupload foto admin');
      }

      fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${filePath}`;
    }

    // 5. Simpan ke tabel "Admin"
    const { error: insertError } = await supabase.from('Admin').insert({
      ID_Admin: user_id,
      Email_Admin: email,
      Nama_Depan_Admin: nama_depan_admin,
      Nama_Belakang_Admin: nama_belakang_admin,
      Peran: peran,
      ID_Stasiun: peran === PeranAdmin.ADMIN ? id_stasiun : null,
      Foto_Admin: fotoUrl,
    });

    if (insertError) {
      throw new BadRequestException('Gagal menyimpan data admin ke database');
    }

    let namaStasiun = '';
    if (id_stasiun) {
      const { data: stasiunData, error: stasiunError } = await supabase
        .from('Stasiun')
        .select('Nama_Stasiun')
        .eq('ID_Stasiun', id_stasiun)
        .single();

      if (!stasiunError && stasiunData?.Nama_Stasiun) {
        namaStasiun = stasiunData.Nama_Stasiun;
      }
    }

    // 6. Catat ke Activity_Log
    await supabase.from('Activity_Log').insert({
      ID_User: user_id,
      Role: 'Admin',
      Action: 'Register',
      Description: `${peran} terdaftar dengan nama ${nama_depan_admin} ${nama_belakang_admin} di stasiun ${namaStasiun} dengan ID: ${user_id} dan Email: ${email}`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Registrasi admin berhasil',
      user_id,
      email,
    };
  }

  async login(dto: LoginAdminDto, ip: string | null, userAgent: string | null) {
    const { email, password } = dto;

    // 1. Login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user || !data?.session) {
      throw new BadRequestException('Email atau password salah');
    }

    const user = data.user;
    let session = data.session;

    // Perpanjang masa berlaku token
    try {
      // Gunakan refreshSession()
      const { data: refreshedData, error: refreshError } =
        await supabase.auth.refreshSession();
      if (!refreshError && refreshedData?.session) {
        session = refreshedData.session;
      }

      // Update session (tanpa expires_in)
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } catch (refreshErr) {
      console.error('Gagal memperpanjang session:', refreshErr);
    }

    // 2. Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, Nama_Depan_Admin, Nama_Belakang_Admin, ID_Stasiun')
      .eq('ID_Admin', user.id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Gagal mengambil data admin');
    }

    // 3. Ambil nama stasiun jika ada
    let namaStasiun = '';
    if (adminData.ID_Stasiun) {
      const { data: stasiunData, error: stasiunError } = await supabase
        .from('Stasiun')
        .select('Nama_Stasiun')
        .eq('ID_Stasiun', adminData.ID_Stasiun)
        .single();

      if (!stasiunError && stasiunData?.Nama_Stasiun) {
        namaStasiun = stasiunData.Nama_Stasiun;
      }
    }

    // 4. Catat log aktivitas
    await supabase.from('Activity_Log').insert({
      ID_User: user.id,
      Role: 'Admin',
      Action: 'Login',
      Description:
        `${adminData.Peran} dengan nama ${adminData.Nama_Depan_Admin} ${adminData.Nama_Belakang_Admin}` +
        (namaStasiun ? ` dari stasiun ${namaStasiun}` : '') +
        ` berhasil login`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    // 5. Return
    return {
      message: 'Login berhasil',
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user_id: user.id,
      role: adminData.Peran,
      expires_at: session.expires_at,
    };
  }

  async logout(
    dto: LogoutAdminDto,
    ip: string | null,
    userAgent: string | null,
  ) {
    const { user_id, access_token } = dto;

    // 1. Validasi access_token dengan Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user?.id || user.id !== user_id) {
      console.error('Token tidak valid atau tidak sesuai');
      throw new UnauthorizedException('Token tidak valid atau tidak sesuai');
    }

    // 2. Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, Nama_Depan_Admin, Nama_Belakang_Admin, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Gagal mengambil data admin');
    }

    // 3. Ambil nama stasiun jika ada
    let namaStasiun = '';
    if (adminData.ID_Stasiun) {
      const { data: stasiunData } = await supabase
        .from('Stasiun')
        .select('Nama_Stasiun')
        .eq('ID_Stasiun', adminData.ID_Stasiun)
        .single();

      if (stasiunData?.Nama_Stasiun) {
        namaStasiun = stasiunData.Nama_Stasiun;
      }
    }

    // 4. Catat log aktivitas logout
    await supabase.from('Activity_Log').insert({
      ID_User: user_id,
      Role: 'Admin',
      Action: 'Logout',
      Description:
        `${adminData.Peran} dengan nama ${adminData.Nama_Depan_Admin} ${adminData.Nama_Belakang_Admin}` +
        (namaStasiun ? ` dari stasiun ${namaStasiun}` : '') +
        ` berhasil logout`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    // 5. Return pesan
    return { message: 'Logout berhasil' };
  }

  async getProfile(user_id: string, access_token: string) {
    // 1. Verify access_token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user?.id || user.id !== user_id) {
      console.error('Invalid token or mismatch:', {
        error,
        tokenUserId: user?.id,
        requestedUserId: user_id,
      });
      throw new UnauthorizedException('Invalid token or user mismatch');
    }

    // 2. Get admin data
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
        ID_Stasiun
      `,
      )
      .eq('ID_Admin', user.id)
      .single();

    if (adminError) {
      console.error('Admin data fetch error:', adminError);
      throw new BadRequestException('Failed to fetch admin data');
    }

    if (!adminData) {
      throw new NotFoundException('Admin not found');
    }

    // Transform response
    const transformedData = {
      user_id: adminData.ID_Admin,
      email: adminData.Email_Admin,
      nama_depan: adminData.Nama_Depan_Admin,
      nama_belakang: adminData.Nama_Belakang_Admin,
      peran: adminData.Peran,
      foto: adminData.Foto_Admin,
      stasiun_id: adminData.ID_Stasiun,
    };

    return {
      message: 'Admin profile retrieved successfully',
      data: transformedData,
    };
  }

  async updateProfile(
    dto: UpdateAdminProfileDto & {
      access_token: string;
      user_id: string;
      ip?: string;
      user_agent?: string;
    },
    foto?: Express.Multer.File,
  ): Promise<any> {
    const {
      user_id,
      access_token,
      nama_depan,
      nama_belakang,
      password,
      ip,
      user_agent,
    } = dto;

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(access_token);
    if (authError || !user?.id || user.id !== user_id) {
      throw new UnauthorizedException('Token tidak valid atau tidak sesuai');
    }

    // 2. Get admin data
    const { data: existingAdmin, error: adminError } = await supabase
      .from('Admin')
      .select('Nama_Depan_Admin, Nama_Belakang_Admin, Foto_Admin')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !existingAdmin) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    let fotoUrl = existingAdmin.Foto_Admin;
    let uploadedFileName: string | null = null;
    let updatedFields: string[] = [];

    try {
      // 3. Handle photo
      if (foto) {
        // Validate file
        if (!['image/jpeg', 'image/png'].includes(foto.mimetype)) {
          throw new BadRequestException('Format file harus JPG atau PNG');
        }
        if (foto.size > 2 * 1024 * 1024) {
          // 2MB max
          throw new BadRequestException('Ukuran file maksimal 2MB');
        }

        const fileExt = foto.originalname.split('.').pop();
        uploadedFileName = `${user_id}.${fileExt}`;

        // Delete old photo
        if (fotoUrl) {
          const oldFileName = fotoUrl.split('/').pop();
          await supabase.storage.from('foto-admin').remove([oldFileName!]);
        }

        // Upload new photo
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

      // 4. Update password
      if (password) {
        const { error: pwError } = await supabase.auth.admin.updateUserById(
          user_id,
          { password },
        );
        if (pwError) {
          throw new BadRequestException('Gagal memperbarui password');
        }
        updatedFields.push('password');
      }

      // 5. Prepare update
      const updatePayload: Record<string, any> = {};
      if (nama_depan && nama_depan !== existingAdmin.Nama_Depan_Admin) {
        updatePayload.Nama_Depan_Admin = nama_depan;
        updatedFields.push('nama_depan');
      }
      if (
        nama_belakang &&
        nama_belakang !== existingAdmin.Nama_Belakang_Admin
      ) {
        updatePayload.Nama_Belakang_Admin = nama_belakang;
        updatedFields.push('nama_belakang');
      }
      if (fotoUrl && fotoUrl !== existingAdmin.Foto_Admin) {
        updatePayload.Foto_Admin = fotoUrl;
      }

      // 6. Update admin profile
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from('Admin')
          .update(updatePayload)
          .eq('ID_Admin', user_id);

        if (updateError) {
          throw new BadRequestException('Gagal memperbarui profil admin');
        }
      }

      // 7. Log activity
      if (updatedFields.length > 0) {
        await supabase.from('Activity_Log').insert({
          ID_User: user_id,
          Role: 'Admin',
          Action: 'Update Profile',
          Description: `Admin memperbarui: ${updatedFields.join(', ')}`,
          IP_Address: ip,
          User_Agent: user_agent,
        });
      }

      // Get updated admin data
      const { data: updatedAdmin } = await supabase
        .from('Admin')
        .select('Nama_Depan_Admin, Nama_Belakang_Admin, Foto_Admin')
        .eq('ID_Admin', user_id)
        .single();

      // Transform response
      const transformedData = {
        nama_depan:
          updatedAdmin?.Nama_Depan_Admin || existingAdmin.Nama_Depan_Admin,
        nama_belakang:
          updatedAdmin?.Nama_Belakang_Admin ||
          existingAdmin.Nama_Belakang_Admin,
        foto: updatedAdmin?.Foto_Admin || existingAdmin.Foto_Admin,
      };

      return {
        message:
          updatedFields.length > 0
            ? 'Profil admin berhasil diperbarui'
            : 'Tidak ada perubahan yang dilakukan',
        data: transformedData,
        updated_fields: updatedFields,
      };
    } catch (error) {
      // Catch kesalahan setelah mengunggah foto
      if (uploadedFileName) {
        await supabase.storage
          .from('foto-admin')
          .remove([uploadedFileName])
          .catch((cleanupError) => {
            console.error(
              'Gagal menghapus foto yang baru diupload:',
              cleanupError,
            );
          });
      }

      throw error;
    }
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ip: string | null,
    userAgent: string | null,
  ) {
    const { email, new_password } = dto;

    // 1. Ambil user dari Supabase (auth.users)
    const { data: listUserData, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw new BadRequestException('Gagal mengambil data pengguna');
    }

    const user = listUserData.users.find((u) => u.email === email);

    if (!user) {
      throw new NotFoundException('Email tidak ditemukan');
    }

    // 2. Cek apakah email tersebut juga terdaftar di tabel Admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('ID_Admin')
      .eq('Email_Admin', email)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Email tidak terdaftar sebagai Admin');
    }

    // 3. Update password user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: new_password,
      },
    );

    if (updateError) {
      throw new BadRequestException('Gagal mengubah password');
    }

    // 4. Log aktivitas
    await supabase.from('Activity_Log').insert({
      ID_User: user.id,
      Role: 'Admin',
      Action: 'Reset Password',
      Description: `Admin dengan email ${email} berhasil reset password`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return { message: 'Password berhasil direset' };
  }

  async getBukuTamu(
    access_token: string,
    user_id: string,
    period?: 'today' | 'week' | 'month',
    startDate?: string,
    endDate?: string,
    filterStasiunId?: string,
  ): Promise<any> {
    try {
      // 1. Verifikasi token Supabase
      const { data: authData, error: authError } =
        await supabase.auth.getUser(access_token);

      if (authError || !authData || authData.user?.id !== user_id) {
        throw new UnauthorizedException(
          'Token tidak valid atau tidak cocok dengan user_id',
        );
      }

      // 2. Ambil data admin
      const { data: adminData, error: adminError } = await supabase
        .from('Admin')
        .select('Peran, ID_Stasiun')
        .eq('ID_Admin', user_id)
        .single();

      if (adminError || !adminData) {
        throw new BadRequestException('Data admin tidak ditemukan');
      }

      const isSuperadmin = adminData.Peran === 'Superadmin';

      // 3. Validasi jika non-superadmin mencoba menyaring dengan filterStasiunId
      if (!isSuperadmin && filterStasiunId) {
        throw new ForbiddenException(
          'Anda tidak memiliki izin untuk memfilter berdasarkan ID Stasiun',
        );
      }

      // 4. Bangun query
      let bukuTamuQuery = supabase
        .from('Buku_Tamu')
        .select(
          `
        ID_Buku_Tamu,
        ID_Pengunjung,
        ID_Stasiun,
        Tujuan,
        Tanggal_Pengisian,
        Waktu_Kunjungan,
        Tanda_Tangan,
        Pengunjung:ID_Pengunjung(
          ID_Pengunjung,
          Nama_Depan_Pengunjung,
          Nama_Belakang_Pengunjung,
          Email_Pengunjung,
          No_Telepon_Pengunjung,
          Asal_Pengunjung,
          Asal_Instansi
        ),
        Stasiun:ID_Stasiun(Nama_Stasiun)
      `,
        )
        .order('Tanggal_Pengisian', { ascending: false });

      // 5. Filter berdasarkan peran
      if (!isSuperadmin) {
        if (!adminData.ID_Stasiun) {
          throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
        }
        bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
      } else if (filterStasiunId) {
        bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', filterStasiunId);
      }

      // 6. Filter waktu
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (period === 'today') {
        bukuTamuQuery = bukuTamuQuery.gte(
          'Tanggal_Pengisian',
          today.toISOString(),
        );
      } else if (period === 'week') {
        bukuTamuQuery = bukuTamuQuery.gte(
          'Tanggal_Pengisian',
          startOfWeek.toISOString(),
        );
      } else if (period === 'month') {
        bukuTamuQuery = bukuTamuQuery.gte(
          'Tanggal_Pengisian',
          startOfMonth.toISOString(),
        );
      }

      if (startDate) {
        bukuTamuQuery = bukuTamuQuery.gte(
          'Tanggal_Pengisian',
          new Date(startDate).toISOString(),
        );
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        bukuTamuQuery = bukuTamuQuery.lte(
          'Tanggal_Pengisian',
          end.toISOString(),
        );
      }

      // 7. Eksekusi
      const { data, error } = await bukuTamuQuery;
      if (error) {
        throw new InternalServerErrorException(
          'Gagal mengambil data buku tamu',
        );
      }

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
        count: data.length,
        data,
      };
    } catch (err) {
      throw err;
    }
  }

  async getBukuTamuByPeriod(
    access_token: string,
    user_id: string,
    period: 'today' | 'week' | 'month',
  ): Promise<any> {
    // 1. Verivikasi Supabase token
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    const adminId = user_id;

    // 2. Get admin data
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', adminId)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    // 3. Query buku tamu
    let bukuTamuQuery = supabase
      .from('Buku_Tamu')
      .select(
        `
        ID_Buku_Tamu,
        ID_Pengunjung,
        ID_Stasiun,
        Tujuan,
        Tanggal_Pengisian,
        Waktu_Kunjungan,
        Tanda_Tangan,

        Pengunjung:ID_Pengunjung(
        ID_Pengunjung,
        Nama_Depan_Pengunjung,
        Nama_Belakang_Pengunjung,
        Email_Pengunjung,
        No_Telepon_Pengunjung,
        Asal_Pengunjung,
        Asal_Instansi
        ),
        Stasiun:ID_Stasiun(Nama_Stasiun)
      `,
      )
      .order('Tanggal_Pengisian', { ascending: false });

    // 4. Filter untuk admin
    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }
      bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    // 5. filter waktu
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (period) {
      case 'today':
        bukuTamuQuery = bukuTamuQuery.gte(
          'Tanggal_Pengisian',
          startOfDay.toISOString(),
        );
        break;
      case 'week':
        bukuTamuQuery = bukuTamuQuery.gte(
          'Tanggal_Pengisian',
          startOfWeek.toISOString(),
        );
        break;
      case 'month':
        bukuTamuQuery = bukuTamuQuery.gte(
          'Tanggal_Pengisian',
          startOfMonth.toISOString(),
        );
        break;
      default:
        throw new BadRequestException('Periode filter tidak valid');
    }

    // 6. Execute query
    const { data, error } = await bukuTamuQuery;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      period,
      isSuperadmin,
      stationFilter: !isSuperadmin ? adminData.ID_Stasiun : 'all',
      count: data.length,
      data,
    };
  }

  // panggil method
  async getBukuTamuHariIni(access_token: string, user_id: string) {
    return this.getBukuTamuByPeriod(access_token, user_id, 'today');
  }

  async getBukuTamuMingguIni(access_token: string, user_id: string) {
    return this.getBukuTamuByPeriod(access_token, user_id, 'week');
  }

  async getBukuTamuBulanIni(access_token: string, user_id: string) {
    return this.getBukuTamuByPeriod(access_token, user_id, 'month');
  }

  async getDashboard(user_id: string, access_token: string) {
    if (!access_token || !user_id) {
      throw new UnauthorizedException('Token atau user_id tidak ditemukan');
    }

    // Verifikasi token dan user
    const { data: userData, error } = await supabase.auth.getUser(access_token);
    if (error || !userData?.user || userData.user.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    // Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new UnauthorizedException('Admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    let jumlahTamu = 0;

    if (isSuperadmin) {
      const { count, error: countError } = await supabase
        .from('Buku_Tamu')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new BadRequestException('Gagal menghitung data tamu');
      }

      jumlahTamu = count!;
    } else {
      const { count, error: countError } = await supabase
        .from('Buku_Tamu')
        .select('*', { count: 'exact', head: true })
        .eq('ID_Stasiun', adminData.ID_Stasiun);

      if (countError) {
        throw new BadRequestException('Gagal menghitung data tamu');
      }

      jumlahTamu = count!;
    }

    return {
      peran: adminData.Peran,
      id_stasiun: adminData.ID_Stasiun,
      jumlah_tamu: jumlahTamu,
    };
  }

  async getDaftarKunjungan(
    user_id: string,
    access_token: string,
    search?: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (!user_id || !access_token) {
      throw new UnauthorizedException(
        'user_id atau access_token tidak ditemukan',
      );
    }

    // Verifikasi token
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getUser(access_token);

    if (sessionError || !sessionData?.user || sessionData.user.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    // Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new UnauthorizedException('Admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';
    const idStasiun = adminData.ID_Stasiun;

    // Query dasar
    let query = supabase
      .from('Buku_Tamu')
      .select(
        `
      ID_Buku_Tamu,
      ID_Pengunjung,
      ID_Stasiun,
      Tujuan,
      Tanggal_Pengisian,
      Pengunjung(ID_Pengunjung, Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung)
    `,
      )
      .order('Tanggal_Pengisian', { ascending: false });

    if (!isSuperadmin) {
      query = query.eq('ID_Stasiun', idStasiun);
    }

    // Ambil data mentah
    const { data: rawData, error } = await query;
    if (error) {
      console.error('Supabase error saat ambil kunjungan:', error);
      throw new BadRequestException('Gagal mengambil data kunjungan');
    }

    // Filter data
    const filtered = rawData.filter((item) => {
      const fullName =
        `${(item.Pengunjung as any)?.Nama_Depan_Pengunjung ?? ''} ${(item.Pengunjung as any)?.Nama_Belakang_Pengunjung ?? ''}`.toLowerCase();

      const matchesSearch = search
        ? fullName.includes(search.toLowerCase())
        : true;

      const kunjunganDate = new Date(item.Tanggal_Pengisian);
      const matchesDate = (() => {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : null; //T23 stand for end of the day
        return (
          (!start || kunjunganDate >= start) && (!end || kunjunganDate <= end)
        );
      })();

      return matchesSearch && matchesDate;
    });

    return filtered;
  }

  async getStatistikKunjungan(
    access_token: string,
    user_id: string,
  ): Promise<any> {
    console.log('🚀 Start getStatistikKunjungan');

    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);
    console.log('authData:', authData);
    console.log('authError:', authError);

    if (authError || authData.user?.id !== user_id) {
      console.error('Token tidak valid atau user_id tidak cocok');
      throw new UnauthorizedException('Token tidak valid');
    }

    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    console.log('adminData:', adminData);
    console.log('adminError:', adminError);

    if (adminError || !adminData) {
      console.error('Data admin tidak ditemukan');
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';
    console.log('isSuperadmin:', isSuperadmin);

    let query = supabase
      .from('Buku_Tamu')
      .select('Tanggal_Pengisian')
      .not('Tanggal_Pengisian', 'is', null);

    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        console.error('❗ Admin tidak memiliki ID_Stasiun');
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }
      query = query.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    const { data: kunjunganData, error } = await query;
    console.log('kunjunganData:', kunjunganData);
    console.log('queryError:', error);

    if (error) {
      console.error('Gagal mengambil data kunjungan');
      throw new InternalServerErrorException('Gagal mengambil data kunjungan');
    }

    const statistik: Record<
      string,
      Record<string, Record<string, number>>
    > = {};

    for (const item of kunjunganData) {
      const tanggal = new Date(item.Tanggal_Pengisian);
      const tahun = `${tanggal.getFullYear()}`;
      const bulan = `${tanggal.getMonth() + 1}`.padStart(2, '0');
      const minggu = `${this.getWeekOfMonth(tanggal)}`.padStart(2, '0');

      console.log(`Tahun: ${tahun}, Bulan: ${bulan}, Minggu: ${minggu}`);

      if (!statistik[tahun]) statistik[tahun] = {};
      if (!statistik[tahun][bulan]) statistik[tahun][bulan] = {};
      if (!statistik[tahun][bulan][minggu]) statistik[tahun][bulan][minggu] = 0;

      statistik[tahun][bulan][minggu]++;
    }

    console.log(' Statistik akhir:', JSON.stringify(statistik, null, 2));
    return statistik;
  }

  // Fungsi bantu hitung minggu ke-n dalam bulan
  private getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const adjustedDay = dayOfMonth + firstDay.getDay();
    return Math.ceil(adjustedDay / 7);
  }

  async getFrekuensiTujuanKunjungan(
    access_token: string,
    user_id: string,
  ): Promise<any[]> {
    // 1. Verifikasi token Supabase
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    // 2. Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    // 3. Ambil data Buku_Tamu sesuai peran
    let query = supabase
      .from('Buku_Tamu')
      .select('Tujuan', { count: 'exact', head: false });

    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }
      query = query.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error mengambil tujuan kunjungan:', error);
      throw new InternalServerErrorException(
        'Gagal mengambil data tujuan kunjungan',
      );
    }

    // 4. Hitung jumlah tiap tujuan
    const result: Record<string, number> = {};
    for (const item of data || []) {
      const tujuan = item.Tujuan?.trim() || 'Tidak Diketahui';
      result[tujuan] = (result[tujuan] || 0) + 1;
    }

    // 5. Ubah ke format array
    return Object.entries(result).map(([tujuan, jumlah]) => ({
      tujuan,
      jumlah,
    }));
  }

  async getAsalPengunjungTerbanyak(
    access_token: string,
    user_id: string,
  ): Promise<{ asal: string; jumlah: number }[]> {
    // 1. Verifikasi token Supabase
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    // 2. Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    // 3. Ambil data Buku_Tamu + Pengunjung (khusus field Asal_Pengunjung)
    let query = supabase
      .from('Buku_Tamu')
      .select('ID_Pengunjung, Pengunjung:ID_Pengunjung(Asal_Pengunjung)');

    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }

      query = query.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error asal pengunjung:', error);
      throw new InternalServerErrorException(
        'Gagal mengambil data asal pengunjung',
      );
    }

    // 4. Hitung jumlah kunjungan per asal pengunjung
    const countMap: Record<string, number> = {};
    for (const item of data || []) {
      let asal: string = 'Tidak Diketahui';
      if (Array.isArray(item.Pengunjung) && item.Pengunjung.length > 0) {
        asal =
          (item.Pengunjung[0] as { Asal_Pengunjung?: string })
            .Asal_Pengunjung || 'Tidak Diketahui';
      } else if (item.Pengunjung && typeof item.Pengunjung === 'object') {
        asal =
          (item.Pengunjung as { Asal_Pengunjung?: string }).Asal_Pengunjung ||
          'Tidak Diketahui';
      }
      countMap[asal] = (countMap[asal] || 0) + 1;
    }

    // 5. Ubah ke bentuk array dan urutkan
    const result = Object.entries(countMap)
      .map(([asal, jumlah]) => ({ asal, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah); // urut dari terbanyak

    return result;
  }

  async getPerbandinganStasiun(
    access_token: string,
    user_id: string,
  ): Promise<{ nama_stasiun: string; jumlah: number }[]> {
    // 1. Verifikasi token Supabase
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    // 2. Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    // 3. Ambil seluruh data Buku_Tamu + relasi Stasiun
    let query = supabase
      .from('Buku_Tamu')
      .select(`ID_Stasiun, Stasiun:ID_Stasiun(Nama_Stasiun)`);

    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }

      query = query.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error ambil data perbandingan stasiun:', error);
      throw new InternalServerErrorException(
        'Gagal mengambil data perbandingan stasiun',
      );
    }

    // 4. Hitung jumlah kunjungan per stasiun
    const countMap: Record<string, number> = {};

    for (const item of data || []) {
      const namaStasiun =
        Array.isArray(item.Stasiun) && item.Stasiun.length > 0
          ? (item.Stasiun[0] as { Nama_Stasiun?: string }).Nama_Stasiun ||
            'Tidak Diketahui'
          : (item.Stasiun as { Nama_Stasiun?: string })?.Nama_Stasiun ||
            'Tidak Diketahui';
      countMap[namaStasiun] = (countMap[namaStasiun] || 0) + 1;
    }

    // 5. Ubah jadi array dan urutkan dari terbesar
    const result = Object.entries(countMap)
      .map(([nama_stasiun, jumlah]) => ({ nama_stasiun, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah);

    return result;
  }

  async exportBukuTamu(
    access_token: string,
    user_id: string,
    bulan: string,
    tahun: string,
    format: string,
  ): Promise<Buffer> {
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || authData.user?.id !== user_id) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const { data: adminData } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', user_id)
      .single();

    if (!adminData) {
      throw new BadRequestException('Admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    let query = supabase.from('Buku_Tamu').select(`
    ID_Buku_Tamu, Tujuan, Tanggal_Pengisian, Waktu_Kunjungan,
    Pengunjung:ID_Pengunjung(Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung, Asal_Pengunjung, Asal_Instansi),
    Stasiun:ID_Stasiun(Nama_Stasiun)
  `);

    let startDate: string;
    let endDate: string;

    startDate = bulan !== 'all' ? `${tahun}-${bulan}-01` : `${tahun}-01-01`;

    endDate =
      bulan !== 'all'
        ? dayjs(`${tahun}-${bulan}-01`).endOf('month').format('YYYY-MM-DD')
        : `${tahun}-12-31`;

    query = query
      .gte('Tanggal_Pengisian', startDate)
      .lte('Tanggal_Pengisian', endDate);

    console.log('Filter tanggal:', startDate, '->', endDate);

    query = query.order('Tanggal_Pengisian', { ascending: false });

    if (!isSuperadmin) {
      query = query.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException('Gagal mengambil data');

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Buku Tamu');

      sheet.addRow([
        'Nama',
        'Asal',
        'Keterangan Asal',
        'Tujuan',
        'Stasiun',
        'Tanggal',
        'Waktu',
      ]);

      data.forEach((item) => {
        const pengunjung = item.Pengunjung as {
          Nama_Depan_Pengunjung?: string;
          Nama_Belakang_Pengunjung?: string;
          Asal_Pengunjung?: string;
          Asal_Instansi?: string;
        };

        const stasiun = item.Stasiun as { Nama_Stasiun?: string };

        sheet.addRow([
          `${pengunjung?.Nama_Depan_Pengunjung ?? ''} ${pengunjung?.Nama_Belakang_Pengunjung ?? ''}`,
          pengunjung?.Asal_Pengunjung ?? '',
          pengunjung?.Asal_Instansi ?? '',
          item.Tujuan,
          stasiun?.Nama_Stasiun ?? '',
          item.Tanggal_Pengisian,
          item.Waktu_Kunjungan,
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument();
      const stream = new PassThrough();
      const buffers: Buffer[] = [];

      doc.pipe(stream);
      doc
        .fontSize(14)
        .text(`Laporan Buku Tamu - ${bulan}/${tahun}`, { align: 'center' });
      doc.moveDown();

      data.forEach((item, index) => {
        const pengunjung = Array.isArray(item.Pengunjung)
          ? item.Pengunjung[0]
          : item.Pengunjung;

        const stasiun = Array.isArray(item.Stasiun)
          ? item.Stasiun[0]
          : item.Stasiun;

        doc
          .fontSize(10)
          .text(
            `${index + 1}. Nama: ${pengunjung?.Nama_Depan_Pengunjung ?? ''} ${
              pengunjung?.Nama_Belakang_Pengunjung ?? ''
            }\n   Asal: ${pengunjung?.Asal_Pengunjung ?? ''}\n Keterangan Asal: ${pengunjung?.Asal_Instansi ?? ''}\n   Tujuan: ${
              item.Tujuan
            }\n   Stasiun: ${stasiun?.Nama_Stasiun ?? ''}\n   Tanggal: ${
              item.Tanggal_Pengisian
            }\n   Waktu: ${item.Waktu_Kunjungan ?? ''}\n`,
          );
        doc.moveDown();
      });

      doc.end();

      return new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk) => buffers.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(buffers)));
        stream.on('error', (err) => reject(err));
      });
    }

    throw new BadRequestException('Format export tidak didukung');
  }

  async getWordCloudTujuanKunjungan(
    access_token: string,
    user_id: string,
  ): Promise<{ kata: string; jumlah: number }[]> {
    // 1. Verifikasi token
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException('Token tidak valid atau tidak cocok');
    }

    // 2. Validasi role Superadmin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    if (adminData.Peran !== 'Superadmin') {
      throw new ForbiddenException(
        'Hanya Superadmin yang dapat mengakses fitur ini',
      );
    }

    // 3. Ambil semua tujuan dari Buku_Tamu
    const { data, error } = await supabase.from('Buku_Tamu').select('Tujuan');

    if (error) {
      console.error('Error ambil data tujuan:', error);
      throw new InternalServerErrorException(
        'Gagal mengambil data tujuan kunjungan',
      );
    }

    // 4. Olah kata-kata dari field Tujuan → hitung frekuensi
    const wordMap: Record<string, number> = {};
    const stopWords = ['dan', 'untuk', 'dengan', 'ke', 'yang', 'di', 'dari'];

    for (const item of data || []) {
      const tujuan = item.Tujuan || '';
      const words = tujuan
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '') // hapus tanda baca
        .split(/\s+/)
        .filter((word) => word && !stopWords.includes(word));

      for (const word of words) {
        wordMap[word] = (wordMap[word] || 0) + 1;
      }
    }

    // 5. Ubah ke array dan urutkan berdasarkan frekuensi
    const result = Object.entries(wordMap)
      .map(([kata, jumlah]) => ({ kata, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah);

    return result;
  }

  async getInsightKebijakan(
    access_token: string,
    user_id: string,
  ): Promise<any> {
    // 1. Verifikasi token
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException('Token tidak valid atau tidak cocok');
    }

    // 2. Cek peran admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran')
      .eq('ID_Admin', user_id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    if (adminData.Peran !== 'Superadmin') {
      throw new ForbiddenException(
        'Hanya Superadmin yang dapat mengakses insight kebijakan',
      );
    }

    // 3. Ambil semua data Buku_Tamu (beserta relasi)
    const { data: bukuTamu, error } = await supabase.from('Buku_Tamu').select(`
      Tujuan,
      Tanggal_Pengisian,
      Pengunjung:ID_Pengunjung(Asal_Pengunjung)
    `);

    if (error) {
      console.error('Error ambil data buku tamu:', error);
      throw new InternalServerErrorException('Gagal mengambil data insight');
    }

    // 4. Analisis: hitung frekuensi Tujuan, Hari, dan Asal
    const tujuanMap: Record<string, number> = {};
    const hariMap: Record<string, number> = {};
    const asalMap: Record<string, number> = {};

    for (const item of bukuTamu || []) {
      // Tujuan
      const tujuan = item.Tujuan?.trim() || 'Tidak Diketahui';
      tujuanMap[tujuan] = (tujuanMap[tujuan] || 0) + 1;

      // Hari
      const hari = item.Tanggal_Pengisian
        ? new Date(item.Tanggal_Pengisian).toLocaleDateString('id-ID', {
            weekday: 'long',
          })
        : 'Tidak Diketahui';
      hariMap[hari] = (hariMap[hari] || 0) + 1;

      // Asal Pengunjung
      let asal = 'Tidak Diketahui';
      if (Array.isArray(item.Pengunjung) && item.Pengunjung.length > 0) {
        asal =
          (item.Pengunjung[0] as { Asal_Pengunjung?: string })
            .Asal_Pengunjung || 'Tidak Diketahui';
      } else if (item.Pengunjung && typeof item.Pengunjung === 'object') {
        asal =
          (item.Pengunjung as { Asal_Pengunjung?: string }).Asal_Pengunjung ||
          'Tidak Diketahui';
      }
      asalMap[asal] = (asalMap[asal] || 0) + 1;
    }

    const getDominan = (map: Record<string, number>) =>
      Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'Tidak Diketahui';

    const tujuanTerbanyak = getDominan(tujuanMap);
    const hariTertinggi = getDominan(hariMap);
    const asalTerbanyak = getDominan(asalMap);

    // 5. Susun insight kebijakan
    const insight = [
      {
        judul: 'Tujuan Kunjungan Terbanyak',
        kesimpulan: `Sebagian besar pengunjung datang untuk "${tujuanTerbanyak}".`,
        saran: tujuanTerbanyak.includes('edukasi')
          ? 'Pertimbangkan menambah fasilitas edukatif seperti ruang edukasi atau display interaktif.'
          : `Evaluasi dan tingkatkan layanan terkait "${tujuanTerbanyak}".`,
      },
      {
        judul: 'Hari Tersibuk Kunjungan',
        kesimpulan: `Hari dengan kunjungan terbanyak adalah hari ${hariTertinggi}.`,
        saran: `Pertimbangkan menambah petugas atau jam operasional tambahan pada hari ${hariTertinggi}.`,
      },
      {
        judul: 'Asal Pengunjung Terbanyak',
        kesimpulan: `Mayoritas pengunjung berasal dari kelompok "${asalTerbanyak}".`,
        saran: `Buat program khusus atau kerjasama dengan pihak ${asalTerbanyak.toLowerCase()}.`,
      },
    ];

    return { insight };
  }
}
