import { IsIn, IsNotEmpty, Matches } from 'class-validator';

export class ExportBukuTamuDto {
  @IsNotEmpty({ message: 'Bulan wajib diisi' })
  @Matches(/^(0[1-9]|1[0-2]|all)$/, {
    message: 'Bulan harus dalam format 01-12 atau "all"',
  })
  bulan: string;

  @IsNotEmpty({ message: 'Tahun wajib diisi' })
  @Matches(/^\d{4}$/, {
    message: 'Tahun harus 4 digit, misalnya 2025',
  })
  tahun: string;

  @IsIn(['pdf', 'excel'], { message: 'Format harus pdf atau excel' })
  format: string;
}
