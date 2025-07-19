import { AdminService } from '@/admin/admin.service';
import { ExportBukuTamuDto } from '@/admin/dto/export-buku-tamu.dto';
import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { LogoutAdminDto } from '@/admin/dto/logout-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
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
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { Response as ExpressResponse, Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        password: { type: 'string', example: 'password123' },
        nama_depan_admin: { type: 'string', example: 'John' },
        nama_belakang_admin: { type: 'string', example: 'Doe' },
        peran: { type: 'string', example: 'admin' },
        id_stasiun: {
          type: 'string',
          example: 'd3c667d9-c548-4b69-9818-f141f8c998b7',
        },
        foto_admin: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('register')
  @UseInterceptors(FileInterceptor('foto_admin'))
  async register(
    @Body() dto: RegisterAdminDto,
    @Req() req: Request,
    @UploadedFile() foto_admin: Express.Multer.File,
  ) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] ?? null;
    return this.adminService.register(dto, ip, userAgent, foto_admin);
  }

  @Post('login')
  async login(@Body() dto: LoginAdminDto, @Req() req: Request) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;

    const userAgent = req.headers['user-agent'] || null;

    return this.adminService.login(dto, ip, userAgent);
  }

  @Post('logout')
  async logout(
    @Body() dto: LogoutAdminDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || null;

    // DEBUG LOG
    console.log('Logout Admin DTO:', dto);
    console.log('IP Address:', ip);
    console.log('User Agent:', userAgent);

    return this.adminService.logout(dto, ip, userAgent);
  }

  @Get('profile')
  async getProfile(
    @Headers('access_token') access_token: string,
    @Headers('user_id') user_id: string,
  ) {
    return this.adminService.getProfile(user_id, access_token);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateAdminProfileDto })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_depan: { type: 'string' },
        nama_belakang: { type: 'string' },
        password: { type: 'string' },
        foto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Put('update-profile')
  @UseInterceptors(FileInterceptor('foto'))
  async updateProfile(
    @Body() dto: UpdateAdminProfileDto,
    @Req() req: Request,
    @UploadedFile() foto: Express.Multer.File,
    @Headers('access_token') access_token: string,
    @Headers('user_id') user_id: string,
  ) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] ?? undefined;

    return this.adminService.updateProfile(
      {
        ...dto,
        access_token,
        user_id,
        ip: ip ?? undefined,
        user_agent: userAgent,
      },
      foto,
    );
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] || null;
    return this.adminService.resetPassword(dto, ip, userAgent);
  }

  @Get('buku-tamu')
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month'],
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'filterStasiunId', required: false })
  async getBukuTamu(
    @Headers('access_token') access_token: string,
    @Headers('user_id') user_id: string,
    @Query('period') period?: 'today' | 'week' | 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('filterStasiunId') filterStasiunId?: string,
  ) {
    return this.adminService.getBukuTamu(
      access_token,
      user_id,
      period,
      startDate,
      endDate,
      filterStasiunId,
    );
  }

  @Get('buku-tamu/hari-ini')
  async getHariIni(
    @Headers('access_token') authorization: string,
    @Headers('user_id') user_id: string,
  ) {
    const access_token = authorization?.replace('Bearer ', '');
    return this.adminService.getBukuTamuHariIni(access_token, user_id);
  }

  @Get('buku-tamu/minggu-ini')
  async getMingguIni(
    @Headers('access_token') authorization: string,
    @Headers('user_id') user_id: string,
  ) {
    const access_token = authorization?.replace('Bearer ', '');
    return this.adminService.getBukuTamuMingguIni(access_token, user_id);
  }

  @Get('buku-tamu/bulan-ini')
  async getBulanIni(
    @Headers('access_token') authorization: string,
    @Headers('user_id') user_id: string,
  ) {
    const access_token = authorization?.replace('Bearer ', '');
    return this.adminService.getBukuTamuBulanIni(access_token, user_id);
  }

  @Get(':period')
  async getByPeriod(
    @Param('period') period: string,
    @Headers('access_token') authorization: string,
    @Headers('user_id') user_id: string,
  ) {
    const access_token = authorization?.replace('Bearer ', '');
    return this.adminService.getBukuTamuByPeriod(
      access_token,
      user_id,
      period as 'today' | 'week' | 'month',
    );
  }

  @Get('dashboard')
  @ApiHeader({ name: 'user_id', required: true })
  @ApiHeader({ name: 'access_token', required: true })
  async getDashboard(@Req() req: Request) {
    const access_token = req.headers['access_token']?.toString();
    const user_id = req.headers['user_id']?.toString();
    if (!user_id || !access_token) {
      throw new UnauthorizedException(
        'user_id atau access_token tidak ditemukan',
      );
    }

    return this.adminService.getDashboard(user_id, access_token);
  }

  @Get('daftar-kunjungan')
  @ApiHeader({ name: 'user_id', required: true })
  @ApiHeader({ name: 'access_token', required: true })
  async getDaftarKunjungan(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const access_token = req.headers['access_token']?.toString();
    const user_id = req.headers['user_id']?.toString();
    if (!user_id || !access_token) {
      throw new UnauthorizedException(
        'user_id atau access_token tidak ditemukan',
      );
    }
    return this.adminService.getDaftarKunjungan(
      user_id,
      access_token,
      search,
      startDate,
      endDate,
    );
  }

  @Get('statistik')
  async getStatistikKunjungan(
    @Headers('access_token') access_token: string,
    @Headers('user_id') user_id: string,
  ) {
    if (!access_token || !user_id) {
      throw new UnauthorizedException('Token dan user_id wajib dikirim');
    }

    return await this.adminService.getStatistikKunjungan(access_token, user_id);
  }

  @Get('statistik/frekuensi-tujuan')
  @ApiQuery({ name: 'access_token', required: true })
  @ApiQuery({ name: 'user_id', required: true })
  async getFrekuensiTujuan(
    @Query('access_token') access_token: string,
    @Query('user_id') user_id: string,
  ) {
    return this.adminService.getFrekuensiTujuanKunjungan(access_token, user_id);
  }

  @Get('statistik/asal-pengunjung')
  @ApiQuery({ name: 'access_token', required: true })
  @ApiQuery({ name: 'user_id', required: true })
  async getAsalPengunjung(
    @Query('access_token') access_token: string,
    @Query('user_id') user_id: string,
  ) {
    return this.adminService.getAsalPengunjungTerbanyak(access_token, user_id);
  }

  @Get('statistik/perbandingan-stasiun')
  @ApiQuery({ name: 'access_token', required: true })
  @ApiQuery({ name: 'user_id', required: true })
  async getPerbandinganStasiun(
    @Query('access_token') access_token: string,
    @Query('user_id') user_id: string,
  ) {
    return this.adminService.getPerbandinganStasiun(access_token, user_id);
  }

  private extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return authHeader.replace('Bearer ', '');
  }

  @Get('superadmin/insight-kebijakan')
  @ApiQuery({ name: 'access_token', required: true })
  @ApiQuery({ name: 'user_id', required: true })
  async getInsight(
    @Query('access_token') access_token: string,
    @Query('user_id') user_id: string,
  ) {
    return this.adminService.getInsightKebijakan(access_token, user_id);
  }

  @Get('superadmin/wordcloud-tujuan')
  @ApiQuery({ name: 'access_token', required: true })
  @ApiQuery({ name: 'user_id', required: true })
  async getWordCloud(
    @Query('access_token') access_token: string,
    @Query('user_id') user_id: string,
  ) {
    return this.adminService.getWordCloudTujuanKunjungan(access_token, user_id);
  }

  @Get('buku-tamu/export')
  @ApiHeader({ name: 'user_id', required: true })
  @ApiHeader({ name: 'access_token', required: true })
  @ApiQuery({ name: 'format', enum: ['pdf', 'excel'], required: true })
  @ApiQuery({ name: 'bulan', required: true })
  @ApiQuery({ name: 'tahun', required: true })
  async exportBukuTamu(
    @Headers('access_token') access_token: string,
    @Headers('user_id') user_id: string,
    @Query(new ValidationPipe({ transform: true }))
    query: ExportBukuTamuDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { bulan, tahun, format } = query;

    if (!access_token || !user_id) {
      throw new BadRequestException('access_token dan user_id wajib diisi');
    }

    const file = await this.adminService.exportBukuTamu(
      access_token,
      user_id,
      bulan,
      tahun,
      format,
    );

    const filename =
      bulan === 'all'
        ? `buku-tamu-${tahun}.${format}`
        : `buku-tamu-${bulan}-${tahun}.${format}`;

    res.set({
      'Content-Disposition': `attachment; filename=${filename}`,
      'Content-Type':
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    res.send(file);
  }
}
