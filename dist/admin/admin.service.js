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
        const id_admin = userData.user.id;
        let fotoUrl = null;
        if (foto_admin) {
            const fileExt = foto_admin.originalname.split('.').pop();
            const filePath = `${id_admin}.${fileExt}`;
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
            ID_Admin: id_admin,
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
        const session = data.session;
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
            user_id: user.id,
            role: adminData.Peran,
        };
    }
    async logout(token, ip, userAgent) {
        const { data: userData, error } = await supabase_client_1.supabase.auth.getUser(token);
        if (error || !userData?.user) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const userId = userData.user.id;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, Nama_Depan_Admin, Nama_Belakang_Admin, ID_Stasiun')
            .eq('ID_Admin', userId)
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
    async getProfile(token) {
        const { data, error } = await supabase_client_1.supabase.auth.getUser(token);
        if (error || !data?.user) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const { user } = data;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('ID_Admin, Email_Admin, Nama_Depan_Admin, Nama_Belakang_Admin, Peran, ID_Stasiun')
            .eq('ID_Admin', user.id)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Gagal mengambil data admin');
        }
        return adminData;
    }
    async updateProfile(token, dto, ip, userAgent, foto_admin) {
        const { data, error } = await supabase_client_1.supabase.auth.getUser(token);
        if (error || !data?.user) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const { user } = data;
        const { nama_depan_admin, nama_belakang_admin, password } = dto;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Nama_Depan_Admin, Nama_Belakang_Admin, Peran, ID_Stasiun, Foto_Admin')
            .eq('ID_Admin', user.id)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Gagal mengambil data admin');
        }
        const updates = {};
        if (nama_depan_admin)
            updates.Nama_Depan_Admin = nama_depan_admin;
        if (nama_belakang_admin)
            updates.Nama_Belakang_Admin = nama_belakang_admin;
        if (foto_admin) {
            if (adminData.Foto_Admin) {
                const oldUrl = adminData.Foto_Admin;
                const storageBaseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/`;
                const oldPath = oldUrl.replace(storageBaseUrl, '');
                if (oldPath) {
                    const { error: deleteError } = await supabase_client_1.supabase.storage
                        .from('foto-admin')
                        .remove([oldPath]);
                    if (deleteError) {
                        console.error('Gagal menghapus foto lama:', deleteError.message);
                    }
                }
            }
            const fileExt = foto_admin.originalname.split('.').pop();
            const filePath = `${user.id}.${fileExt}`;
            const { error: uploadError } = await supabase_client_1.supabase.storage
                .from('foto-admin')
                .upload(filePath, foto_admin.buffer, {
                contentType: foto_admin.mimetype,
                upsert: true,
            });
            if (uploadError) {
                throw new common_1.BadRequestException('Gagal mengupload foto admin');
            }
            const fotoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/foto-admin/${filePath}`;
            updates.Foto_Admin = fotoUrl;
        }
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase_client_1.supabase
                .from('Admin')
                .update(updates)
                .eq('ID_Admin', user.id);
            if (updateError) {
                throw new common_1.BadRequestException('Gagal update profil admin');
            }
        }
        if (password) {
            const { error: pwError } = await supabase_client_1.supabase.auth.updateUser({ password });
            if (pwError) {
                throw new common_1.BadRequestException('Gagal memperbarui password. Pastikan password baru berbeda dan valid');
            }
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
        const fieldsUpdated = [
            ...(nama_depan_admin ? ['nama depan'] : []),
            ...(nama_belakang_admin ? ['nama belakang'] : []),
            ...(password ? ['password'] : []),
            ...(foto_admin ? ['foto'] : []),
        ];
        if (fieldsUpdated.length > 0) {
            await supabase_client_1.supabase.from('Activity_Log').insert({
                ID_User: user.id,
                Role: 'Admin',
                Action: 'Update Profile',
                Description: `${adminData.Peran} ${adminData.Nama_Depan_Admin} ${adminData.Nama_Belakang_Admin}${namaStasiun ? ' dari stasiun ' + namaStasiun : ''} memperbarui: ${fieldsUpdated.join(', ')}`,
                IP_Address: ip,
                User_Agent: userAgent,
            });
        }
        return { message: 'Profil berhasil diperbarui' };
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
            Description: `Admin dengan email ${email} berhasil reset password melalui backend`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return { message: 'Password berhasil direset' };
    }
    async getBukuTamu(token) {
        const { data: { user }, error: sessionError, } = await supabase_client_1.supabase.auth.getUser(token);
        if (sessionError || !user) {
            throw new common_1.UnauthorizedException('Token tidak valid atau sudah kedaluwarsa');
        }
        const adminId = user.id;
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
        Tanda_Tangan,
        Pengunjung:ID_Pengunjung(Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung),
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
    async deleteBukuTamu(id, token, ip, userAgent) {
        let user;
        try {
            const { data, error: sessionError } = await supabase_client_1.supabase.auth.getUser(token);
            if (sessionError || !data?.user) {
                console.error('Token verification failed:', sessionError);
                throw new common_1.UnauthorizedException('Token tidak valid atau sudah kedaluwarsa');
            }
            user = data.user;
        }
        catch (err) {
            console.error('Token verification failed:', err);
            throw new common_1.UnauthorizedException('Token tidak valid atau sudah kedaluwarsa');
        }
        const adminId = user.id;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran')
            .eq('ID_Admin', adminId)
            .single();
        if (adminError || !adminData) {
            throw new common_1.BadRequestException('Data admin tidak ditemukan');
        }
        if (adminData.Peran !== 'Superadmin') {
            throw new common_1.ForbiddenException('Hanya superadmin yang dapat menghapus buku tamu');
        }
        const { data: bukuTamu, error: fetchError } = await supabase_client_1.supabase
            .from('Buku_Tamu')
            .select('Tanda_Tangan')
            .eq('ID_Buku_Tamu', id)
            .single();
        if (fetchError || !bukuTamu) {
            throw new common_1.NotFoundException('Data buku tamu tidak ditemukan');
        }
        const storageBaseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/tanda-tangan/`;
        if (bukuTamu.Tanda_Tangan) {
            const filePath = bukuTamu.Tanda_Tangan.replace(storageBaseUrl, '');
            const { error: storageError } = await supabase_client_1.supabase.storage
                .from('tanda-tangan')
                .remove([filePath]);
            if (storageError) {
                throw new common_1.InternalServerErrorException('Gagal menghapus tanda tangan dari storage');
            }
        }
        const { error: deleteError } = await supabase_client_1.supabase
            .from('Buku_Tamu')
            .delete()
            .eq('ID_Buku_Tamu', id);
        if (deleteError) {
            throw new common_1.InternalServerErrorException('Gagal menghapus data buku tamu');
        }
        return { message: 'Buku tamu berhasil dihapus' };
    }
    async getDashboard(token) {
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        const { data: userData, error } = await supabase_client_1.supabase.auth.getUser(token);
        if (error || !userData?.user?.id) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const id_admin = userData.user.id;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', id_admin)
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
    async getDaftarKunjungan(token, search, startDate, endDate) {
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        const { data: userData, error: authError } = await supabase_client_1.supabase.auth.getUser(token);
        if (authError || !userData?.user?.id) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const id_admin = userData.user.id;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', id_admin)
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
    async getStatistikKunjungan(token) {
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        const { data: userData, error: authError } = await supabase_client_1.supabase.auth.getUser(token);
        if (authError || !userData?.user?.id) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const id_admin = userData.user.id;
        const { data: adminData, error: adminError } = await supabase_client_1.supabase
            .from('Admin')
            .select('Peran, ID_Stasiun')
            .eq('ID_Admin', id_admin)
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