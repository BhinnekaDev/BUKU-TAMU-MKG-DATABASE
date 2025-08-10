import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordPengunjungDto {
  @ApiProperty({
    example: 'pengunjung@example.com',
    description: 'Email akun pengunjung',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'PasswordBaru123',
    description: 'Password baru minimal 8 karakter',
  })
  @IsString()
  @MinLength(8)
  new_password: string;
}
