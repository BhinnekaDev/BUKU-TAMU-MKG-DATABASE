import { AdminService } from '@/admin/admin.service';
import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { LogoutAdminDto } from '@/admin/dto/logout-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UbahStatusBukuTamuDto } from '@/admin/dto/ubah-status-buku-tamu.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
import { Request } from 'express';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    register(dto: RegisterAdminDto, req: Request, foto_admin: Express.Multer.File): Promise<{
        message: string;
        user_id: string;
        email: string;
    }>;
    login(dto: LoginAdminDto, req: Request): Promise<{
        message: string;
        access_token: string;
        refresh_token: string;
        user_id: string;
        role: any;
    }>;
    logout(dto: LogoutAdminDto, ip: string, req: Request): Promise<{
        message: string;
    }>;
    getProfile(access_token: string, user_id: string): Promise<{
        message: string;
        data: {
            user_id: any;
            email: any;
            nama_depan: any;
            nama_belakang: any;
            peran: any;
            foto: any;
            stasiun_id: any;
        };
    }>;
    updateProfile(dto: UpdateAdminProfileDto, req: Request, foto: Express.Multer.File, access_token: string, user_id: string): Promise<any>;
    resetPassword(dto: ResetPasswordDto, req: Request): Promise<{
        message: string;
    }>;
    getBukuTamu(req: Request): Promise<any>;
    getHariIni(authorization: string, user_id: string): Promise<any>;
    getMingguIni(authorization: string, user_id: string): Promise<any>;
    getBulanIni(authorization: string, user_id: string): Promise<any>;
    getByPeriod(period: string, authorization: string, user_id: string): Promise<any>;
    ubahStatusBukuTamu(idBukuTamu: string, dto: UbahStatusBukuTamuDto, req: Request): Promise<{
        message: string;
    }>;
    deleteBukuTamu(id: string, req: Request): Promise<{
        message: string;
    }>;
    getDashboard(req: Request): Promise<{
        peran: any;
        id_stasiun: any;
        jumlah_tamu: number;
    }>;
    getDaftarKunjungan(req: Request, search?: string, startDate?: string, endDate?: string): Promise<{
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
    getStatistik(req: Request): Promise<{
        mingguan: Record<string, number>;
        bulanan: Record<string, number>;
        tahunan: Record<string, number>;
    }>;
    private extractToken;
}
