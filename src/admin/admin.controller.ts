import { AdminService } from '@/admin/admin.service';
import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { RegisterAdminDto } from '@/admin/dto/register-admin.dto';
import { ResetPasswordDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateAdminProfileDto } from '@/admin/dto/update-admin.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;

    const userAgent = req.headers['user-agent'] || null;

    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    return this.adminService.logout(token, ip, userAgent);
  }

  @Get('profile')
  async getProfile(@Headers('authorization') authHeader: string) {
    const token = this.extractToken(authHeader);
    return this.adminService.getProfile(token);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_depan_admin: { type: 'string', example: 'John' },
        nama_belakang_admin: { type: 'string', example: 'Doe' },
        password: { type: 'string', example: 'newpassword123' },
        foto_admin: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Patch('profile')
  @UseInterceptors(FileInterceptor('foto_admin'))
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() dto: UpdateAdminProfileDto,
    @UploadedFile() foto_admin: Express.Multer.File,
    @Req() req: Request,
  ) {
    const token = this.extractToken(authHeader);
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] || null;
    return this.adminService.updateProfile(
      token,
      dto,
      ip,
      userAgent,
      foto_admin,
    );
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent: string,
  ) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    return this.adminService.resetPassword(dto, ip, userAgent);
  }

  @Get('buku-tamu')
  async getBukuTamu(
    @Headers('authorization') authHeader: string,
    @Req() req: Request,
  ) {
    const token = this.extractToken(authHeader);
    return this.adminService.getBukuTamu(token);
  }

  @Delete('buku-tamu/:id')
  async deleteBukuTamu(@Param('id') id: string, @Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] || null;

    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    return this.adminService.deleteBukuTamu(id, token, ip, userAgent);
  }

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return this.adminService.getDashboard(token);
  }

  @Get('kunjungan')
  async getKunjungan(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return this.adminService.getDaftarKunjungan(
      token,
      search,
      startDate,
      endDate,
    );
  }

  @Get('statistik')
  async getStatistikKunjungan(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return this.adminService.getStatistikKunjungan(token);
  }

  private extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }
    return authHeader.replace('Bearer ', '');
  }
}
