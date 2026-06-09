import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Pemerintah_Pusat_atau_Pemerintah_Daerah = 'Pemerintah Pusat/Pemerintah Daerah',
  Umum = 'Umum',
  Universitas = 'Universitas',
}

export class IsiBukuTamuDto {
  @ApiProperty({
    description: 'Tujuan kunjungan pengunjung',
    example: 'Rapat koordinasi',
  })
  @IsNotEmpty()
  @IsString()
  tujuan: string;

  @ApiProperty({
    description: 'ID stasiun',
    example: '5b2df30a-4204-470a-bfff-da645ed475d4',
  })
  @IsNotEmpty()
  id_stasiun: string;

  @ApiProperty({ example: 'Ahmad' })
  @IsNotEmpty()
  @IsString()
  Nama_Depan_Pengunjung: string;

  @ApiProperty({ example: 'Hidayat', required: false })
  @IsOptional()
  @IsString()
  Nama_Belakang_Pengunjung?: string;

  @ApiProperty({ example: 'ahmad@example.com' })
  @IsNotEmpty()
  @IsEmail()
  Email_Pengunjung: string;

  @ApiProperty({ example: '08123456789' })
  @IsNotEmpty()
  @IsString()
  No_Telepon_Pengunjung: string;

  @ApiProperty({
    description: 'Asal pengunjung',
    enum: AsalPengunjung,
    enumName: 'AsalPengunjung',
    example: AsalPengunjung.BMKG,
  })
  @IsNotEmpty()
  @IsEnum(AsalPengunjung)
  Asal_Pengunjung: AsalPengunjung;

  @ApiProperty({ example: 'Dishub' })
  @IsString()
  Asal_Instansi?: string;

  @ApiProperty({ example: 'Senin, 10 Juni 2024, 14.30' })
  waktu_kunjungan: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 10, Bandung' })
  @IsNotEmpty()
  Alamat_Lengkap: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File tanda tangan (PNG/JPG)',
  })
  tanda_tangan: any;
}
