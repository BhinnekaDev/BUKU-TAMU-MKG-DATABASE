import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Pemerintah_Pusat_atau_Pemerintah_Daerah = 'Pemerintah Pusat/Pemerintah Daerah',
  Umum = 'Umum',
  Universitas = 'Universitas',
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
  Asal_Instansi?: string;

  @ApiProperty({
    example: 'waktu kunjungan',
    description: 'Senin, 10 Juni 2024, 14.30',
  })
  @IsNotEmpty()
  waktu_kunjungan: string;

  @ApiProperty({ example: 'Alamat Lengkap', description: 'Alamat Lengkap' })
  @IsNotEmpty()
  Alamat_Lengkap: string;
}
