import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum PeranAdminEnum {
  ADMIN = 'Admin',
  SUPERADMIN = 'Superadmin',
}

export class CreateAdminDto {
  @ApiProperty({ example: 'Budi', description: 'Nama depan admin' })
  @IsString()
  nama_depan: string;

  @ApiProperty({ example: 'Santoso', description: 'Nama belakang admin' })
  @IsString()
  @IsOptional()
  nama_belakang: string;

  @ApiProperty({ example: 'admin@example.com', description: 'Email admin' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password admin minimal 6 karakter',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'password123',
    description: 'Konfirmasi password admin',
  })
  @IsString()
  confirmPassword: string;

  @ApiProperty({
    enum: PeranAdminEnum,
    example: PeranAdminEnum.ADMIN,
    description: 'Peran admin',
  })
  @IsEnum(PeranAdminEnum)
  peran: PeranAdminEnum;

  @ApiProperty({
    example: '123',
    description: 'ID stasiun (hanya untuk Admin, bukan Superadmin)',
    required: false,
  })
  @IsOptional()
  @IsString()
  id_stasiun?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Foto admin (opsional)',
  })
  @IsOptional()
  foto?: any;
}
