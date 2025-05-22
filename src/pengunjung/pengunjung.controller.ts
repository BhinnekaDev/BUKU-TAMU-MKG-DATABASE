import { multerConfig } from '@/multer.config';
import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { RegisterPengunjungDto } from '@/pengunjung/dto/register-pengunjung.dto';
import { PengunjungService } from '@/pengunjung/pengunjung.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UpdatePengunjungDto } from './dto/update-pengunjung.dto';

@Controller('pengunjung')
export class PengunjungController {
  constructor(private readonly pengunjungService: PengunjungService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'pengunjung@example.com' },
        password: { type: 'string', example: 'password123' },
        nama_depan_pengunjung: { type: 'string', example: 'John' },
        nama_belakang_pengunjung: { type: 'string', example: 'Doe' },
        no_telepon_pengunjung: { type: 'string', example: '08123456789' },
        asal_pengunjung: {
          type: 'string',
          enum: ['BMKG', 'PEMPROV', 'PEMKAB', 'PEMKOT', 'UNIVERSITAS', 'UMUM'],
          example: 'BMKG',
        },
        keterangan_asal_pengunjung: {
          type: 'string',
          example: 'Kunjungan dari BMKG',
        },
        foto_pengunjung: {
          type: 'string',
          format: 'binary',
        },
        alamat: {
          type: 'object',
          properties: {
            Provinsi: { type: 'string', example: 'Jawa Barat' },
            Kabupaten: { type: 'string', example: 'Bandung' },
            Kecamatan: { type: 'string', example: 'Cidadap' },
            Kelurahan: { type: 'string', example: 'Cidadap' },
            Kode_Pos: { type: 'string', example: '40141' },
            RT: { type: 'number', example: 1 },
            RW: { type: 'number', example: 2 },
            Alamat_Jalan: { type: 'string', example: 'Jl. Raya No. 1' },
          },
        },
      },
      required: [
        'email',
        'password',
        'nama_depan_pengunjung',
        'nama_belakang_pengunjung',
        'no_telepon_pengunjung',
        'asal_pengunjung',
        'foto_pengunjung',
      ],
    },
  })
  @Post('register')
  @UseInterceptors(FileInterceptor('foto_pengunjung', multerConfig))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    if (typeof body.alamat === 'string') {
      try {
        body.alamat = JSON.parse(body.alamat);
      } catch (e) {
        throw new BadRequestException('Format alamat tidak valid');
      }
    }

    const dto = plainToInstance(RegisterPengunjungDto, body);
    return this.pengunjungService.register(dto, ip, userAgent, file);
  }

  @Post('login')
  async login(
    @Body() dto: LoginPengunjungDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.pengunjungService.login(dto, ip, userAgent);
  }

  @Post('logout')
  async logout(
    @Headers('authorization') token: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return this.pengunjungService.logout(token, ip, userAgent);
  }

  @Get('profile')
  getProfile(@Headers('authorization') authHeader: string) {
    return this.pengunjungService.getProfile(authHeader);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string', example: 'newpassword123' },
        nama_depan_pengunjung: { type: 'string', example: 'Jane' },
        nama_belakang_pengunjung: { type: 'string', example: 'Doe' },
        no_telepon_pengunjung: { type: 'string', example: '08123456789' },
        asal_pengunjung: {
          type: 'string',
          enum: ['BMKG', 'PEMPROV', 'PEMKAB', 'PEMKOT', 'UNIVERSITAS', 'UMUM'],
          example: 'BMKG',
        },
        keterangan_asal_pengunjung: {
          type: 'string',
          example: 'Kunjungan dari BMKG',
        },
        foto_pengunjung: {
          type: 'string',
          format: 'binary',
        },
        alamat: {
          type: 'object',
          properties: {
            Provinsi: { type: 'string', example: 'Jawa Barat' },
            Kabupaten: { type: 'string', example: 'Bandung' },
            Kecamatan: { type: 'string', example: 'Cidadap' },
            Kelurahan: { type: 'string', example: 'Cidadap' },
            Kode_Pos: { type: 'string', example: '40141' },
            RT: { type: 'number', example: 1 },
            RW: { type: 'number', example: 2 },
            Alamat_Jalan: { type: 'string', example: 'Jl. Raya No. 1' },
          },
        },
      },
    },
  })
  @Patch('update-profile')
  @UseInterceptors(FileInterceptor('foto_pengunjung', multerConfig))
  async updateProfile(
    @Body() dto: UpdatePengunjungDto,
    @Headers('authorization') authHeader: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (typeof dto.alamat === 'string') {
      try {
        dto.alamat = JSON.parse(dto.alamat);
      } catch (e) {
        throw new BadRequestException('Format alamat tidak valid');
      }
    }
    if (dto.foto_pengunjung) {
      try {
        dto.foto_pengunjung = JSON.parse(dto.foto_pengunjung);
      } catch (e) {
        throw new BadRequestException('Format foto tidak valid');
      }
    }
    return this.pengunjungService.updateProfile(
      authHeader,
      dto,
      ip,
      userAgent,
      file,
    );
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: { email: string; new_password: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.pengunjungService.resetPasswordPengunjung(dto, ip, userAgent);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tujuan: { type: 'string', example: 'Mengikuti rapat koordinasi' },
        id_stasiun: {
          type: 'string',
          example: 'b0ae3f1d-901a-4530-a5fb-9c63c872d33e',
        },
        tanda_tangan: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('isi-buku-tamu')
  @UseInterceptors(FileInterceptor('tanda_tangan', multerConfig))
  async isiBukuTamu(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: IsiBukuTamuDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('Authorization') token: string,
  ) {
    return this.pengunjungService.isiBukuTamu(dto, file, ip, userAgent, token);
  }

  private extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return authHeader.replace('Bearer ', '');
  }
}
