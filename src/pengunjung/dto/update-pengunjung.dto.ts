import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AlamatDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  province_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  regency_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  district_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  village_id?: string;
}

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Dinas = 'Dinas',
  Universitas = 'Universitas',
  Media = 'Media',
  Lembaga_Non_Pemerintahan = 'Lembaga Non Pemerintahan',
  Umum = 'Umum',
}

export class UpdatePengunjungDto {
  @ApiProperty({
    required: false,
    description: 'ID pengunjung (bisa dari token header atau body)',
  })
  @IsOptional()
  @IsString()
  id_pengunjung?: string;

  @ApiProperty({ required: false, description: 'Access token JWT pengunjung' })
  @IsOptional()
  @IsString()
  access_token?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nama_depan_pengunjung?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nama_belakang_pengunjung?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  no_telepon_pengunjung?: string;

  @ApiProperty({ enum: AsalPengunjung, required: false })
  @IsOptional()
  @IsEnum(AsalPengunjung)
  asal_pengunjung?: AsalPengunjung;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keterangan_asal_pengunjung?: string;

  @ApiProperty({ type: AlamatDto, required: false })
  @IsOptional()
  alamat?: AlamatDto;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Foto pengunjung',
  })
  @IsOptional()
  foto_pengunjung?: any;
}
