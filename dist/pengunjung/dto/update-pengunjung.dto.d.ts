export declare class AlamatDto {
    province_id?: string;
    regency_id?: string;
    district_id?: string;
    village_id?: string;
}
export declare enum AsalPengunjung {
    BMKG = "BMKG",
    Dinas = "Dinas",
    Universitas = "Universitas",
    Media = "Media",
    Lembaga_Non_Pemerintahan = "Lembaga Non Pemerintahan",
    Umum = "Umum"
}
export declare class UpdatePengunjungDto {
    id_pengunjung?: string;
    access_token?: string;
    password?: string;
    nama_depan_pengunjung?: string;
    nama_belakang_pengunjung?: string;
    no_telepon_pengunjung?: string;
    asal_pengunjung?: AsalPengunjung;
    keterangan_asal_pengunjung?: string;
    alamat?: AlamatDto;
    foto_pengunjung?: any;
}
