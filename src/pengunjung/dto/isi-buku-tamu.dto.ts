import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AlamatDto {
  @ApiProperty()
  @IsString()
  province_id: string;

  @ApiProperty()
  @IsString()
  regency_id: string;

  @ApiProperty()
  @IsString()
  district_id: string;

  @ApiProperty()
  @IsString()
  village_id: string;
}

export class AlamatDetailDto {
  @ApiProperty({ example: '01' })
  @IsNotEmpty()
  @IsString()
  rt: string;

  @ApiProperty({ example: '05' })
  @IsNotEmpty()
  @IsString()
  rw: string;

  @ApiProperty({ example: '40285' })
  @IsNotEmpty()
  @IsString()
  kode_pos: string;

  @ApiProperty({ example: 'Jl. Sukajadi No. 123' })
  @IsNotEmpty()
  @IsString()
  nama_jalan: string;
}

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Dinas = 'Dinas',
  Universitas = 'Universitas',
  Media = 'Media',
  Lembaga_Non_Pemerintahan = 'Lembaga Non Pemerintahan',
  Umum = 'Umum',
}

export class IsiBukuTamuDto {
  @ApiProperty({
    description: 'Tujuan kunjungan pengunjung',
    example: 'Mengikuti rapat koordinasi',
  })
  @IsNotEmpty()
  @IsString()
  tujuan: string;

  @ApiProperty({
    description: 'ID stasiun yang dikunjungi',
    example: 'b0ae3f1d-901a-4530-a5fb-9c63c872d33e',
  })
  @IsNotEmpty()
  @IsString()
  id_stasiun: string;

  @ApiProperty({
    description: 'Waktu kunjungan dalam format "Hari, DD MMMM YYYY, HH.mm"',
    example: 'Senin, 10 Juni 2024, 14.30',
    required: false,
  })
  @IsOptional()
  @IsString()
  waktu_kunjungan?: string;

  @ApiProperty({
    description: 'Nama depan pengunjung',
    example: 'Ahmad',
  })
  @IsNotEmpty()
  @IsString()
  Nama_Depan_Pengunjung: string;

  @ApiProperty({
    description: 'Nama belakang pengunjung',
    example: 'Hidayat',
  })
  @IsNotEmpty()
  @IsString()
  Nama_Belakang_Pengunjung: string;

  @ApiProperty({
    description: 'Email pengunjung',
    example: 'ahmad.hidayat@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  Email_Pengunjung: string;

  @ApiProperty({
    description: 'Nomor telepon pengunjung',
    example: '081234567890',
  })
  @IsNotEmpty()
  @IsString()
  No_Telepon_Pengunjung: string;

  @ApiProperty({
    type: () => AsalPengunjung,
  })
  @IsNotEmpty()
  @IsString()
  Asal_Pengunjung: string;

  @ApiProperty({
    description: 'Keterangan tambahan tentang asal pengunjung',
    example: 'Perwakilan dari Dishub Jawa Barat',
  })
  @IsOptional()
  @IsString()
  Keterangan_Asal_Pengunjung?: string;

  @ApiProperty({
    description: 'Alamat dalam bentuk JSON string',
    example:
      '{"province_id":"32","regency_id":"3204","district_id":"3204190","village_id":"3204190005"}',
    required: false,
  })
  @IsString()
  alamat?: string;
  @ApiProperty({
    description: 'Detail alamat dalam bentuk JSON string',
    example:
      '{"rt":"01","rw":"05","kode_pos":"40285","nama_jalan":"Jl. Sukajadi No. 123"}',
    required: false,
  })
  @IsString()
  alamat_detail?: string;
}
