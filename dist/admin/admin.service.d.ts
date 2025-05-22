import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
export declare class AdminService {
    register(dto: RegisterAdminDto, ip: string | null, userAgent: string | null, foto_admin?: Express.Multer.File): Promise<{
        message: string;
        id_admin: string;
        email: string;
    }>;
    login(dto: LoginAdminDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
        access_token: string;
        user_id: string;
        role: any;
    }>;
    logout(token: string, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    getProfile(token: string): Promise<{
        ID_Admin: any;
        Email_Admin: any;
        Nama_Depan_Admin: any;
        Nama_Belakang_Admin: any;
        Peran: any;
        ID_Stasiun: any;
    }>;
    updateProfile(token: string, dto: UpdateAdminProfileDto, ip: string | null, userAgent: string | null, foto_admin?: Express.Multer.File): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    getBukuTamu(token: string): Promise<{
        ID_Buku_Tamu: any;
        ID_Pengunjung: any;
        ID_Stasiun: any;
        Tujuan: any;
        Tanggal_Pengisian: any;
        Tanda_Tangan: any;
        Pengunjung: {
            Nama_Depan_Pengunjung: any;
            Nama_Belakang_Pengunjung: any;
        }[];
        Stasiun: {
            Nama_Stasiun: any;
        }[];
    }[]>;
    deleteBukuTamu(id: string, token: string, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    getDashboard(token: string): Promise<{
        peran: any;
        id_stasiun: any;
        jumlah_tamu: number;
    }>;
    getDaftarKunjungan(token: string, search?: string, startDate?: string, endDate?: string): Promise<{
        ID_Buku_Tamu: any;
        ID_Pengunjung: any;
        ID_Stasiun: any;
        Tujuan: any;
        Tanggal_Pengisian: any;
        Pengunjung: {
            ID_Pengunjung: any;
            Nama_Depan_Pengunjung: any;
            Nama_Belakang_Pengunjung: any;
        }[];
    }[]>;
    private getWeekNumber;
    getStatistikKunjungan(token: string): Promise<{
        mingguan: Record<string, number>;
        bulanan: Record<string, number>;
        tahunan: Record<string, number>;
    }>;
}
