import { multerConfig } from '@/multer.config';
import { IsiBukuTamuDto } from '@/pengunjung/dto/isi-buku-tamu.dto';
import { LoginPengunjungDto } from '@/pengunjung/dto/login-pengunjung.dto';
import { LogoutPengunjungDto } from '@/pengunjung/dto/logout-pengunjung.dto';
import { RegisterPengunjungDto } from '@/pengunjung/dto/register-pengunjung.dto';
import { ResetPasswordPengunjungDto } from '@/pengunjung/dto/reset-password-pengunjung.dto';
import { UpdatePengunjungDto } from '@/pengunjung/dto/update-pengunjung.dto';
import { WilayahResponseDto } from '@/pengunjung/dto/wilayah-response.dto';
import { PengunjungService } from '@/pengunjung/pengunjung.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';

@Controller('pengunjung')
export class PengunjungController {
  constructor(private readonly pengunjungService: PengunjungService) {}

  @Get()
  getAll() {
    return this.pengunjungService.getAllAsalPengunjung();
  }

  @Get('provinces/:id')
  @ApiResponse({
    status: 200,
    description: 'List of provinces',
    type: [WilayahResponseDto],
  })
  async getProvinceById(
    @Param('id') id: string,
  ): Promise<WilayahResponseDto[]> {
    const result = await this.pengunjungService.getProvinceById(id);
    return Array.isArray(result) ? result : [result];
  }

  @Get('regencies/:id')
  async getRegencyById(@Param('id') id: string): Promise<WilayahResponseDto[]> {
    const result = await this.pengunjungService.getRegencyById(id);
    return [result];
  }

  @Get('districts/:id')
  async getDistrictById(
    @Param('id') id: string,
  ): Promise<WilayahResponseDto[]> {
    const result = await this.pengunjungService.getDistrictById(id);
    return [result];
  }

  @Get('villages/:id')
  async getVillageById(@Param('id') id: string): Promise<WilayahResponseDto[]> {
    const result = await this.pengunjungService.getVillageById(id);
    return [result];
  }

