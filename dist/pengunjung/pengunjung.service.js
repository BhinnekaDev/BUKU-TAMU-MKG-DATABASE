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
    async getJumlahPengunjung() {
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
    async isiBukuTamu(dto, ip, userAgent, file) {
        const { tujuan, id_stasiun, Nama_Depan_Pengunjung, Nama_Belakang_Pengunjung, Email_Pengunjung, No_Telepon_Pengunjung, Asal_Pengunjung, Keterangan_Asal_Pengunjung, alamat, waktu_kunjungan, } = dto;
        if (!tujuan ||
            !id_stasiun ||
            !Nama_Depan_Pengunjung ||
            !Nama_Belakang_Pengunjung ||
            !Email_Pengunjung ||
            !No_Telepon_Pengunjung ||
            !Asal_Pengunjung) {
            throw new common_1.BadRequestException('Semua data wajib diisi');
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
            if (uploadError)
                throw new common_1.BadRequestException('Gagal mengunggah tanda tangan');
            const urlData = supabase_client_1.supabase.storage.from('tanda-tangan').getPublicUrl(path);
            fileUrl = urlData.data?.publicUrl;
            if (!fileUrl)
                throw new common_1.BadRequestException('Gagal mendapatkan URL tanda tangan');
        }
        const { data: stasiunData, error: stasiunError } = await supabase_client_1.supabase
            .from('Stasiun')
            .select('ID_Stasiun, Nama_Stasiun')
            .eq('ID_Stasiun', id_stasiun)
            .single();
        if (stasiunError || !stasiunData) {
            throw new common_1.BadRequestException('ID Stasiun tidak ditemukan');
        }
        const waktuKunjungan = waktu_kunjungan || this.formatWaktuKunjungan();
        let alamatId = null;
        if (alamat) {
            let parsedAlamat;
            try {
                parsedAlamat = typeof alamat === 'string' ? JSON.parse(alamat) : alamat;
                const requiredFields = [
                    'province_id',
                    'regency_id',
                    'district_id',
                    'village_id',
                ];
                for (const field of requiredFields) {
                    if (!parsedAlamat[field]) {
                        throw new common_1.BadRequestException(`Field ${field} pada alamat wajib diisi`);
                    }
                }
            }
            catch (err) {
                throw new common_1.BadRequestException('Format alamat tidak valid (wajib berupa JSON string yang benar)');
            }
            const [prov, kab, kec, kel] = await Promise.all([
                this.getProvinceById(parsedAlamat.province_id).catch(() => ({
                    id: parsedAlamat.province_id,
                    name: 'Provinsi Tidak Diketahui',
                })),
                this.getRegencyById(parsedAlamat.regency_id).catch(() => ({
                    id: parsedAlamat.regency_id,
                    name: 'Kabupaten Tidak Diketahui',
                })),
                this.getDistrictById(parsedAlamat.district_id).catch(() => ({
                    id: parsedAlamat.district_id,
                    name: 'Kecamatan Tidak Diketahui',
                })),
                this.getVillageById(parsedAlamat.village_id).catch(() => ({
                    id: parsedAlamat.village_id,
                    name: 'Kelurahan Tidak Diketahui',
                })),
            ]);
            const alamatData = {
                Provinsi_ID: prov.id,
                Provinsi: prov.name,
                Kabupaten_ID: kab.id,
                Kabupaten: kab.name,
                Kecamatan_ID: kec.id,
                Kecamatan: kec.name,
                Kelurahan_ID: kel.id,
                Kelurahan: kel.name,
            };
            const { data: existingAlamat, error: findError } = await supabase_client_1.supabase
                .from('Alamat')
                .select('ID_Alamat')
                .match({
                Provinsi_ID: alamatData.Provinsi_ID,
                Kabupaten_ID: alamatData.Kabupaten_ID,
                Kecamatan_ID: alamatData.Kecamatan_ID,
                Kelurahan_ID: alamatData.Kelurahan_ID,
            })
                .single();
            if (findError && findError.code !== 'PGRST116') {
                throw new common_1.BadRequestException('Gagal mencari data alamat');
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
                    console.error('Insert alamat error:', insertError);
                    throw new common_1.BadRequestException('Gagal menyimpan data alamat');
                }
                alamatId = insertedAlamat.ID_Alamat;
            }
        }
        const { data: existingPengunjung } = await supabase_client_1.supabase
            .from('Pengunjung')
            .select('ID_Pengunjung')
            .match({
            Nama_Depan_Pengunjung,
            Nama_Belakang_Pengunjung,
            Email_Pengunjung,
            No_Telepon_Pengunjung,
            Asal_Pengunjung,
        })
            .single();
        let pengunjungId;
        if (existingPengunjung?.ID_Pengunjung) {
            pengunjungId = existingPengunjung.ID_Pengunjung;
        }
        else {
            pengunjungId = (0, uuid_1.v4)();
            const { error: pengunjungError } = await supabase_client_1.supabase
                .from('Pengunjung')
                .insert({
                ID_Pengunjung: pengunjungId,
                ID_Alamat: alamatId,
                Nama_Depan_Pengunjung,
                Nama_Belakang_Pengunjung,
                Email_Pengunjung,
                No_Telepon_Pengunjung,
                Asal_Pengunjung,
                Keterangan_Asal_Pengunjung,
            });
            if (pengunjungError) {
                console.error('Insert Pengunjung error:', pengunjungError);
                throw new common_1.BadRequestException('Gagal menyimpan data pengunjung');
            }
        }
        const { error: insertBukuTamuError } = await supabase_client_1.supabase
            .from('Buku_Tamu')
            .insert({
            ID_Pengunjung: pengunjungId,
            ID_Stasiun: id_stasiun,
            Tujuan: tujuan,
            Tanda_Tangan: fileUrl,
            Waktu_Kunjungan: waktuKunjungan,
        });
        if (insertBukuTamuError) {
            console.error('Insert Buku_Tamu error:', insertBukuTamuError);
            throw new common_1.BadRequestException('Gagal menyimpan data buku tamu');
        }
        const stasiunNama = stasiunData?.Nama_Stasiun || 'Stasiun Tidak Diketahui';
        const namaLengkap = `${Nama_Depan_Pengunjung} ${Nama_Belakang_Pengunjung}`;
        await supabase_client_1.supabase.from('Activity_Log').insert({
            ID_User: pengunjungId,
            Role: 'Pengunjung',
            Action: 'Isi Buku Tamu',
            Description: `Pengunjung dengan ID ${pengunjungId} dan nama ${namaLengkap} mengisi buku tamu ke stasiun ${stasiunNama}.`,
            IP_Address: ip,
            User_Agent: userAgent,
        });
        return { message: 'Data buku tamu berhasil disimpan' };
    }
    formatWaktuKunjungan() {
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
        return `${hariTanggal}, ${jam}`;
    }
};
exports.PengunjungService = PengunjungService;
exports.PengunjungService = PengunjungService = __decorate([
    (0, common_1.Injectable)()
], PengunjungService);
//# sourceMappingURL=pengunjung.service.js.map