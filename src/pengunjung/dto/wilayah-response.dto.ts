export class WilayahResponseDto {
  id: string;
  name: string;
  province_id?: string; // Hanya ada di kabupaten/kota
  regency_id?: string; // Hanya ada di kecamatan
  district_id?: string; // Hanya ada di kelurahan
}
