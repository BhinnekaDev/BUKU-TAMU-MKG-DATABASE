import { AdminService } from '@/admin/admin.service';
import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
import { Request } from 'express';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    register(dto: RegisterAdminDto, req: Request, foto_admin: Express.Multer.File): Promise<{
        message: string;
        id_admin: string;
        email: string;
    }>;
    login(dto: LoginAdminDto, req: Request): Promise<{
        message: string;
        access_token: string;
        user_id: string;
        role: any;
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    getProfile(authHeader: string): Promise<{
        ID_Admin: any;
        Email_Admin: any;
        Nama_Depan_Admin: any;
        Nama_Belakang_Admin: any;
        Peran: any;
        ID_Stasiun: any;
    }>;
    updateProfile(authHeader: string, dto: UpdateAdminProfileDto, foto_admin: Express.Multer.File, req: Request): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto, req: Request, userAgent: string): Promise<{
        message: string;
    }>;
    getBukuTamu(authHeader: string, req: Request): Promise<{
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
    deleteBukuTamu(id: string, req: Request): Promise<{
        message: string;
    }>;
    getDashboard(req: Request): Promise<{
        peran: any;
        id_stasiun: any;
        jumlah_tamu: number;
    }>;
    getKunjungan(req: Request, search?: string, startDate?: string, endDate?: string): Promise<{
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
    getStatistikKunjungan(req: Request): Promise<{
        mingguan: Record<string, number>;
        bulanan: Record<string, number>;
        tahunan: Record<string, number>;
    }>;
    private extractToken;
}
