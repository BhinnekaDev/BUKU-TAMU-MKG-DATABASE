import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { LogoutAdminDto } from '@/admin/dto/logout-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
export declare class AdminService {
    register(dto: RegisterAdminDto, ip: string | null, userAgent: string | null, foto_admin?: Express.Multer.File): Promise<{
        message: string;
        user_id: string;
        email: string;
    }>;
    login(dto: LoginAdminDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
        access_token: string;
        refresh_token: string;
        user_id: string;
        role: any;
        expires_at: number | undefined;
    }>;
    logout(dto: LogoutAdminDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    getProfile(user_id: string, access_token: string): Promise<{
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
    updateProfile(dto: UpdateAdminProfileDto & {
        access_token: string;
        user_id: string;
        ip?: string;
        user_agent?: string;
    }, foto?: Express.Multer.File): Promise<any>;
    resetPassword(dto: ResetPasswordDto, ip: string | null, userAgent: string | null): Promise<{
        message: string;
    }>;
    getBukuTamu(access_token: string, user_id: string, period?: 'today' | 'week' | 'month', startDate?: string, endDate?: string, filterStasiunId?: string): Promise<any>;
    getBukuTamuByPeriod(access_token: string, user_id: string, period: 'today' | 'week' | 'month'): Promise<any>;
    getBukuTamuHariIni(access_token: string, user_id: string): Promise<any>;
    getBukuTamuMingguIni(access_token: string, user_id: string): Promise<any>;
    getBukuTamuBulanIni(access_token: string, user_id: string): Promise<any>;
    getDashboard(user_id: string, access_token: string): Promise<{
        peran: any;
        id_stasiun: any;
        jumlah_tamu: number;
    }>;
    getDaftarKunjungan(user_id: string, access_token: string, search?: string, startDate?: string, endDate?: string): Promise<{
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
    private getWeekOfMonth;
    getFrekuensiTujuanKunjungan(access_token: string, user_id: string): Promise<any[]>;
    getAsalPengunjungTerbanyak(access_token: string, user_id: string): Promise<{
        asal: string;
        jumlah: number;
    }[]>;
    getPerbandinganStasiun(access_token: string, user_id: string): Promise<{
        nama_stasiun: string;
        jumlah: number;
    }[]>;
    exportBukuTamu(access_token: string, user_id: string, bulan: string, tahun: string, format: string): Promise<Buffer>;
    getWordCloudTujuanKunjungan(access_token: string, user_id: string): Promise<{
        kata: string;
        jumlah: number;
    }[]>;
    getInsightKebijakan(access_token: string, user_id: string): Promise<any>;
}
