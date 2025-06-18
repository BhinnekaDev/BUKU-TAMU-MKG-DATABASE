import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { LogoutAdminDto } from '@/admin/dto/logout-admin.dto';
import { PeranAdmin, RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
import { supabase } from '@/supabase/supabase.client';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

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
      // Alternatif 1: Gunakan refreshSession()
      const { data: refreshedData, error: refreshError } =
        await supabase.auth.refreshSession();
      if (!refreshError && refreshedData?.session) {
        session = refreshedData.session;
      }

      // Alternatif 2: Update session (tanpa expires_in)
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

    // 2. Get existing admin data
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
      // 3. Handle photo upload if exists
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

        // Delete old photo if exists
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

      // 4. Update password if provided
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

      // 5. Prepare update payload
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

      // 6. Update admin profile if there are changes
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from('Admin')
          .update(updatePayload)
          .eq('ID_Admin', user_id);

        if (updateError) {
          throw new BadRequestException('Gagal memperbarui profil admin');
        }
      }

      // 7. Log activity if there were updates
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
      // Cleanup if error occurs after photo upload
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

  async getBukuTamu(access_token: string, user_id: string): Promise<any> {
    // 1. Verifikasi token Supabase
    const { data: authData, error: authError } =
      await supabase.auth.getUser(access_token);

    if (authError || !authData || authData.user?.id !== user_id) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    const adminId = user_id;

    // 2. Ambil data admin dari database
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', adminId)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    // 3. Siapkan query dasar
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
      Pengunjung:ID_Pengunjung(ID_Pengunjung, Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung, Asal_Pengunjung),
      Stasiun:ID_Stasiun(Nama_Stasiun)
    `,
      )
      .order('Tanggal_Pengisian', { ascending: false });

    // 4. Jika bukan Superadmin, filter berdasarkan ID_Stasiun
    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }

      bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    // 5. Eksekusi query
    const { data: bukuTamuData, error: bukuTamuError } = await bukuTamuQuery;

    if (bukuTamuError) {
      throw new InternalServerErrorException('Gagal mengambil data buku tamu');
    }

    return bukuTamuData;
  }

  async getBukuTamuByPeriod(
    access_token: string,
    user_id: string,
    period: 'today' | 'week' | 'month',
  ): Promise<any> {
    // 1. Verify Supabase token
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

    // 3. Prepare base query
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
          Asal_Pengunjung
        ),
        Stasiun:ID_Stasiun(Nama_Stasiun)
      `,
      )
      .order('Tanggal_Pengisian', { ascending: false });

    // 4. Apply station filter for non-superadmins
    if (!isSuperadmin) {
      if (!adminData.ID_Stasiun) {
        throw new BadRequestException('Admin tidak memiliki ID_Stasiun');
      }
      bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
    }

    // 5. Apply time period filter
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
        const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : null;
        return (
          (!start || kunjunganDate >= start) && (!end || kunjunganDate <= end)
        );
      })();

      return matchesSearch && matchesDate;
    });

    return filtered;
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
  }

  async getStatistikKunjungan(userId: string, accessToken: string) {
    if (!userId || !accessToken) {
      throw new UnauthorizedException(
        'user_id atau access_token tidak ditemukan',
      );
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getUser(accessToken);
    if (sessionError || !sessionData?.user || sessionData.user.id !== userId) {
      throw new UnauthorizedException(
        'Token tidak valid atau tidak cocok dengan user_id',
      );
    }

    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', userId)
      .single();

    if (adminError || !adminData) {
      throw new UnauthorizedException('Admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';
    const idStasiun = adminData.ID_Stasiun;

    // Ambil semua data kunjungan
    let query = supabase
      .from('Buku_Tamu')
      .select('Tanggal_Pengisian')
      .order('Tanggal_Pengisian', { ascending: true });

    if (!isSuperadmin) {
      query = query.eq('ID_Stasiun', idStasiun);
    }

    const { data: kunjunganData, error } = await query;
    if (error) {
      throw new BadRequestException('Gagal mengambil data kunjungan');
    }

    const statistik = {
      mingguan: {} as Record<string, number>,
      bulanan: {} as Record<string, number>,
      tahunan: {} as Record<string, number>,
    };

    for (const kunjungan of kunjunganData) {
      const tanggal = new Date(kunjungan.Tanggal_Pengisian);

      // Mingguan
      const week = this.getWeekNumber(tanggal);
      const mingguKey = `${tanggal.getFullYear()}-Minggu${week}`;
      statistik.mingguan[mingguKey] = (statistik.mingguan[mingguKey] || 0) + 1;

      // Bulanan
      const bulanKey = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}`;
      statistik.bulanan[bulanKey] = (statistik.bulanan[bulanKey] || 0) + 1;

      // Tahunan
      const tahunKey = `${tanggal.getFullYear()}`;
      statistik.tahunan[tahunKey] = (statistik.tahunan[tahunKey] || 0) + 1;
    }

    return statistik;
  }
}
