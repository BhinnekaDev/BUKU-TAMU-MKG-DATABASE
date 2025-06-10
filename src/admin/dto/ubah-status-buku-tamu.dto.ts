import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UbahStatusBukuTamuDto {
  @ApiProperty({
    description: 'Status baru untuk buku tamu',
    enum: ['menunggu persetujuan', 'disetujui', 'dibatalkan'],
    example: 'disetujui',
  })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  @IsEnum(['menunggu persetujuan', 'disetujui', 'dibatalkan'], {
    message:
      'Status harus berupa salah satu dari: menunggu persetujuan, disetujui, dibatalkan',
  })
  statusBaru: 'menunggu persetujuan' | 'disetujui' | 'dibatalkan';
}
