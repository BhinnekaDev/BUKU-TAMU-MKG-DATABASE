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

  @ApiProperty({
    description: 'Waktu kunjungan dalam format "Hari, DD MMMM YYYY, HH.mm"',
    example: 'Senin, 10 Juni 2024, 14.30',
    required: false,
  })
  @IsString()
  waktu_kunjungan?: string;
}
