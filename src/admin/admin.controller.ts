import { AdminService } from '@/admin/admin.service';
import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { LogoutAdminDto } from '@/admin/dto/logout-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UbahStatusBukuTamuDto } from '@/admin/dto/ubah-status-buku-tamu.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

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
  @ApiHeader({ name: 'user_id', required: true })
  @ApiHeader({ name: 'access_token', required: true })
  async getBukuTamu(@Req() req: Request): Promise<any> {
    const access_token = req.headers['access_token']?.toString();
    const user_id = req.headers['user_id']?.toString();

    if (!access_token || !user_id) {
      throw new BadRequestException(
        'Header access_token dan user_id wajib diisi',
      );
    }
    return this.adminService.getBukuTamu(access_token, user_id);
  }

  @Get('hari-ini')
  async getHariIni(
    @Headers('access_token') authorization: string,
    @Headers('user_id') user_id: string,
  ) {
    const access_token = authorization?.replace('Bearer ', '');
    return this.adminService.getBukuTamuHariIni(access_token, user_id);
  }

  @Get('minggu-ini')
  async getMingguIni(
    @Headers('access_token') authorization: string,
    @Headers('user_id') user_id: string,
  ) {
    const access_token = authorization?.replace('Bearer ', '');
    return this.adminService.getBukuTamuMingguIni(access_token, user_id);
  }

  @Get('bulan-ini')
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


  @Patch('buku-tamu/:id/status')
  @ApiHeader({ name: 'user_id', required: true })
  @ApiHeader({ name: 'access_token', required: true })
  async ubahStatusBukuTamu(
    @Param('id') idBukuTamu: string,
    @Body() dto: UbahStatusBukuTamuDto,
    @Req() req: Request,
  ) {
    const access_token = req.headers['access_token']?.toString();
    const user_id = req.headers['user_id']?.toString();

    if (!access_token || !user_id) {
      throw new BadRequestException(
        'Header access_token dan user_id wajib diisi',
      );
    }

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] ?? null;

    return this.adminService.ubahStatusBukuTamu(
      idBukuTamu,
      dto,
      access_token,
      user_id,
      ip,
      userAgent,
    );
  }

  @Delete('buku-tamu/:id')
  @ApiHeader({ name: 'user_id', required: true })
  @ApiHeader({ name: 'access_token', required: true })
  @ApiParam({ name: 'id' })
  async deleteBukuTamu(@Param('id') id: string, @Req() req: Request) {
    const access_token = req.headers['access_token']?.toString();
    const user_id = req.headers['user_id']?.toString();
    if (!user_id || !access_token) {
      throw new UnauthorizedException(
        'user_id atau access_token tidak ditemukan',
      );
    }

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;

    const userAgent = req.headers['user-agent'] || null;

    return this.adminService.deleteBukuTamu(
      id,
      user_id,
      access_token,
      ip,
      userAgent,
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
  @ApiHeader({ name: 'user_id', required: true })
  @ApiHeader({ name: 'access_token', required: true })
  async getStatistik(@Req() req: Request) {
    const access_token = req.headers['access_token']?.toString();
    const user_id = req.headers['user_id']?.toString();
    if (!user_id || !access_token) {
      throw new UnauthorizedException(
        'user_id atau access_token tidak ditemukan',
      );
    }
    return this.adminService.getStatistikKunjungan(user_id, access_token);
  }

  private extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return authHeader.replace('Bearer ', '');
  }
}
