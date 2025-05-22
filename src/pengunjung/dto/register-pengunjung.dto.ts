import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';

export class AlamatDto {
  @ApiProperty()
  @IsString()
  Provinsi?: string;

  @ApiProperty()
  @IsString()
  Kabupaten?: string;

  @ApiProperty()
  @IsString()
  Kecamatan?: string;

  @ApiProperty()
  @IsString()
  Kelurahan?: string;

  @ApiProperty()
  @IsString()
  Kode_Pos?: string;

  @ApiProperty()
  RT?: number;

  @ApiProperty()
  RW?: number;

  @ApiProperty()
  @IsString()
  Alamat_Jalan?: string;
}

export enum AsalPengunjung {
  BMKG = 'BMKG',
  PEMPROV = 'PEMPROV',
  PEMKAB = 'PEMKAB',
  PEMKOT = 'PEMKOT',
  UNIVERSITAS = 'UNIVERSITAS',
  UMUM = 'UMUM',
}

export class RegisterPengunjungDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  nama_depan_pengunjung: string;

  @ApiProperty()
  @IsString()
  nama_belakang_pengunjung: string;

  @ApiProperty()
  @IsString()
  no_telepon_pengunjung: string;

  @ApiProperty({ enum: AsalPengunjung })
  @IsEnum(AsalPengunjung)
  asal_pengunjung: AsalPengunjung;

  @ApiProperty()
  @IsString()
  keterangan_asal_pengunjung?: string;

  @ApiProperty({ type: AlamatDto })
  alamat?: AlamatDto;

  @ApiProperty()
  @IsString()
  foto_pengunjung?: string;
}
