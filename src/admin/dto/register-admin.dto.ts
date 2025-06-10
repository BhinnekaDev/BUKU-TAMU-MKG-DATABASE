import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum PeranAdmin {
  ADMIN = 'Admin',
  SUPERADMIN = 'Superadmin',
}

export class RegisterAdminDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email admin yang valid',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'Password akun admin (min 8 karakter)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'Budi',
    description: 'Nama depan admin',
  })
  @IsString()
  @IsNotEmpty()
  nama_depan_admin: string;

  @ApiProperty({
    example: 'Santoso',
    description: 'Nama belakang admin',
  })
  @IsString()
  @IsNotEmpty()
  nama_belakang_admin: string;

  @ApiProperty({
    enum: PeranAdmin,
    example: PeranAdmin.ADMIN,
    description: 'Peran admin: Admin atau Superadmin',
  })
  @IsEnum(PeranAdmin)
  peran: PeranAdmin;

  @ApiPropertyOptional({
    example: 'a19bf289-2faf-4739-a122-b4d1b783c408',
    description: 'ID stasiun (hanya untuk Admin, Superadmin tidak boleh punya)',
  })
  @ValidateIf((o) => o.peran === PeranAdmin.ADMIN)
  @IsNotEmpty()
  @IsString()
  id_stasiun?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Foto admin dalam format JPG, JPEG, atau PNG',
  })
  @IsOptional()
  foto_admin?: Express.Multer.File;
}
