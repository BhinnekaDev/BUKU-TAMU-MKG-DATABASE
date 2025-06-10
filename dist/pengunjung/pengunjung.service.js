"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PengunjungService = exports.AsalPengunjung = void 0;
const axios_1 = require("axios");
const API_BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';
const supabase_client_1 = require("../supabase/supabase.client");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const uuid_1 = require("uuid");
var AsalPengunjung;
(function (AsalPengunjung) {
    AsalPengunjung["BMKG"] = "BMKG";
    AsalPengunjung["Dinas"] = "Dinas";
    AsalPengunjung["Universitas"] = "Universitas";
    AsalPengunjung["Media"] = "Media";
    AsalPengunjung["LembagaNonPemerintahan"] = "Lembaga Non Pemerintahan";
    AsalPengunjung["Umum"] = "Umum";
})(AsalPengunjung || (exports.AsalPengunjung = AsalPengunjung = {}));
let PengunjungService = class PengunjungService {
    wilayahApi = axios_1.default.create({
        baseURL: API_BASE_URL,
    });
    getAllAsalPengunjung() {
        return Object.entries(AsalPengunjung).map(([key, value]) => ({
            value,
            label: value,
        }));
    }
    async getProvinceById(id) {
        const { data } = await this.wilayahApi.get(`/province/${id}.json`);
        return data;
    }
    async getRegencyById(id) {
        const { data } = await this.wilayahApi.get(`/regency/${id}.json`);
        return data;
    }
    async getDistrictById(id) {
        const { data } = await this.wilayahApi.get(`/district/${id}.json`);
        return data;
    }
    async getVillageById(id) {
        const { data } = await this.wilayahApi.get(`/village/${id}.json`);
        return data;
    }
    async register(dto, ip, userAgent, file) {
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
            }
            catch (e) {
                console.error('Gagal parse alamat:', e);
                throw new common_1.BadRequestException('Format alamat tidak valid');
            }
        }
        else if (dto.alamat) {
            console.log('Alamat sudah dalam format object');
        }
        const requiredFields = [
            'email',
            'password',
            'nama_depan_pengunjung',
            'no_telepon_pengunjung',
            'asal_pengunjung',
        ];
        const missingFields = requiredFields.filter((field) => !dto[field]);
        if (missingFields.length > 0) {
            throw new common_1.BadRequestException(`Field berikut wajib diisi: ${missingFields.join(', ')}`);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
            throw new common_1.BadRequestException('Format email tidak valid');
        }
        if (dto.password.length < 8 ||
            !/[A-Z]/.test(dto.password) ||
            !/[0-9]/.test(dto.password)) {
            throw new common_1.BadRequestException('Password harus minimal 8 karakter dan mengandung huruf besar dan angka');
        }
        const { email, password, nama_depan_pengunjung, nama_belakang_pengunjung, no_telepon_pengunjung, asal_pengunjung, keterangan_asal_pengunjung, alamat, } = dto;
        try {
            const { data, error } = await supabase_client_1.supabase.auth.admin.listUsers();
            if (error) {
                console.error('Supabase auth error:', error);
                throw new Error('Gagal ambil daftar user dari Supabase Auth');
            }
            const existingUsers = data?.users?.filter((user) => user.email === email);
            if (existingUsers?.length) {
                throw new common_1.BadRequestException('Email sudah digunakan');
            }
        }
        catch (err) {
            console.error('Error checking email:', err);
            throw new common_1.BadRequestException('Gagal memverifikasi email dikarrenakan sudah terdaftar harap masukan email lain');
        }
        let id_pengunjung;
        try {
            const { data: userData, error: registerError } = await supabase_client_1.supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });
            if (registerError || !userData?.user?.id) {
                console.error('Register error:', registerError);
                throw new common_1.BadRequestException('Gagal mendaftarkan user ke Supabase Auth');
            }
            id_pengunjung = userData.user.id;
        }
        catch (err) {
            console.error('Auth registration failed:', err);
            throw new common_1.BadRequestException('Proses autentikasi gagal');
        }
        let alamatId = null;
        if (typeof alamat === 'string') {
            try {
                dto.alamat = JSON.parse(alamat);
            }
            catch (e) {
                throw new common_1.BadRequestException('Format alamat tidak valid');
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
                if (!alamat.province_id ||
                    !alamat.regency_id ||
                    !alamat.district_id ||
                    !alamat.village_id) {
                    throw new common_1.BadRequestException('Data alamat tidak lengkap');
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
                const { data: existingAlamat, error: checkError } = await supabase_client_1.supabase
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
                    console.error('Address check error:', checkError);
                    throw checkError;
                }
                if (existingAlamat?.ID_Alamat) {
                    alamatId = existingAlamat.ID_Alamat;
                }
                else {
                    const { data: insertedAlamat, error: insertError } = await supabase_client_1.supabase
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
            }
            catch (error) {
                console.error('Address save error:', error);
                try {
                    await supabase_client_1.supabase.auth.admin.deleteUser(id_pengunjung);
                }
                catch (deleteError) {
                    console.error('Failed to cleanup auth user:', deleteError);
                }
                throw new common_1.BadRequestException('Gagal menyimpan alamat: ' + error.message);
            }
        }
        let fotoUrl = null;
        if (file) {
            try {
                const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
                const maxSize = 5 * 1024 * 1024;
                if (!validTypes.includes(file.mimetype)) {
                    throw new common_1.BadRequestException('Format file harus JPG, PNG, atau GIF');
                }
                if (file.size > maxSize) {
                    throw new common_1.BadRequestException('Ukuran file maksimal 5MB');
                }
                const fileExt = (0, path_1.extname)(file.originalname);
                const path = `${id_pengunjung}${fileExt}`;
                const { error: uploadError } = await supabase_client_1.supabase.storage
                    .from('foto-pengunjung')
                    .upload(path, file.buffer, {
                    contentType: file.mimetype,
                    cacheControl: '3600',
                    upsert: true,
                });
                if (uploadError) {
                    console.error('File upload error:', uploadError);
                    throw new common_1.BadRequestException('Gagal mengunggah foto pengunjung');
                }
                const { data: urlData } = supabase_client_1.supabase.storage
                    .from('foto-pengunjung')
                    .getPublicUrl(path);
                fotoUrl = urlData.publicUrl;
            }
            catch (error) {
                console.error('File handling error:', error);
                try {
                    await supabase_client_1.supabase.auth.admin.deleteUser(id_pengunjung);
                    if (alamatId) {
                        await supabase_client_1.supabase.from('Alamat').delete().eq('ID_Alamat', alamatId);
                    }
                }
                catch (cleanupError) {
                    console.error('Cleanup failed:', cleanupError);
                }
                throw new common_1.BadRequestException(error.message);
            }
        }
        try {
            const { error: pengunjungError } = await supabase_client_1.supabase
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
        }
        catch (error) {
            console.error('Final save error:', error);
            try {
                await supabase_client_1.supabase.auth.admin.deleteUser(id_pengunjung);
                if (alamatId) {
                    await supabase_client_1.supabase.from('Alamat').delete().eq('ID_Alamat', alamatId);
                }
                if (fotoUrl) {
                    const fileExt = (0, path_1.extname)(fotoUrl);
                    const path = `${id_pengunjung}${fileExt}`;
                    await supabase_client_1.supabase.storage.from('foto-pengunjung').remove([path]);
                }
            }
            catch (cleanupError) {
                console.error('Final cleanup failed:', cleanupError);
            }
            throw new common_1.BadRequestException('Gagal menyimpan data pengunjung: ' + error.message);
        }
        try {
            await supabase_client_1.supabase.from('Activity_Log').insert({
                ID_User: id_pengunjung,
                Role: 'Pengunjung',
                Action: 'Register',
                Description: `Pengunjung ${nama_depan_pengunjung} ${nama_belakang_pengunjung || ''} berhasil mendaftar`,
                IP_Address: ip,
                User_Agent: userAgent,
            });
        }
        catch (logError) {
            console.error('Activity log failed:', logError);
        }
        return {
            message: 'Registrasi pengunjung berhasil',
            id_pengunjung,
            email,
        };
    }
    async getAllStasiun() {
        const { data, error } = await supabase_client_1.supabase
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
    async login(dto, ip, userAgent) {
        const { email, password } = dto;
        const { data: authData, error: loginError } = await supabase_client_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (loginError || !authData?.user) {
            throw new common_1.UnauthorizedException('Email atau password salah');
        }
        const user = authData.user;
        const id_pengunjung = user.id;
        const { data: pengunjungData, error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung')
            .eq('ID_Pengunjung', id_pengunjung)
            .single();
        if (pengunjungError || !pengunjungData) {
            throw new common_1.NotFoundException('Data pengunjung tidak ditemukan');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: id_pengunjung,
            Role: 'Pengunjung',
            Action: 'Login',
            Description: `Pengunjung ${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung} berhasil login.`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return {
            message: 'Login berhasil',
            token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            id_pengunjung,
            email,
            nama: `${pengunjungData.Nama_Depan_Pengunjung} ${pengunjungData.Nama_Belakang_Pengunjung}`,
        };
    }
    async getJumlahPengunjung(access_token, user_id) {
        const { data: authData, error: authError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (authError || !authData || authData.user?.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok dengan user_id');
        }
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        try {
            const queries = [
                supabase_client_1.supabase
                    .from('Buku_Tamu')
                    .select('*', { count: 'exact', head: true })
                    .gte('Tanggal_Pengisian', startOfDay.toISOString()),
                supabase_client_1.supabase
                    .from('Buku_Tamu')
                    .select('*', { count: 'exact', head: true })
                    .gte('Tanggal_Pengisian', startOfWeek.toISOString()),
                supabase_client_1.supabase
                    .from('Buku_Tamu')
                    .select('*', { count: 'exact', head: true })
                    .gte('Tanggal_Pengisian', startOfMonth.toISOString()),
            ];
            const [hariIni, mingguIni, bulanIni] = await Promise.all(queries);
            if (hariIni.error || mingguIni.error || bulanIni.error) {
                console.error('Error fetching statistics:', {
                    hariIniError: hariIni.error,
                    mingguIniError: mingguIni.error,
                    bulanIniError: bulanIni.error,
                });
                throw new common_1.BadRequestException('Gagal mengambil data statistik pengunjung');
            }
            return {
                hariIni: hariIni.count || 0,
                mingguIni: mingguIni.count || 0,
                bulanIni: bulanIni.count || 0,
            };
        }
        catch (error) {
            console.error('Unexpected error in getJumlahPengunjung:', error);
            throw new common_1.BadRequestException('Terjadi kesalahan saat memproses permintaan');
        }
    }
    async logout(dto, ip, userAgent) {
        const { id_pengunjung, access_token } = dto;
        const { data: session, error } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (error || !session?.user?.id || session.user.id !== id_pengunjung) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak sesuai');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
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
    async getProfile(user_id, access_token) {
        const { data: userData, error: userError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (userError || !userData?.user?.id || userData.user.id !== user_id) {
            console.error('Token verification failed:', {
                error: userError,
                tokenUserId: userData?.user?.id,
                requestedUserId: user_id,
            });
            throw new common_1.UnauthorizedException('Invalid token or user mismatch');
        }
        const { data: pengunjung, error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('*')
            .eq('ID_Pengunjung', user_id)
            .single();
        if (pengunjungError || !pengunjung) {
            console.error('Visitor data not found:', pengunjungError);
            throw new common_1.NotFoundException('Visitor data not found');
        }
        let alamat = null;
        if (pengunjung.ID_Alamat) {
            const { data: alamatData, error: alamatError } = await supabase_client_1.supabase
                .from('Alamat')
                .select(`Provinsi, 
         Provinsi_ID,
         Kabupaten, 
         Kabupaten_ID,
         Kecamatan, 
         Kecamatan_ID,
         Kelurahan, 
         Kelurahan_ID`)
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
    async updateProfile(dto, ip, userAgent, file) {
        const { access_token, id_pengunjung } = dto;
        const { data: userData, error: userError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (userError ||
            !userData?.user?.id ||
            userData.user.id !== id_pengunjung) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok');
        }
        const responseData = {
            auth: {
                email: userData.user.email,
                password_updated: false,
            },
            pengunjung: {},
            alamat: null,
        };
        const updateData = {};
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
        if (dto.asal_pengunjung)
            updateData.Asal_Pengunjung = dto.asal_pengunjung;
        if (dto.keterangan_asal_pengunjung)
            updateData.Keterangan_Asal_Pengunjung = dto.keterangan_asal_pengunjung;
        if (dto.password) {
            const { error: pwError } = await supabase_client_1.supabase.auth.admin.updateUserById(id_pengunjung, { password: dto.password });
            if (pwError)
                throw new common_1.BadRequestException('Gagal mengubah password');
            responseData.auth.password_updated = true;
        }
        if (file) {
            const fileExt = (0, path_1.extname)(file.originalname);
            const filePath = `pengunjung/${id_pengunjung}${fileExt}`;
            const { error: uploadError } = await supabase_client_1.supabase.storage
                .from('foto-pengunjung')
                .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });
            if (uploadError) {
                throw new common_1.BadRequestException('Gagal mengunggah foto');
            }
            const { data } = supabase_client_1.supabase.storage
                .from('foto-pengunjung')
                .getPublicUrl(filePath);
            updateData.Foto_Pengunjung = data.publicUrl;
            responseData.pengunjung.foto_url = data.publicUrl;
        }
        if (dto.alamat) {
            try {
                if (!dto.alamat.province_id ||
                    !dto.alamat.regency_id ||
                    !dto.alamat.district_id ||
                    !dto.alamat.village_id) {
                    throw new Error('Data wilayah administratif tidak lengkap');
                }
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
                const { data: existingAlamat, error: checkError } = await supabase_client_1.supabase
                    .from('Alamat')
                    .select('ID_Alamat')
                    .match({
                    Provinsi_ID: alamatData.Provinsi_ID,
                    Kabupaten_ID: alamatData.Kabupaten_ID,
                    Kecamatan_ID: alamatData.Kecamatan_ID,
                    Kelurahan_ID: alamatData.Kelurahan_ID,
                })
                    .single();
                let alamatId = null;
                if (checkError && checkError.code !== 'PGRST116') {
                    throw new Error(`Gagal memeriksa alamat: ${checkError.message}`);
                }
                if (existingAlamat?.ID_Alamat) {
                    alamatId = existingAlamat.ID_Alamat;
                    await supabase_client_1.supabase
                        .from('Alamat')
                        .update(alamatData)
                        .eq('ID_Alamat', alamatId);
                }
                else {
                    const { data: insertedAlamat, error: insertError } = await supabase_client_1.supabase
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
            }
            catch (error) {
                console.error('Error saat memproses alamat:', error);
                throw new common_1.BadRequestException(error.message || 'Gagal memproses data alamat');
            }
        }
        const { error: updateError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .update(updateData)
            .eq('ID_Pengunjung', id_pengunjung);
        if (updateError) {
            throw new common_1.BadRequestException('Gagal memperbarui profil pengunjung');
        }
        const { data: pengunjungData } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('*')
            .eq('ID_Pengunjung', id_pengunjung)
            .single();
        responseData.pengunjung = pengunjungData;
        if (pengunjungData?.ID_Alamat) {
            const { data: alamatData } = await supabase_client_1.supabase
                .from('Alamat')
                .select('*')
                .eq('ID_Alamat', pengunjungData.ID_Alamat)
                .single();
            responseData.alamat = alamatData;
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
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
    async resetPasswordPengunjung(dto, ip, userAgent) {
        const { email, new_password } = dto;
        const { data: userList, error: listError } = await supabase_client_1.supabase.auth.admin.listUsers();
        if (listError) {
            throw new common_1.BadRequestException('Gagal mengambil data pengguna');
        }
        const user = userList.users.find((u) => u.email === email);
        if (!user) {
            throw new common_1.NotFoundException('Email tidak ditemukan');
        }
        const { data: pengunjungData, error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('ID_Pengunjung')
            .eq('ID_Pengunjung', user.id)
            .single();
        if (pengunjungError || !pengunjungData) {
            throw new common_1.BadRequestException('Email bukan milik pengunjung');
        }
        const { error: updateError } = await supabase_client_1.supabase.auth.admin.updateUserById(user.id, {
            password: new_password,
        });
        if (updateError) {
            throw new common_1.BadRequestException('Gagal mengubah password');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
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
    async isiBukuTamu(dto, access_token, user_id, ip, userAgent, file) {
        const { data: userData, error: userError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (userError || !userData?.user?.id || userData.user.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok');
        }
        const { data: pengunjungData, error: pengunjungError } = await supabase_client_1.supabase
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
        const { tujuan, id_stasiun } = dto;
        if (!tujuan || !id_stasiun) {
            throw new common_1.BadRequestException('Tujuan dan ID stasiun wajib diisi');
        }
        let fileUrl = null;
        if (file) {
            const path = `tanda-tangan/${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
            const { error: uploadError } = await supabase_client_1.supabase.storage
                .from('tanda-tangan')
                .upload(path, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false,
            });
            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new common_1.BadRequestException('Gagal mengunggah tanda tangan');
            }
            const urlData = supabase_client_1.supabase.storage.from('tanda-tangan').getPublicUrl(path);
            fileUrl = urlData.data?.publicUrl;
            if (!fileUrl) {
                console.error('Gagal mendapatkan URL publik');
                throw new common_1.BadRequestException('Gagal mendapatkan URL tanda tangan');
            }
        }
        const { data: stasiunData, error: stasiunError } = await supabase_client_1.supabase
            .from('Stasiun')
            .select('ID_Stasiun')
            .eq('ID_Stasiun', id_stasiun)
            .single();
        if (stasiunError || !stasiunData) {
            throw new common_1.BadRequestException('ID Stasiun tidak ditemukan');
        }
        const now = new Date();
        const optionsDate = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        const optionsTime = {
            hour: '2-digit',
            minute: '2-digit',
        };
        const hariTanggal = now.toLocaleDateString('id-ID', optionsDate);
        const jam = now.toLocaleTimeString('id-ID', optionsTime);
        const waktuKunjungan = `${hariTanggal}, ${jam}`;
        const { error: insertError } = await supabase_client_1.supabase.from('Buku_Tamu').insert({
            ID_Pengunjung: user_id,
            ID_Stasiun: id_stasiun,
            Tujuan: tujuan,
            Tanda_Tangan: fileUrl,
            Waktu_Kunjungan: waktuKunjungan,
        });
        if (insertError) {
            console.error('Insert Buku_Tamu error:', insertError);
            throw new common_1.BadRequestException('Gagal menyimpan buku tamu');
        }
        await supabase_client_1.supabase.from('Activity_Log').insert({
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
    async getRiwayatBukuTamu(user_id, access_token) {
        const { data: userData, error: userError } = await supabase_client_1.supabase.auth.getUser(access_token);
        if (userError || !userData?.user?.id || userData.user.id !== user_id) {
            throw new common_1.UnauthorizedException('Token tidak valid atau tidak cocok');
        }
        const { data: bukuTamuRecords, error: bukuTamuError } = await supabase_client_1.supabase
            .from('Buku_Tamu')
            .select('*')
            .eq('ID_Pengunjung', user_id)
            .order('Waktu_Kunjungan', { ascending: false });
        if (bukuTamuError) {
            console.error('Error fetching guest book history:', bukuTamuError);
            throw new common_1.NotFoundException('Gagal mengambil riwayat buku tamu');
        }
        if (!bukuTamuRecords || bukuTamuRecords.length === 0) {
            return {
                status: 'success',
                data: [],
                message: 'Tidak ada riwayat kunjungan ditemukan',
            };
        }
        const { data: stasiunData, error: stasiunError } = await supabase_client_1.supabase
            .from('Stasiun')
            .select('ID_Stasiun, Nama_Stasiun');
        if (stasiunError) {
            console.error('Error fetching stasiun data:', stasiunError);
            throw new common_1.NotFoundException('Gagal mengambil data stasiun');
        }
        const stasiunMap = new Map((stasiunData ?? []).map((s) => [s.ID_Stasiun, s.Nama_Stasiun]));
        const { data: pengunjungData, error: pengunjungError } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('ID_Pengunjung, Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung, Email_Pengunjung');
        if (pengunjungError) {
            console.error('Error fetching pengunjung data:', pengunjungError);
            throw new common_1.NotFoundException('Gagal mengambil data pengunjung');
        }
        const pengunjungMap = new Map((pengunjungData ?? []).map((p) => [
            p.ID_Pengunjung,
            {
                nama: `${p.Nama_Depan_Pengunjung} ${p.Nama_Belakang_Pengunjung}`.trim(),
                email: p.Email_Pengunjung,
            },
        ]));
        const formattedData = bukuTamuRecords.map((record) => ({
            id: record.ID_Buku_Tamu,
            tujuan: record.Tujuan,
            waktu_kunjungan: record.Waktu_Kunjungan,
            tanda_tangan: record.Tanda_Tangan,
            stasiun: stasiunMap.get(record.ID_Stasiun) || 'Stasiun tidak diketahui',
            status: record.Status,
            pengunjung: pengunjungMap.get(record.ID_Pengunjung)?.nama ||
                'Pengunjung tidak diketahui',
            email: pengunjungMap.get(record.ID_Pengunjung)?.email ||
                'Email tidak tersedia',
        }));
        return {
            status: 'success',
            data: formattedData,
        };
    }
};
exports.PengunjungService = PengunjungService;
exports.PengunjungService = PengunjungService = __decorate([
    (0, common_1.Injectable)()
], PengunjungService);
//# sourceMappingURL=pengunjung.service.js.map