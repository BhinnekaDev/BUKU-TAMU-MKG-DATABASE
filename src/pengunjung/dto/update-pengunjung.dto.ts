import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AlamatDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  Provinsi?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  Kabupaten?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  Kecamatan?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  Kelurahan?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  Kode_Pos?: string;

  @ApiProperty()
  @IsOptional()
  RT?: number;

  @ApiProperty()
  @IsOptional()
  RW?: number;

  @ApiProperty()
  @IsOptional()
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

export class UpdatePengunjungDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  nama_depan_pengunjung?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  nama_belakang_pengunjung?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  no_telepon_pengunjung?: string;

  @ApiProperty({ enum: AsalPengunjung })
  @IsEnum(AsalPengunjung)
  asal_pengunjung?: AsalPengunjung;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsOptional()
  keterangan_asal_pengunjung?: string;

  @ApiProperty({ type: AlamatDto })
  @IsOptional()
  alamat?: AlamatDto;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsOptional()
  foto_pengunjung?: string;
}
