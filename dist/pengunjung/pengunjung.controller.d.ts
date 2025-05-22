import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { PengunjungService } from '@/pengunjung/pengunjung.service';
import { UpdatePengunjungDto } from './dto/update-pengunjung.dto';
export declare class PengunjungController {
    private readonly pengunjungService;
    constructor(pengunjungService: PengunjungService);
    register(file: Express.Multer.File, body: any, ip: string, userAgent: string): Promise<{
        message: string;
        id_pengunjung: string;
        email: string;
    }>;
    login(dto: LoginPengunjungDto, ip: string, userAgent: string): Promise<{
        message: string;
        access_token: string;
        user: {
            id: string;
            email: string;
        };
    }>;
    logout(token: string, ip: string, userAgent: string): Promise<{
        message: string;
    }>;
    getProfile(authHeader: string): Promise<{
        ID_Pengunjung: any;
        Nama_Depan_Pengunjung: any;
        Nama_Belakang_Pengunjung: any;
        Email_Pengunjung: any;
        No_Telepon_Pengunjung: any;
        Asal_Pengunjung: any;
        Keterangan_Asal_Pengunjung: any;
        Foto_Pengunjung: any;
        Alamat: {
            Provinsi: any;
            Kabupaten: any;
            Kecamatan: any;
            Kelurahan: any;
            Kode_Pos: any;
            RT: any;
            RW: any;
            Alamat_Jalan: any;
        }[];
    }>;
    updateProfile(dto: UpdatePengunjungDto, authHeader: string, ip: string, userAgent: string, file: Express.Multer.File, req: Request): Promise<any>;
    resetPassword(dto: {
        email: string;
        new_password: string;
    }, ip: string, userAgent: string): Promise<{
        message: string;
    }>;
    isiBukuTamu(file: Express.Multer.File, dto: IsiBukuTamuDto, ip: string, userAgent: string, token: string): Promise<{
        message: string;
    }>;
    private extractToken;
}
