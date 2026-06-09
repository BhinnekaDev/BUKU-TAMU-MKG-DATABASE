import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';

import { IsiBukuTamuDto } from '@/pengunjung/dto/create-buku-tamu.dto';
import { PengunjungService } from '@/pengunjung/pengunjung.service';

@ApiTags('Pengunjung')
@Controller('pengunjung')
export class PengunjungController {
  constructor(private readonly pengunjungService: PengunjungService) {}

  @Get()
  async getAllStasiun() {
    return this.pengunjungService.getAllStasiun();
  }

  @Get('jumlah')
  @ApiQuery({
    name: 'id_stasiun',
    required: true,
    description: 'ID stasiun untuk menghitung jumlah pengunjung',
    example: '5b2df30a-4204-470a-bfff-da645ed475d4',
  })
  async getJumlahPengunjung(@Query('id_stasiun') id_stasiun: string) {
    if (!id_stasiun) {
      throw new BadRequestException('Parameter id_stasiun harus disertakan');
    }
    return this.pengunjungService.getJumlahPengunjung(id_stasiun);
  }

  @Post('isi-buku-tamu')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Data pengunjung dan file tanda tangan',
    type: IsiBukuTamuDto,
  })
  @UseInterceptors(FileInterceptor('tanda_tangan'))
  async isiBukuTamu(
    @Body() dto: IsiBukuTamuDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File tanda tangan harus disertakan');
    }
    return this.pengunjungService.isiBukuTamu(dto, file);
  }
}
