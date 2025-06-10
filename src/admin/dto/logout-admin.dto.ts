import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutAdminDto {
  @ApiProperty({
    description: 'ID Admin yang ingin logout',
    example: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Access token yang digunakan saat login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  access_token: string;
}
