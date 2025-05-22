import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { RegisterPengunjungDto } from '@/pengunjung/dto/register-pengunjung.dto';
import { ResetPasswordPengunjungDto } from '@/pengunjung/dto/reset-password-pengunjung.dto';
import { UpdatePengunjungDto } from '@/pengunjung/dto/update-pengunjung.dto';
export declare class PengunjungService {
    register(dto: RegisterPengunjungDto, ip: string | null, userAgent: string | null, file: Express.Multer.File): Promise<{
        message: string;
        id_pengunjung: string;
        email: string;
    }>;
    login(dto: LoginPengunjungDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
        access_token: string;
        user: {
            id: string;
            email: string;
        };
    }>;
    logout(token: string, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    getProfile(token: string): Promise<{
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
    updateProfile(token: string, dto: UpdatePengunjungDto, ip: string | null, userAgent: string | null, file?: Express.Multer.File): Promise<any>;
    resetPasswordPengunjung(dto: ResetPasswordPengunjungDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    isiBukuTamu(dto: IsiBukuTamuDto, file: Express.Multer.File, ip: string | null, userAgent: string | null, token: string): Promise<{
        message: string;
    }>;
}
