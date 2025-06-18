import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
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
    getAllStasiun(): Promise<{
        message: string;
        data: {
            ID_Stasiun: any;
            Nama_Stasiun: any;
        }[];
    }>;
    getJumlahPengunjung(): Promise<{
        hariIni: number;
        mingguIni: number;
        bulanIni: number;
    }>;
    isiBukuTamu(dto: IsiBukuTamuDto, ip: string | null, userAgent: string | null, file?: Express.Multer.File): Promise<{
        message: string;
    }>;
    private formatWaktuKunjungan;
}
