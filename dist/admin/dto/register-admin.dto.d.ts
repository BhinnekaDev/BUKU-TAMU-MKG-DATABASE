export declare enum PeranAdmin {
    ADMIN = "Admin",
    SUPERADMIN = "Superadmin"
}
export declare class RegisterAdminDto {
    email: string;
    password: string;
    nama_depan_admin: string;
    nama_belakang_admin: string;
    peran: PeranAdmin;
    id_stasiun?: string;
    foto_admin?: Express.Multer.File;
}
