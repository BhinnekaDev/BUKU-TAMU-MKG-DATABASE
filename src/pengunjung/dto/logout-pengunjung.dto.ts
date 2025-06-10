import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutPengunjungDto {
  @ApiProperty({
    description: 'ID dari pengunjung yang ingin logout',
    example: 'd41d8cd9-8f00-3204-a980-0998ecf8427e',
  })
  @IsString()
  @IsNotEmpty()
  id_pengunjung: string;

  @ApiProperty({
    description: 'Token akses yang diberikan saat login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}
