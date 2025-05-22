import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email akun admin yang ingin direset passwordnya',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'PasswordBaru123',
    description: 'Password baru yang akan digunakan (min 8 karakter)',
  })
  @IsString()
  @MinLength(8)
  new_password: string;
}
