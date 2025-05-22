import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IsiBukuTamuDto {
  @ApiProperty({
    description: 'Tujuan kunjungan pengunjung',
    example: 'Mengikuti rapat koordinasi',
  })
  @IsNotEmpty()
  @IsString()
  tujuan: string;

  @ApiProperty({
    description: 'ID stasiun yang dikunjungi',
    example: 'b0ae3f1d-901a-4530-a5fb-9c63c872d33e',
  })
  @IsNotEmpty()
  @IsString()
  id_stasiun: string;
}
