import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { LogoutPengunjungDto } from '@/pengunjung/dto/logout-pengunjung.dto';
import { ResetPasswordPengunjungDto } from '@/pengunjung/dto/reset-password-pengunjung.dto';
import { UpdatePengunjungDto } from '@/pengunjung/dto/update-pengunjung.dto';
import { WilayahResponseDto } from '@/pengunjung/dto/wilayah-response.dto';
import { PengunjungService } from '@/pengunjung/pengunjung.service';
import { Request } from 'express';
export declare class PengunjungController {
    private readonly pengunjungService;
    constructor(pengunjungService: PengunjungService);
    getAll(): {
        value: string;
        label: string;
    }[];
    getProvinceById(id: string): Promise<WilayahResponseDto[]>;
    getRegencyById(id: string): Promise<WilayahResponseDto[]>;
    getDistrictById(id: string): Promise<WilayahResponseDto[]>;
    getVillageById(id: string): Promise<WilayahResponseDto[]>;
    register(file: Express.Multer.File, body: any, ip: string, req: Request): Promise<{
        message: string;
        id_pengunjung: string;
        email: string;
    }>;
    getAllStasiun(): Promise<{
        message: string;
        data: {
            ID_Stasiun: any;
            Nama_Stasiun: any;
        }[];
    }>;
    login(dto: LoginPengunjungDto, ip: string, req: Request): Promise<{
        message: string;
        token: string;
        refresh_token: string;
        id_pengunjung: string;
        email: string;
        nama: string;
    }>;
    getJumlahPengunjung(authorization: string, user_id: string): Promise<{
        hariIni: number;
        mingguIni: number;
        bulanIni: number;
    }>;
    logout(req: Request, dto: LogoutPengunjungDto): Promise<{
        message: string;
    }>;
    getProfile(access_token: string, user_id: string): Promise<{
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
    }>;
    updateProfile(dto: UpdatePengunjungDto, foto: Express.Multer.File, ip: string, req: Request, authHeader: string, idPengunjungHeader: string): Promise<{
        message: string;
        profile: {
            auth: {
                email: string;
                password_updated: boolean;
            };
            pengunjung: any;
            alamat: any;
        };
    }>;
    resetPassword(dto: ResetPasswordPengunjungDto, ip: string, req: Request): Promise<{
        message: string;
    }>;
    isiBukuTamu(file: Express.Multer.File, dto: IsiBukuTamuDto, accessTokenHeader: string, userIdHeader: string, ip: string, req: Request): Promise<{
        message: string;
    }>;
    getRiwayatBukuTamu(access_token: string, user_id: string): Promise<{
        status: string;
        data: never[];
        message: string;
    } | {
        status: string;
        data: {
            id: any;
            tujuan: any;
            waktu_kunjungan: any;
            tanda_tangan: any;
            stasiun: any;
            status: any;
            pengunjung: string;
            email: any;
        }[];
        message?: undefined;
    }>;
}
