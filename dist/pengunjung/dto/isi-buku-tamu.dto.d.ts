export declare enum AsalPengunjung {
    BMKG = "BMKG",
    Pemerintah_Pusat_atau_Pemerintah_Daerah = "Pemerintah Pusat/Pemerintah Daerah",
    Umum = "Umum",
    Universitas = "Universitas"
}
export declare class IsiBukuTamuDto {
    tujuan: string;
    id_stasiun: string;
    Nama_Depan_Pengunjung: string;
    Nama_Belakang_Pengunjung: string;
    Email_Pengunjung: string;
    No_Telepon_Pengunjung: string;
    Asal_Pengunjung: string;
    Asal_Instansi?: string;
    waktu_kunjungan: string;
    Alamat_Lengkap: string;
}
