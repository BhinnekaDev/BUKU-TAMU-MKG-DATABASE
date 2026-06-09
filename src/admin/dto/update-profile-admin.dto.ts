import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileAdminDto {
  @ApiProperty({ example: 'Nama depan admin', required: false })
  @IsOptional()
  @IsString()
  nama_depan?: string;

  @ApiProperty({ example: 'Nama belakang admin', required: false })
  @IsOptional()
  @IsString()
  nama_belakang?: string;

  @ApiProperty({ example: 'Password baru admin', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'Konfirmasi password baru admin', required: false })
  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    example: 'foto (PNG/JPG)',
    required: false,
  })
  @IsOptional()
  foto?: any;
}