  @Post('register')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Data registrasi pengunjung',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'pengunjung@example.com',
          description: 'Harus berupa email valid',
        },
        password: {
          type: 'string',
          example: 'Password123!',
          description: 'Minimal 8 karakter, mengandung huruf besar dan angka',
        },
        nama_depan_pengunjung: {
          type: 'string',
          example: 'John',
        },
        nama_belakang_pengunjung: {
          type: 'string',
          example: 'Doe',
        },
        no_telepon_pengunjung: {
          type: 'string',
          example: '08123456789',
          description: 'Format nomor Indonesia',
        },
        asal_pengunjung: {
          type: 'string',
          enum: ['BMKG', 'Dinas', 'Universitas', 'Media', 'Lembaga Non Pemerintahan', 'Umum'],
          example: 'BMKG',
        },
        keterangan_asal_pengunjung: {
          type: 'string',
          example: 'Kunjungan kerja dari BMKG Pusat',
        },
        foto_pengunjung: {
          type: 'string',
          format: 'binary',
          description: 'File gambar (JPEG/PNG) max 2MB',
        },
        alamat: {
          type: 'string',
          example: JSON.stringify({
            province_id: '32',
            regency_id: '3273',
            district_id: '3273010',
            village_id: '3273010001',
          }),
          description: 'Stringified JSON object sesuai AlamatDto',
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
  @ApiResponse({
    status: 201,
    description: 'Registrasi berhasil',
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid/gambar corrupt',
  })
  @UseInterceptors(FileInterceptor('foto_pengunjung', multerConfig))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    // Parse alamat jika ada
    if (body.alamat) {
      try {
        body.alamat =
          typeof body.alamat === 'string'
            ? JSON.parse(body.alamat)
            : body.alamat;
      } catch (e) {
        throw new BadRequestException({
          message: 'Format alamat tidak valid',
          error: 'Harus berupa JSON string yang sesuai dengan AlamatDto',
        });
      }
    }
    const userAgent = req.headers['user-agent'] || null;

    const dto = plainToInstance(RegisterPengunjungDto, {
      ...body,
      foto_pengunjung: file?.filename,
    });

    return this.pengunjungService.register(dto, ip, userAgent, file);
  }

  @Get()
  async getAllStasiun() {
    return this.pengunjungService.getAllStasiun();
  }

  @Post('login')
  async login(
    @Body() dto: LoginPengunjungDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || null;
    return this.pengunjungService.login(dto, ip, userAgent);
  }

  @Get('jumlah')
  async getJumlahPengunjung(
    @Headers('access_token') authorization: string,
    @Headers('user_id') user_id: string,
  ) {
    try {
      const access_token = authorization?.replace('Bearer ', '');
      if (!access_token) {
        throw new Error('Token akses tidak ditemukan');
      }
      return await this.pengunjungService.getJumlahPengunjung(access_token, user_id);
    } catch (error) {
      throw error;
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Body() dto: LogoutPengunjungDto) {
    const userAgent = req.headers['user-agent'] || null;
    const ip =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

    return this.pengunjungService.logout(
      dto,
      ip as string,
      userAgent as string,
    );
  }

  @Get('profile')
  @ApiResponse({
    status: 200,
    description: 'Visitor profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token or user mismatch',
  })
  @ApiResponse({
    status: 404,
    description: 'Visitor data not found',
  })
  async getProfile(
    @Headers('access_token') access_token: string,
    @Headers('user_id') user_id: string,
  ) {
    return this.pengunjungService.getProfile(user_id, access_token);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          example: 'NewPassword123!',
          description: 'Minimal 8 karakter, mengandung huruf besar dan angka',
        },
        nama_depan_pengunjung: {
          type: 'string',
          example: 'Jane',
        },
        nama_belakang_pengunjung: {
          type: 'string',
          example: 'Doe',
        },
        no_telepon_pengunjung: {
          type: 'string',
          example: '08123456789',
        },
        asal_pengunjung: {
          type: 'string',
          enum: ['BMKG', 'Dinas', 'Universitas', 'Media', 'Lembaga Non Pemerintahan', 'Umum'],
          example: 'BMKG',
        },
        keterangan_asal_pengunjung: {
          type: 'string',
          example: 'Kunjungan dari BMKG Pusat',
        },
        foto_pengunjung: {
          type: 'string',
          format: 'binary',
          description: 'File gambar (JPEG/PNG) maksimal 2MB',
        },
        alamat: {
          type: 'object',
          description: 'Gunakan ID wilayah dari API',
          properties: {
            province_id: {
              type: 'string',
              example: '32',
            },
            regency_id: {
              type: 'string',
              example: '3273',
            },
            district_id: {
              type: 'string',
              example: '3273010',
            },
            village_id: {
              type: 'string',
              example: '3273010001',
            },
          },
        },
      },
    },
  })
  @Put('update')
  @UseInterceptors(FileInterceptor('Foto_Pengunjung'))
  async updateProfile(
    @Body() dto: UpdatePengunjungDto,
    @UploadedFile() foto: Express.Multer.File,
    @Ip() ip: string,
    @Req() req: Request,
    @Headers('access_token') authHeader: string,
    @Headers('user_id') idPengunjungHeader: string,
  ) {
    const access_token = authHeader?.replace('Bearer ', '');
    const id_pengunjung = idPengunjungHeader;

    // Gabungkan token dan id ke dto sebelum diproses service
    const fullDto = { ...dto, access_token, id_pengunjung };
    const userAgent = req.headers['user-agent'] || null;

    return this.pengunjungService.updateProfile(fullDto, ip, userAgent, foto);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordPengunjungDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || null;
    return this.pengunjungService.resetPasswordPengunjung(dto, ip, userAgent);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tujuan: {
          type: 'string',
          example: 'Mengikuti rapat koordinasi',
          description: 'Tujuan kunjungan',
        },
        id_stasiun: {
          type: 'string',
          example: 'b0ae3f1d-901a-4530-a5fb-9c63c872d33e',
          description: 'ID Stasiun yang dikunjungi',
        },
        waktu_kunjungan: {
          type: 'string',
          example: 'Senin, 10 Juni 2024, 14.30',
          description: 'Waktu kunjungan',
        },
        tanda_tangan: {
          type: 'string',
          format: 'binary',
          description: 'File tanda tangan',
        },
      },
      required: ['tujuan', 'id_stasiun', 'waktu_kunjungan'],
    },
  })
  @Post('isi-buku-tamu')
  @UseInterceptors(FileInterceptor('tanda_tangan'))
  async isiBukuTamu(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: IsiBukuTamuDto,
    @Headers('access_token') accessTokenHeader: string,
    @Headers('user_id') userIdHeader: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    // Debugging headers
    console.log('Access Token Header:', accessTokenHeader);
    console.log('User ID Header:', userIdHeader);

    // Trim and validate headers
    const access_token = accessTokenHeader?.trim();
    const user_id = userIdHeader?.trim();

    if (!access_token) {
      throw new UnauthorizedException({
        message: 'access_token header harus disertakan',
        example: 'access_token: your_jwt_token_here',
      });
    }

    if (!user_id) {
      throw new UnauthorizedException({
        message: 'user_id header harus disertakan',
        example: 'user_id: 1fc56aad-13cc-4e5a-ba8c-1c9a0f4d4f56',
      });
    }

    // Get user agent
    const userAgent = req.headers['user-agent'] || null;

    // Call service with exact parameter names to match service method
    return this.pengunjungService.isiBukuTamu(
      dto,
      access_token,
      user_id,
      ip,
      userAgent,
      file,
    );
  }

  @Get('riwayat')
  @ApiResponse({
    status: 200,
    description: 'Visitor guest book history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token or user mismatch',
  })
  @ApiResponse({
    status: 404,
    description: 'No guest book entries found',
  })
  async getRiwayatBukuTamu(
    @Headers('access_token') access_token: string,
    @Headers('user_id') user_id: string,
  ) {
    return this.pengunjungService.getRiwayatBukuTamu(user_id, access_token);
  }
}
