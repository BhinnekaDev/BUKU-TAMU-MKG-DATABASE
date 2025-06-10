import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAdminProfileDto {
  @ApiProperty({
    description: 'Nama depan admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  nama_depan: string;

  @ApiProperty({
    description: 'Nama belakang admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  nama_belakang: string;

  @ApiProperty({
    description: 'Password baru admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Foto admin',
  })
  @IsOptional()
  foto: any;
}
