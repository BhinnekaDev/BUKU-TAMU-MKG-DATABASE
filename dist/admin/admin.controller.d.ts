import { AdminService } from '@/admin/admin.service';
import { ExportBukuTamuDto } from '@/admin/dto/export-buku-tamu.dto';
import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { LogoutAdminDto } from '@/admin/dto/logout-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
import { Response as ExpressResponse, Request } from 'express';
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
        expires_at: number | undefined;
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
    getBukuTamu(access_token: string, user_id: string, period?: 'today' | 'week' | 'month', startDate?: string, endDate?: string, filterStasiunId?: string): Promise<any>;
    getHariIni(authorization: string, user_id: string): Promise<any>;
    getMingguIni(authorization: string, user_id: string): Promise<any>;
    getBulanIni(authorization: string, user_id: string): Promise<any>;
    getByPeriod(period: string, authorization: string, user_id: string): Promise<any>;
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
    getStatistikKunjungan(access_token: string, user_id: string): Promise<any>;
    getFrekuensiTujuan(access_token: string, user_id: string): Promise<any[]>;
    getAsalPengunjung(access_token: string, user_id: string): Promise<{
        asal: string;
        jumlah: number;
    }[]>;
    getPerbandinganStasiun(access_token: string, user_id: string): Promise<{
        nama_stasiun: string;
        jumlah: number;
    }[]>;
    private extractToken;
    getInsight(access_token: string, user_id: string): Promise<any>;
    getWordCloud(access_token: string, user_id: string): Promise<{
        kata: string;
        jumlah: number;
    }[]>;
    exportBukuTamu(access_token: string, user_id: string, query: ExportBukuTamuDto, res: ExpressResponse): Promise<void>;
}
