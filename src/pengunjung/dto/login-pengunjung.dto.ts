import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginPengunjungDto {
  @ApiProperty({ example: 'pengunjung@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Rahasia123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
