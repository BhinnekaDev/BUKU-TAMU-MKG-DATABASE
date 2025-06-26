export declare class AlamatDto {
    province_id: string;
    regency_id: string;
    district_id: string;
    village_id: string;
}
export declare class AlamatDetailDto {
    rt: string;
    rw: string;
    kode_pos: string;
    nama_jalan: string;
}
export declare enum AsalPengunjung {
    BMKG = "BMKG",
    Dinas = "Dinas",
    Universitas = "Universitas",
    Media = "Media",
    Lembaga_Non_Pemerintahan = "Lembaga Non Pemerintahan",
    Umum = "Umum"
}
export declare class IsiBukuTamuDto {
    tujuan: string;
    id_stasiun: string;
    waktu_kunjungan?: string;
    Nama_Depan_Pengunjung: string;
    Nama_Belakang_Pengunjung: string;
    Email_Pengunjung: string;
    No_Telepon_Pengunjung: string;
    Asal_Pengunjung: string;
    Keterangan_Asal_Pengunjung?: string;
    alamat?: string;
    alamat_detail?: string;
}
