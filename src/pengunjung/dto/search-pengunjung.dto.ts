import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SearchPengunjungDto {
  @ApiProperty({
    description: 'Nama depan atau belakang pengunjung yang ingin dicari',
    example: 'Andi',
  })
  @IsNotEmpty()
  keyword: string;
}
