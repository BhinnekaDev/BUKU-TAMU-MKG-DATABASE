export declare class AlamatDto {
    Provinsi?: string;
    Kabupaten?: string;
    Kecamatan?: string;
    Kelurahan?: string;
    Kode_Pos?: string;
    RT?: number;
    RW?: number;
    Alamat_Jalan?: string;
}
export declare enum AsalPengunjung {
    BMKG = "BMKG",
    PEMPROV = "PEMPROV",
    PEMKAB = "PEMKAB",
    PEMKOT = "PEMKOT",
    UNIVERSITAS = "UNIVERSITAS",
    UMUM = "UMUM"
}
export declare class UpdatePengunjungDto {
    password?: string;
    nama_depan_pengunjung?: string;
    nama_belakang_pengunjung?: string;
    no_telepon_pengunjung?: string;
    asal_pengunjung?: AsalPengunjung;
    keterangan_asal_pengunjung?: string;
    alamat?: AlamatDto;
    foto_pengunjung?: string;
}
