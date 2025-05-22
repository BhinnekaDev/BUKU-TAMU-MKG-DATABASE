import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({
    example: 'Budi',
    description: 'Nama depan admin',
  })
  @IsOptional()
  @IsString()
  nama_depan_admin?: string;

  @ApiPropertyOptional({
    example: 'Santoso',
    description: 'Nama belakang admin',
  })
  @IsOptional()
  @IsString()
  nama_belakang_admin?: string;

  @ApiPropertyOptional({
    example: 'NewStrongPassword123',
    description: 'Password baru (min 8 karakter)',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Foto admin dalam format JPG, JPEG, atau PNG',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Foto harus berupa string yang merepresentasikan file' })
  @Type(() => Object)
  foto_admin?: Express.Multer.File;
}
