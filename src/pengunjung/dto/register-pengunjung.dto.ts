import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';

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

export enum AsalPengunjung {
  BMKG = 'BMKG',
  Dinas = 'Dinas',
  Universitas = 'Universitas',
  Media = 'Media',
  Lembaga_Non_Pemerintahan = 'Lembaga Non Pemerintahan',
  Umum = 'Umum',
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
