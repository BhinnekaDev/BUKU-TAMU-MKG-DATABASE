import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
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

    const id_admin = userData.user.id;
    let fotoUrl: string | null = null;
    if (foto_admin) {
      const fileExt = foto_admin.originalname.split('.').pop();
      const filePath = `${id_admin}.${fileExt}`;

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
      ID_Admin: id_admin,
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
      ID_User: id_admin,
      Role: 'Admin',
      Action: 'Register',
      Description: `${peran} terdaftar dengan nama ${nama_depan_admin} ${nama_belakang_admin} di stasiun ${namaStasiun} dengan ID: ${id_admin} dan Email: ${email}`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Registrasi admin berhasil',
      id_admin,
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
    const session = data.session;

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
      user_id: user.id,
      role: adminData.Peran,
    };
  }

  async logout(token: string, ip: string | null, userAgent: string | null) {
    const { data: userData, error } = await supabase.auth.getUser(token);

    if (error || !userData?.user) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const userId = userData.user.id;

    // Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, Nama_Depan_Admin, Nama_Belakang_Admin, ID_Stasiun')
      .eq('ID_Admin', userId)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Gagal mengambil data admin');
    }

    // Ambil nama stasiun jika ada
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

    // Catat log logout
    await supabase.from('Activity_Log').insert({
      ID_User: userId,
      Role: 'Admin',
      Action: 'Logout',
      Description: `${adminData.Peran} dengan nama ${adminData.Nama_Depan_Admin} ${adminData.Nama_Belakang_Admin} dari stasiun ${namaStasiun} berhasil logout`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return {
      message: 'Logout berhasil',
    };
  }

  async getProfile(token: string) {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const { user } = data;

    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select(
        'ID_Admin, Email_Admin, Nama_Depan_Admin, Nama_Belakang_Admin, Peran, ID_Stasiun',
      )
      .eq('ID_Admin', user.id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Gagal mengambil data admin');
    }

    return adminData;
  }

  async updateProfile(
    token: string,
    dto: UpdateAdminProfileDto,
    ip: string | null,
    userAgent: string | null,
    foto_admin?: Express.Multer.File,
  ) {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const { user } = data;
    const { nama_depan_admin, nama_belakang_admin, password } = dto;

    // Ambil data lama untuk log dan cek foto lama
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select(
        'Nama_Depan_Admin, Nama_Belakang_Admin, Peran, ID_Stasiun, Foto_Admin',
      )
      .eq('ID_Admin', user.id)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Gagal mengambil data admin');
    }

    const updates: any = {};
    if (nama_depan_admin) updates.Nama_Depan_Admin = nama_depan_admin;
    if (nama_belakang_admin) updates.Nama_Belakang_Admin = nama_belakang_admin;

    // Jika ada foto baru, hapus yang lama dan upload yang baru
    if (foto_admin) {
      // Hapus foto lama
      if (adminData.Foto_Admin) {
        const oldUrl = adminData.Foto_Admin;
        const storageBaseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/`;
        const oldPath = oldUrl.replace(storageBaseUrl, '');

        if (oldPath) {
          const { error: deleteError } = await supabase.storage
            .from('foto-admin')
            .remove([oldPath]);

          if (deleteError) {
            console.error('Gagal menghapus foto lama:', deleteError.message);
          }
        }
      }

      // Upload foto baru
      const fileExt = foto_admin.originalname.split('.').pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-admin')
        .upload(filePath, foto_admin.buffer, {
          contentType: foto_admin.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new BadRequestException('Gagal mengupload foto admin');
      }

      const fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${filePath}`;
      updates.Foto_Admin = fotoUrl;
    }

    // Update data admin
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('Admin')
        .update(updates)
        .eq('ID_Admin', user.id);

      if (updateError) {
        throw new BadRequestException('Gagal update profil admin');
      }
    }

    // Update password jika ada
    if (password) {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) {
        throw new BadRequestException(
          'Gagal memperbarui password. Pastikan password baru berbeda dan valid',
        );
      }
    }

    // Ambil nama stasiun untuk log
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

    // Catat log aktivitas
    const fieldsUpdated = [
      ...(nama_depan_admin ? ['nama depan'] : []),
      ...(nama_belakang_admin ? ['nama belakang'] : []),
      ...(password ? ['password'] : []),
      ...(foto_admin ? ['foto'] : []),
    ];

    if (fieldsUpdated.length > 0) {
      await supabase.from('Activity_Log').insert({
        ID_User: user.id,
        Role: 'Admin',
        Action: 'Update Profile',
        Description: `${adminData.Peran} ${adminData.Nama_Depan_Admin} ${adminData.Nama_Belakang_Admin}${
          namaStasiun ? ' dari stasiun ' + namaStasiun : ''
        } memperbarui: ${fieldsUpdated.join(', ')}`,
        IP_Address: ip,
        User_Agent: userAgent,
      });
    }

    return { message: 'Profil berhasil diperbarui' };
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

    // 2. Update password user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: new_password,
      },
    );

    if (updateError) {
      throw new BadRequestException('Gagal mengubah password');
    }

    // 3. (Opsional) Catat log reset password
    await supabase.from('Activity_Log').insert({
      ID_User: user.id,
      Role: 'Admin',
      Action: 'Reset Password',
      Description: `Admin dengan email ${email} berhasil reset password melalui backend`,
      IP_Address: ip,
      User_Agent: userAgent,
    });

    return { message: 'Password berhasil direset' };
  }

  async getBukuTamu(token: string) {
    // 1. Verifikasi user dari token Supabase
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser(token);

    if (sessionError || !user) {
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kedaluwarsa',
      );
    }

    const adminId = user.id;

    // 2. Ambil data Admin
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
        Tanda_Tangan,
        Pengunjung:ID_Pengunjung(Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung),
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

  async deleteBukuTamu(
    id: string,
    token: string,
    ip: string | null,
    userAgent: string | null,
  ) {
    // 1. Verifikasi token dan ambil user
    let user;
    try {
      const { data, error: sessionError } = await supabase.auth.getUser(token);

      if (sessionError || !data?.user) {
        console.error('Token verification failed:', sessionError);
        throw new UnauthorizedException(
          'Token tidak valid atau sudah kedaluwarsa',
        );
      }

      user = data.user;
    } catch (err) {
      console.error('Token verification failed:', err);
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kedaluwarsa',
      );
    }

    const adminId = user.id;

    // 2. Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran')
      .eq('ID_Admin', adminId)
      .single();

    if (adminError || !adminData) {
      throw new BadRequestException('Data admin tidak ditemukan');
    }

    if (adminData.Peran !== 'Superadmin') {
      throw new ForbiddenException(
        'Hanya superadmin yang dapat menghapus buku tamu',
      );
    }

    // 3. Ambil data buku tamu untuk mengetahui tanda tangan (jika ada)
    const { data: bukuTamu, error: fetchError } = await supabase
      .from('Buku_Tamu')
      .select('Tanda_Tangan')
      .eq('ID_Buku_Tamu', id)
      .single();

    if (fetchError || !bukuTamu) {
      throw new NotFoundException('Data buku tamu tidak ditemukan');
    }

    // 4. Hapus file tanda tangan dari bucket jika ada
    const storageBaseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/tanda-tangan/`;

    if (bukuTamu.Tanda_Tangan) {
      const filePath = bukuTamu.Tanda_Tangan.replace(storageBaseUrl, '');

      const { error: storageError } = await supabase.storage
        .from('tanda-tangan')
        .remove([filePath]);

      if (storageError) {
        throw new InternalServerErrorException(
          'Gagal menghapus tanda tangan dari storage',
        );
      }
    }

    // 5. Hapus data buku tamu
    const { error: deleteError } = await supabase
      .from('Buku_Tamu')
      .delete()
      .eq('ID_Buku_Tamu', id);

    if (deleteError) {
      throw new InternalServerErrorException('Gagal menghapus data buku tamu');
    }

    return { message: 'Buku tamu berhasil dihapus' };
  }

  async getDashboard(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    // Ambil data user dari token
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData?.user?.id) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const id_admin = userData.user.id;

    // Ambil data admin
    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', id_admin)
      .single();

    if (adminError || !adminData) {
      throw new UnauthorizedException('Admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';

    let jumlahTamu = 0;

    if (isSuperadmin) {
      // Semua data tamu
      const { count, error: countError } = await supabase
        .from('Buku_Tamu')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new BadRequestException('Gagal menghitung data tamu');
      }

      jumlahTamu = count!;
    } else {
      // Data tamu sesuai ID_Stasiun
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
    token: string,
    search?: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);
    if (authError || !userData?.user?.id) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const id_admin = userData.user.id;

    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', id_admin)
      .single();

    if (adminError || !adminData) {
      throw new UnauthorizedException('Admin tidak ditemukan');
    }

    const isSuperadmin = adminData.Peran === 'Superadmin';
    const idStasiun = adminData.ID_Stasiun;

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

    // Filter berdasarkan role
    if (!isSuperadmin) {
      query = query.eq('ID_Stasiun', idStasiun);
    }

    // Ambil data mentah dulu
    const { data: rawData, error } = await query;
    if (error) {
      console.error('Supabase error saat ambil kunjungan:', error);
      throw new BadRequestException('Gagal mengambil data kunjungan');
    }

    // Gabungkan nama + filter hasil di sisi aplikasi
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

  async getStatistikKunjungan(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);
    if (authError || !userData?.user?.id) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const id_admin = userData.user.id;

    const { data: adminData, error: adminError } = await supabase
      .from('Admin')
      .select('Peran, ID_Stasiun')
      .eq('ID_Admin', id_admin)
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

    // Inisialisasi statistik
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
