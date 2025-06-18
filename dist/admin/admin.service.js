"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const register_admin_dto_1 = require("./dto/register-admin.dto");
const supabase_client_1 = require("../supabase/supabase.client");
const common_1 = require("@nestjs/common");
let AdminService = class AdminService {
    async register(dto, ip, userAgent, foto_admin) {
        const { email, password, nama_depan_admin, nama_belakang_admin, peran, id_stasiun, } = dto;
        if (peran === register_admin_dto_1.PeranAdmin.SUPERADMIN && id_stasiun) {
            throw new common_1.BadRequestException('Superadmin tidak boleh memiliki ID_Stasiun');
        }
        if (peran === register_admin_dto_1.PeranAdmin.ADMIN && !id_stasiun) {
            throw new common_1.BadRequestException('Admin harus memiliki ID_Stasiun');
        }
        const { data: existing, error: errorCheck } = await supabase_client_1.supabase.auth.admin
            .listUsers()
            .then(({ data, error }) => {
            if (error) {
                throw new common_1.BadRequestException('Gagal cek email di Supabase');
            }
            return {
                data: {
                    users: data?.users?.filter((user) => user.email === email),
                },
                error: null,
            };
        });
        if (errorCheck) {
            throw new common_1.BadRequestException('Gagal cek email di Supabase');
        }
        if (existing?.users?.length) {
            throw new common_1.BadRequestException('Email sudah digunakan');
        }
        const { data: userData, error: registerError } = await supabase_client_1.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (registerError || !userData?.user?.id) {
            throw new common_1.BadRequestException('Gagal mendaftarkan user ke Supabase Auth');
        }
        const user_id = userData.user.id;
        let fotoUrl = null;
        if (foto_admin) {
            const fileExt = foto_admin.originalname.split('.').pop();
            const filePath = `${user_id}.${fileExt}`;
            const { error: uploadError } = await supabase_client_1.supabase.storage
                .from('foto-admin')
                .upload(filePath, foto_admin.buffer, {
                contentType: foto_admin.mimetype,
                upsert: true,
            });
            if (uploadError) {
                console.error('Upload foto gagal:', uploadError.message);
                throw new common_1.BadRequestException('Gagal mengupload foto admin');
            }
            fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${filePath}`;
        }
        const { error: insertError } = await supabase_client_1.supabase.from('Admin').insert({
            ID_Admin: user_id,
            Email_Admin: email,
            Nama_Depan_Admin: nama_depan_admin,
            Nama_Belakang_Admin: nama_belakang_admin,
            Peran: peran,
            ID_Stasiun: peran === register_admin_dto_1.PeranAdmin.ADMIN ? id_stasiun : null,
            Foto_Admin: fotoUrl,
        });
        if (insertError) {
            throw new common_1.BadRequestException('Gagal menyimpan data admin ke database');
        }
        let namaStasiun = '';
        if (id_stasiun) {
            const { data: stasiunData, error: stasiunError } = await supabase_client_1.supabase
                .from('Stasiun')
                .select('Nama_Stasiun')
                .eq('ID_Stasiun', id_stasiun)
                .single();
            if (!stasiunError && stasiunData?.Nama_Stasiun) {
                namaStasiun = stasiunData.Nama_Stasiun;
            }
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
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
    async login(dto, ip, userAgent) {
        const { email, password } = dto;
        const { data, error } = await supabase_client_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data?.user || !data?.session) {
            throw new common_1.BadRequestException('Email atau password salah');
        }
        const user = data.user;
        let session = data.session;
        try {
            const { data: refreshedData, error: refreshError } = await supabase_client_1.supabase.auth.refreshSession();
            if (!refreshError && refreshedData?.session) {
                session = refreshedData.session;
            }
            await supabase_client_1.supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
            });
        }
        catch (refreshErr) {
            console.error('Gagal memperpanjang session:', refreshErr);
        }
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, Nama_Depan_Admin, Nama_Belakang_Admin, ID_Stasiun')
            .eq('ID_Admin', user.id)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Gagal mengambil data admin');
        }
        let namaStasiun = '';
        if (adminData.ID_Stasiun) {
            const { data: stasiunData, error: stasiunError } = await supabase_client_1.supabase
                .from('Stasiun')
                .select('Nama_Stasiun')
                .eq('ID_Stasiun', adminData.ID_Stasiun)
                .single();
            if (!stasiunError && stasiunData?.Nama_Stasiun) {
                namaStasiun = stasiunData.Nama_Stasiun;
            }
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: user.id,
            Role: 'Admin',
            Action: 'Login',
            Description: `${adminData.Peran} dengan nama ${adminData.Nama_Depan_Admin} ${adminData.Nama_Belakang_Admin}` +
                (namaStasiun ? ` dari stasiun ${namaStasiun}` : '') +
                ` berhasil login`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return {
            message: 'Login berhasil',
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user_id: user.id,
            role: adminData.Peran,
            expires_at: session.expires_at,
        };
    }
    async logout(dto, ip, userAgent) {
        const { user_id, access_token } = dto;
        const { data: { user }, error, } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (error || !user?.id || user.id !== user_id) {
            console.error('Token tidak valid atau tidak sesuai');
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak sesuai');
        }
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, Nama_Depan_Admin, Nama_Belakang_Admin, ID_Stasiun')
            .eq('ID_Admin', user_id)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Gagal mengambil data admin');
        }
        let namaStasiun = '';
        if (adminData.ID_Stasiun) {
            const { data: stasiunData } = await supabase_client_1.supabase
                .from('Stasiun')
                .select('Nama_Stasiun')
                .eq('ID_Stasiun', adminData.ID_Stasiun)
                .single();
            if (stasiunData?.Nama_Stasiun) {
                namaStasiun = stasiunData.Nama_Stasiun;
            }
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: user_id,
            Role: 'Admin',
            Action: 'Logout',
            Description: `${adminData.Peran} dengan nama ${adminData.Nama_Depan_Admin} ${adminData.Nama_Belakang_Admin}` +
                (namaStasiun ? ` dari stasiun ${namaStasiun}` : '') +
                ` berhasil logout`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return { message: 'Logout berhasil' };
    }
    async getProfile(user_id, access_token) {
        const { data: { user }, error, } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (error || !user?.id || user.id !== user_id) {
            console.error('Invalid token or mismatch:', {
                error,
                tokenUserId: user?.id,
                requestedUserId: user_id,
            });
            throw new common_1.UnauthorizedException('Invalid token or user mismatch');
        }
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select(`
        ID_Admin, 
        Email_Admin, 
        Nama_Depan_Admin, 
        Nama_Belakang_Admin, 
        Peran,
        Foto_Admin, 
        ID_Stasiun
      `)
            .eq('ID_Admin', user.id)
            .single();
        if (adminError) {
            console.error('Admin data fetch error:', adminError);
            throw new common_1.BadRequestException('Failed to fetch admin data');
        }
        if (!adminData) {
            throw new common_1.NotFoundException('Admin not found');
        }
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
    async updateProfile(dto, foto) {
        const { user_id, access_token, nama_depan, nama_belakang, password, ip, user_agent, } = dto;
        const { data: { user }, error: authError, } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (authError || !user?.id || user.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak sesuai');
        }
        const { data: existingAdmin, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Nama_Depan_Admin, Nama_Belakang_Admin, Foto_Admin')
            .eq('ID_Admin', user_id)
            .single();
        if (adminError || !existingAdmin) {
            throw new common_1.BadRequestException('Data admin tidak ditemukan');
        }
        let fotoUrl = existingAdmin.Foto_Admin;
        let uploadedFileName = null;
        let updatedFields = [];
        try {
            if (foto) {
                if (!['image/jpeg', 'image/png'].includes(foto.mimetype)) {
                    throw new common_1.BadRequestException('Format file harus JPG atau PNG');
                }
                if (foto.size > 2 * 1024 * 1024) {
                    throw new common_1.BadRequestException('Ukuran file maksimal 2MB');
                }
                const fileExt = foto.originalname.split('.').pop();
                uploadedFileName = `${user_id}.${fileExt}`;
                if (fotoUrl) {
                    const oldFileName = fotoUrl.split('/').pop();
                    await supabase_client_1.supabase.storage.from('foto-admin').remove([oldFileName]);
                }
                const { error: uploadError } = await supabase_client_1.supabase.storage
                    .from('foto-admin')
                    .upload(uploadedFileName, foto.buffer, {
                    contentType: foto.mimetype,
                    upsert: true,
                });
                if (uploadError) {
                    throw new common_1.BadRequestException('Gagal mengunggah foto baru');
                }
                fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${uploadedFileName}`;
                updatedFields.push('foto');
            }
            if (password) {
                const { error: pwError } = await supabase_client_1.supabase.auth.admin.updateUserById(user_id, { password });
                if (pwError) {
                    throw new common_1.BadRequestException('Gagal memperbarui password');
                }
                updatedFields.push('password');
            }
            const updatePayload = {};
            if (nama_depan && nama_depan !== existingAdmin.Nama_Depan_Admin) {
                updatePayload.Nama_Depan_Admin = nama_depan;
                updatedFields.push('nama_depan');
            }
            if (nama_belakang &&
                nama_belakang !== existingAdmin.Nama_Belakang_Admin) {
                updatePayload.Nama_Belakang_Admin = nama_belakang;
                updatedFields.push('nama_belakang');
            }
            if (fotoUrl && fotoUrl !== existingAdmin.Foto_Admin) {
                updatePayload.Foto_Admin = fotoUrl;
            }
            if (Object.keys(updatePayload).length > 0) {
                const { error: updateError } = await supabase_client_1.supabase
                    .from('Admin')
                    .update(updatePayload)
                    .eq('ID_Admin', user_id);
                if (updateError) {
                    throw new common_1.BadRequestException('Gagal memperbarui profil admin');
                }
            }
            if (updatedFields.length > 0) {
                await supabase_client_1.supabase.from('Activity_Log').insert({
                    ID_User: user_id,
                    Role: 'Admin',
                    Action: 'Update Profile',
                    Description: `Admin memperbarui: ${updatedFields.join(', ')}`,
                    IP_Address: ip,
                    User_Agent: user_agent,
                });
            }
            const { data: updatedAdmin } = await supabase_client_1.supabase
                .from('Admin')
                .select('Nama_Depan_Admin, Nama_Belakang_Admin, Foto_Admin')
                .eq('ID_Admin', user_id)
                .single();
            const transformedData = {
                nama_depan: updatedAdmin?.Nama_Depan_Admin || existingAdmin.Nama_Depan_Admin,
                nama_belakang: updatedAdmin?.Nama_Belakang_Admin ||
                    existingAdmin.Nama_Belakang_Admin,
                foto: updatedAdmin?.Foto_Admin || existingAdmin.Foto_Admin,
            };
            return {
                message: updatedFields.length > 0
                    ? 'Profil admin berhasil diperbarui'
                    : 'Tidak ada perubahan yang dilakukan',
                data: transformedData,
                updated_fields: updatedFields,
            };
        }
        catch (error) {
            if (uploadedFileName) {
                await supabase_client_1.supabase.storage
                    .from('foto-admin')
                    .remove([uploadedFileName])
                    .catch((cleanupError) => {
                    console.error('Gagal menghapus foto yang baru diupload:', cleanupError);
                });
            }
            throw error;
        }
    }
    async resetPassword(dto, ip, userAgent) {
        const { email, new_password } = dto;
        const { data: listUserData, error: listError } = await supabase_client_1.supabase.auth.admin.listUsers();
        if (listError) {
            throw new common_1.BadRequestException('Gagal mengambil data pengguna');
        }
        const user = listUserData.users.find((u) => u.email === email);
        if (!user) {
            throw new common_1.NotFoundException('Email tidak ditemukan');
        }
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('ID_Admin')
            .eq('Email_Admin', email)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Email tidak terdaftar sebagai Admin');
        }
        const { error: updateError } = await supabase_client_1.supabase.auth.admin.updateUserById(user.id, {
            password: new_password,
        });
        if (updateError) {
            throw new common_1.BadRequestException('Gagal mengubah password');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: user.id,
            Role: 'Admin',
            Action: 'Reset Password',
            Description: `Admin dengan email ${email} berhasil reset password`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return { message: 'Password berhasil direset' };
    }
    async getBukuTamu(access_token, user_id) {
        const { data: authData, error: authError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (authError || !authData || authData.user?.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok dengan user_id');
        }
        const adminId = user_id;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', adminId)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Data admin tidak ditemukan');
        }
        const isSuperadmin = adminData.Peran === 'Superadmin';
        let bukuTamuQuery = supabase_client_1.supabase
            .from('Buku_Tamu')
            .select(`
      ID_Buku_Tamu,
      ID_Pengunjung,
      ID_Stasiun,
      Tujuan,
      Tanggal_Pengisian,
      Waktu_Kunjungan,
      Tanda_Tangan,
      Pengunjung:ID_Pengunjung(ID_Pengunjung, Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung, Asal_Pengunjung),
      Stasiun:ID_Stasiun(Nama_Stasiun)
    `)
            .order('Tanggal_Pengisian', { ascending: false });
        if (!isSuperadmin) {
            if (!adminData.ID_Stasiun) {
                throw new common_1.BadRequestException('Admin tidak memiliki ID_Stasiun');
            }
            bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
        }
        const { data: bukuTamuData, error: bukuTamuError } = await bukuTamuQuery;
        if (bukuTamuError) {
            throw new common_1.InternalServerErrorException('Gagal mengambil data buku tamu');
        }
        return bukuTamuData;
    }
    async getBukuTamuByPeriod(access_token, user_id, period) {
        const { data: authData, error: authError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (authError || !authData || authData.user?.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok dengan user_id');
        }
        const adminId = user_id;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', adminId)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Data admin tidak ditemukan');
        }
        const isSuperadmin = adminData.Peran === 'Superadmin';
        let bukuTamuQuery = supabase_client_1.supabase
            .from('Buku_Tamu')
            .select(`
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
      `)
            .order('Tanggal_Pengisian', { ascending: false });
        if (!isSuperadmin) {
            if (!adminData.ID_Stasiun) {
                throw new common_1.BadRequestException('Admin tidak memiliki ID_Stasiun');
            }
            bukuTamuQuery = bukuTamuQuery.eq('ID_Stasiun', adminData.ID_Stasiun);
        }
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        switch (period) {
            case 'today':
                bukuTamuQuery = bukuTamuQuery.gte('Tanggal_Pengisian', startOfDay.toISOString());
                break;
            case 'week':
                bukuTamuQuery = bukuTamuQuery.gte('Tanggal_Pengisian', startOfWeek.toISOString());
                break;
            case 'month':
                bukuTamuQuery = bukuTamuQuery.gte('Tanggal_Pengisian', startOfMonth.toISOString());
                break;
            default:
                throw new common_1.BadRequestException('Periode filter tidak valid');
        }
        const { data, error } = await bukuTamuQuery;
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            period,
            isSuperadmin,
            stationFilter: !isSuperadmin ? adminData.ID_Stasiun : 'all',
            count: data.length,
            data,
        };
    }
    async getBukuTamuHariIni(access_token, user_id) {
        return this.getBukuTamuByPeriod(access_token, user_id, 'today');
    }
    async getBukuTamuMingguIni(access_token, user_id) {
        return this.getBukuTamuByPeriod(access_token, user_id, 'week');
    }
    async getBukuTamuBulanIni(access_token, user_id) {
        return this.getBukuTamuByPeriod(access_token, user_id, 'month');
    }
    async getDashboard(user_id, access_token) {
        if (!access_token || !user_id) {
            throw new common_1.UnauthorizedException('Token atau user_id tidak ditemukan');
        }
        const { data: userData, error } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (error || !userData?.user || userData.user.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok dengan user_id');
        }
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', user_id)
            .single();
        if (adminError || !adminData) {
            throw new common_1.UnauthorizedException('Admin tidak ditemukan');
        }
        const isSuperadmin = adminData.Peran === 'Superadmin';
        let jumlahTamu = 0;
        if (isSuperadmin) {
            const { count, error: countError } = await supabase_client_1.supabase
                .from('Buku_Tamu')
                .select('*', { count: 'exact', head: true });
            if (countError) {
                throw new common_1.BadRequestException('Gagal menghitung data tamu');
            }
            jumlahTamu = count;
        }
        else {
            const { count, error: countError } = await supabase_client_1.supabase
                .from('Buku_Tamu')
                .select('*', { count: 'exact', head: true })
                .eq('ID_Stasiun', adminData.ID_Stasiun);
            if (countError) {
                throw new common_1.BadRequestException('Gagal menghitung data tamu');
            }
            jumlahTamu = count;
        }
        return {
            peran: adminData.Peran,
            id_stasiun: adminData.ID_Stasiun,
            jumlah_tamu: jumlahTamu,
        };
    }
    async getDaftarKunjungan(user_id, access_token, search, startDate, endDate) {
        if (!user_id || !access_token) {
            throw new common_1.UnauthorizedException('user_id atau access_token tidak ditemukan');
        }
        const { data: sessionData, error: sessionError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (sessionError || !sessionData?.user || sessionData.user.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok dengan user_id');
        }
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', user_id)
            .single();
        if (adminError || !adminData) {
            throw new common_1.UnauthorizedException('Admin tidak ditemukan');
        }
        const isSuperadmin = adminData.Peran === 'Superadmin';
        const idStasiun = adminData.ID_Stasiun;
        let query = supabase_client_1.supabase
            .from('Buku_Tamu')
            .select(`
      ID_Buku_Tamu,
      ID_Pengunjung,
      ID_Stasiun,
      Tujuan,
      Tanggal_Pengisian,
      Pengunjung(ID_Pengunjung, Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung)
    `)
            .order('Tanggal_Pengisian', { ascending: false });
        if (!isSuperadmin) {
            query = query.eq('ID_Stasiun', idStasiun);
        }
        const { data: rawData, error } = await query;
        if (error) {
            console.error('Supabase error saat ambil kunjungan:', error);
            throw new common_1.BadRequestException('Gagal mengambil data kunjungan');
        }
        const filtered = rawData.filter((item) => {
            const fullName = `${item.Pengunjung?.Nama_Depan_Pengunjung ?? ''} ${item.Pengunjung?.Nama_Belakang_Pengunjung ?? ''}`.toLowerCase();
            const matchesSearch = search
                ? fullName.includes(search.toLowerCase())
                : true;
            const kunjunganDate = new Date(item.Tanggal_Pengisian);
            const matchesDate = (() => {
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : null;
                return ((!start || kunjunganDate >= start) && (!end || kunjunganDate <= end));
            })();
            return matchesSearch && matchesDate;
        });
        return filtered;
    }
    getWeekNumber(d) {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }
    async getStatistikKunjungan(userId, accessToken) {
        if (!userId || !accessToken) {
            throw new common_1.UnauthorizedException('user_id atau access_token tidak ditemukan');
        }
        const { data: sessionData, error: sessionError } = await supabase_client_1.supabase.auth.getUser(accessToken);
        if (sessionError || !sessionData?.user || sessionData.user.id !== userId) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok dengan user_id');
        }
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', userId)
            .single();
        if (adminError || !adminData) {
            throw new common_1.UnauthorizedException('Admin tidak ditemukan');
        }
        const isSuperadmin = adminData.Peran === 'Superadmin';
        const idStasiun = adminData.ID_Stasiun;
        let query = supabase_client_1.supabase
            .from('Buku_Tamu')
            .select('Tanggal_Pengisian')
            .order('Tanggal_Pengisian', { ascending: true });
        if (!isSuperadmin) {
            query = query.eq('ID_Stasiun', idStasiun);
        }
        const { data: kunjunganData, error } = await query;
        if (error) {
            throw new common_1.BadRequestException('Gagal mengambil data kunjungan');
        }
        const statistik = {
            mingguan: {},
            bulanan: {},
            tahunan: {},
        };
        for (const kunjungan of kunjunganData) {
            const tanggal = new Date(kunjungan.Tanggal_Pengisian);
            const week = this.getWeekNumber(tanggal);
            const mingguKey = `${tanggal.getFullYear()}-Minggu${week}`;
            statistik.mingguan[mingguKey] = (statistik.mingguan[mingguKey] || 0) + 1;
            const bulanKey = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}`;
            statistik.bulanan[bulanKey] = (statistik.bulanan[bulanKey] || 0) + 1;
            const tahunKey = `${tanggal.getFullYear()}`;
            statistik.tahunan[tahunKey] = (statistik.tahunan[tahunKey] || 0) + 1;
        }
        return statistik;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)()
], AdminService);
//# sourceMappingURL=admin.service.js.map