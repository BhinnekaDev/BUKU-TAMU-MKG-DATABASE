import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
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
    isiBukuTamu(dto: IsiBukuTamuDto, req: Request, file?: Express.Multer.File): Promise<{
        message: string;
    }>;
}
