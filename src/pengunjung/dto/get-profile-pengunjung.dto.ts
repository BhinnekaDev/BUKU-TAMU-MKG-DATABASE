import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetProfilePengunjungDto {
  @ApiProperty({ description: 'Access token dari Supabase' })
  @IsNotEmpty()
  @IsString()
  access_token: string;

  @ApiProperty({ description: 'ID Pengunjung' })
  @IsNotEmpty()
  @IsString()
  id_pengunjung: string;
}
