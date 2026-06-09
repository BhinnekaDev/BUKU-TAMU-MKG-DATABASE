import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordAdminDto {
  @ApiProperty({ example: 'superadmin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'newSecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
