import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { SearchPengunjungDto } from '@/pengunjung/dto/search-pengunjung.dto';
export declare enum AsalPengunjung {
    BMKG = "BMKG",
    Pemerintah_Pusat_atau_Pemerintah_Daerah = "Pemerintah Pusat/Pemerintah Daerah",
    Umum = "Umum",
    Universitas = "Universitas"
}
export declare class PengunjungService {
    private readonly wilayahApi;
    getAllAsalPengunjung(): {
        value: string;
        label: string;
    }[];
    getAllStasiun(): Promise<{
        message: string;
        data: {
            ID_Stasiun: any;
            Nama_Stasiun: any;
        }[];
    }>;
    getJumlahPengunjung(id_stasiun: string): Promise<{
        hariIni: number;
        mingguIni: number;
        bulanIni: number;
    }>;
    isiBukuTamu(dto: IsiBukuTamuDto, ip: string | null, userAgent: string | null, file?: Express.Multer.File): Promise<{
        message: string;
    }>;
    private formatWaktuKunjungan;
    searchPengunjung(dto: SearchPengunjungDto): Promise<any[]>;
}
