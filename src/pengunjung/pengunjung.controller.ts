import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { SearchPengunjungDto } from '@/pengunjung/dto/search-pengunjung.dto';
import { PengunjungService } from '@/pengunjung/pengunjung.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

@Controller('pengunjung')
export class PengunjungController {
  constructor(private readonly pengunjungService: PengunjungService) {}

  @Get('asalpengunjung')
  getAll() {
    return this.pengunjungService.getAllAsalPengunjung();
  }

  // @Get('provinces/:id')
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of provinces',
  //   type: [WilayahResponseDto],
  // })
  // async getProvinceById(
  //   @Param('id') id: string,
  // ): Promise<WilayahResponseDto[]> {
  //   const result = await this.pengunjungService.getProvinceById(id);
  //   return Array.isArray(result) ? result : [result];
  // }

  // @Get('regencies/:id')
  // async getRegencyById(@Param('id') id: string): Promise<WilayahResponseDto[]> {
  //   const result = await this.pengunjungService.getRegencyById(id);
  //   return [result];
  // }

  // @Get('districts/:id')
  // async getDistrictById(
  //   @Param('id') id: string,
  // ): Promise<WilayahResponseDto[]> {
  //   const result = await this.pengunjungService.getDistrictById(id);
  //   return [result];
  // }

  // @Get('villages/:id')
  // async getVillageById(@Param('id') id: string): Promise<WilayahResponseDto[]> {
  //   const result = await this.pengunjungService.getVillageById(id);
  //   return [result];
  // }

  @Get()
  async getAllStasiun() {
    return this.pengunjungService.getAllStasiun();
  }

  @Get('jumlah')
  @ApiQuery({ name: 'id_stasiun', required: true, type: String })
  async getJumlahPengunjung(@Query('id_stasiun') id_stasiun: string) {
    if (!id_stasiun) {
      throw new BadRequestException('Parameter id_stasiun wajib diisi.');
    }

    return this.pengunjungService.getJumlahPengunjung(id_stasiun);
  }

  @Post('search')
  @ApiBody({ type: SearchPengunjungDto })
  async searchPengunjung(@Body() dto: SearchPengunjungDto) {
    return this.pengunjungService.searchPengunjung(dto);
  }

  @Post('isi-buku-tamu')
  @UseInterceptors(FileInterceptor('tanda_tangan'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Isi data buku tamu dengan tanda tangan file',
    schema: {
      type: 'object',
      properties: {
        tujuan: { type: 'string', example: 'Mengikuti rapat koordinasi' },
        id_stasiun: {
          type: 'string',
          example: 'b0ae3f1d-901a-4530-a5fb-9c63c872d33e',
        },
        Nama_Depan_Pengunjung: { type: 'string', example: 'Ahmad' },
        Nama_Belakang_Pengunjung: { type: 'string', example: 'Hidayat' },
        Email_Pengunjung: {
          type: 'string',
          example: 'ahmad.hidayat@example.com',
        },
        No_Telepon_Pengunjung: { type: 'string', example: '081234567890' },
        Asal_Pengunjung: {
          type: 'string',
          enum: [
            'BMKG',
            'Universitas',
            'Pemerintah Pusat/Pemerintah Daerah',
            'Umum',
          ],
          example: 'BMKG',
        },
        Asal_Instansi: {
          type: 'string',
          example: 'Perwakilan dari Dishub Jawa Barat',
        },
        waktu_kunjungan: {
          type: 'string',
          example: 'Senin, 10 Juni 2024, 14.30',
          description: 'Waktu kunjungan dalam format yang mudah dibaca',
        },
        Alamat_Lengkap: { type: 'string', example: 'Alamat Jalan' },

        tanda_tangan: {
          type: 'string',
          format: 'binary',
          description: 'File tanda tangan (JPG, PNG, dsb)',
        },
      },
      required: [
        'tujuan',
        'id_stasiun',
        'Nama_Depan_Pengunjung',
        'Nama_Belakang_Pengunjung',
        'Email_Pengunjung',
        'No_Telepon_Pengunjung',
        'Asal_Pengunjung',
      ],
    },
  })
  async isiBukuTamu(
    @Body() dto: IsiBukuTamuDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const ip =
        req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.socket.remoteAddress ||
        null;
      const userAgent = req.headers['user-agent'] || null;

      return await this.pengunjungService.isiBukuTamu(dto, ip, userAgent, file);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Terjadi kesalahan saat menyimpan data buku tamu',
      );
    }
  }
}
