import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { LogoutPengunjungDto } from '@/pengunjung/dto/logout-pengunjung.dto';
import { RegisterPengunjungDto } from '@/pengunjung/dto/register-pengunjung.dto';
import { ResetPasswordPengunjungDto } from '@/pengunjung/dto/reset-password-pengunjung.dto';
import { UpdatePengunjungDto } from '@/pengunjung/dto/update-pengunjung.dto';
export declare enum AsalPengunjung {
    BMKG = "BMKG",
    Dinas = "Dinas",
    Universitas = "Universitas",
    Media = "Media",
    LembagaNonPemerintahan = "Lembaga Non Pemerintahan",
    Umum = "Umum"
}
export declare class PengunjungService {
    private readonly wilayahApi;
    getAllAsalPengunjung(): {
        value: string;
        label: string;
    }[];
    getProvinceById(id: string): Promise<{
        id: string;
        name: string;
    }>;
    getRegencyById(id: string): Promise<{
        id: string;
        name: string;
        province_id: string;
    }>;
    getDistrictById(id: string): Promise<{
        id: string;
        name: string;
        regency_id: string;
    }>;
    getVillageById(id: string): Promise<{
        id: string;
        name: string;
        district_id: string;
    }>;
    register(dto: RegisterPengunjungDto, ip: string | null, userAgent: string | null, file: Express.Multer.File): Promise<{
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
    login(dto: LoginPengunjungDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
        token: string;
        refresh_token: string;
        id_pengunjung: string;
        email: string;
        nama: string;
    }>;
    getJumlahPengunjung(access_token: string, user_id: string): Promise<{
        hariIni: number;
        mingguIni: number;
        bulanIni: number;
    }>;
    logout(dto: LogoutPengunjungDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    getProfile(user_id: string, access_token: string): Promise<{
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
    updateProfile(dto: UpdatePengunjungDto, ip: string | null, userAgent: string | null, file: Express.Multer.File): Promise<{
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
    resetPasswordPengunjung(dto: ResetPasswordPengunjungDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    isiBukuTamu(dto: IsiBukuTamuDto, access_token: string, user_id: string, ip: string | null, userAgent: string | null, file?: Express.Multer.File): Promise<{
        message: string;
    }>;
    getRiwayatBukuTamu(user_id: string, access_token: string): Promise<{
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
