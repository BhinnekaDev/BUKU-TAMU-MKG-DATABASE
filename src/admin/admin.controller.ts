import {
  BadRequestException,
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Headers,
  Injectable,
  Param,
  Post,
  Put,
  Query,
  Request,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiQuery,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import { AdminService } from '@/admin/admin.service';
import { LoginAdminDto } from '@/admin/dto/login-admin.dto';
import { ResetPasswordAdminDto } from '@/admin/dto/reset-password-admin.dto';
import { UpdateProfileAdminDto } from '@/admin/dto/update-profile-admin.dto';

import { SupabaseUser } from '@/interfaces/supabase-user.interface';
import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kedaluwarsa',
      );
    }

    request.user = data.user;
    return true;
  }
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_depan: {
          type: 'string',
          example: 'Budi',
          description: 'Nama depan admin (wajib)',
        },
        nama_belakang: {
          type: 'string',
          example: 'Santoso',
          description: 'Nama belakang admin (opsional)',
        },
        email: {
          type: 'string',
          example: 'admin@example.com',
          description: 'Email admin (wajib)',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: 'Password minimal 6 karakter (wajib)',
        },
        confirmPassword: {
          type: 'string',
          example: 'password123',
          description: 'Konfirmasi password harus sama (wajib)',
        },
        peran: {
          type: 'string',
          enum: ['Admin', 'Superadmin'],
          example: 'Admin',
          description: 'Peran pengguna (Admin / Superadmin)',
        },
        id_stasiun: {
          type: 'string',
          example: 'ST123',
          description: 'ID Stasiun (wajib jika peran = Admin)',
        },
        foto: {
          type: 'string',
          format: 'binary',
          description:
            'Foto admin opsional (default Logo_BMKG.png jika tidak diunggah)',
        },
      },
      required: ['nama_depan', 'email', 'password', 'confirmPassword', 'peran'],
    },
  })
  @UseInterceptors(FileInterceptor('foto'))
  @Post('register')
  async registerAdmin(
    @Body() body: any,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    return this.adminService.registerAdmin(body, foto);
  }

  @Post('login')
  async loginAdmin(@Body() dto: LoginAdminDto) {
    return this.adminService.loginAdmin(dto);
  }

  @Post('reset-password')
  async resetPasswordAdmin(@Body() dto: ResetPasswordAdminDto) {
    return this.adminService.resetPasswordAdmin(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @ApiHeader({ name: 'user_id', required: true })
  @Get('profile')
  async getProfile(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
  ) {
    const user = req.user;
    return this.adminService.getProfile(user_id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiHeader({ name: 'user_id', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_depan: { type: 'string', example: 'Rizal' },
        nama_belakang: { type: 'string', example: 'Ramadhan' },
        password: { type: 'string', example: 'newpassword123' },
        confirmPassword: {
          type: 'string',
          example: 'newpassword123',
        },
        foto: {
          type: 'string',
          format: 'binary',
          example: 'foto_admin.png',
        },
      },
    },
  })
  @Put('update-profile')
  @UseInterceptors(FileInterceptor('foto'))
  async updateProfile(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
    @Body() dto: UpdateProfileAdminDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    const user = req.user;
    return this.adminService.updateProfile(user, user_id, dto, foto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @Get('buku-tamu')
  @ApiHeader({ name: 'user_id', required: true })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month'],
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'filterStasiunId', required: false })
  async getBukuTamu(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
    @Query('period') period?: 'today' | 'week' | 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('filterStasiunId') filterStasiunId?: string,
  ) {
    const user = req.user;
    return this.adminService.getBukuTamu(
      user,
      user_id,
      period,
      startDate,
      endDate,
      filterStasiunId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @Get('buku-tamu/hari-ini')
  @ApiHeader({
    name: 'user_id',
    description: 'ID user',
    required: true,
  })
  async getBukuTamuHariIni(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
  ) {
    const user = req.user;
    return this.adminService.getBukuTamuHariIni(user, user_id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @Get('buku-tamu/minggu-ini')
  @ApiHeader({
    name: 'user_id',
    description: 'ID user',
    required: true,
  })
  async getBukuTamuMingguIni(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
  ) {
    const user = req.user;
    return this.adminService.getBukuTamuMingguIni(user, user_id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @Get('buku-tamu/bulan-ini')
  @ApiHeader({
    name: 'user_id',
    description: 'ID user',
    required: true,
  })
  async getBukuTamuBulanIni(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
  ) {
    const user = req.user;
    return this.adminService.getBukuTamuBulanIni(user, user_id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @Delete('buku-tamu/:id')
  @ApiParam({
    name: 'id',
    description: 'ID Buku Tamu',
  })
  @ApiHeader({
    name: 'user_id',
    description: 'ID user',
    required: true,
  })
  async deleteBukuTamu(
    @Param('id') id: string,
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
  ) {
    const user = req.user;

    return this.adminService.deleteBukuTamu(user, user_id, id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @Get('all-admins')
  @ApiHeader({
    name: 'user_id',
    description: 'ID user',
    required: true,
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'filterPeran', required: false })
  @ApiQuery({ name: 'filterStasiunId', required: false })
  async getAllAdmins(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
    @Query('search') search?: string,
    @Query('filterPeran') filterPeran?: string,
    @Query('filterStasiunId') filterStasiunId?: string,
  ) {
    const user = req.user;
    return this.adminService.getAllAdmins(
      user,
      user_id,
      search,
      filterPeran,
      filterStasiunId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_depan: {
          type: 'string',
          example: 'Budi',
          description: 'Nama depan admin (wajib)',
        },
        nama_belakang: {
          type: 'string',
          example: 'Santoso',
          description: 'Nama belakang admin (opsional)',
        },
        email: {
          type: 'string',
          example: 'admin@example.com',
          description: 'Email admin (wajib)',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: 'Password minimal 6 karakter (wajib)',
        },
        confirmPassword: {
          type: 'string',
          example: 'password123',
          description: 'Konfirmasi password harus sama (wajib)',
        },
        peran: {
          type: 'string',
          enum: ['Admin', 'Superadmin'],
          example: 'Admin',
          description: 'Peran pengguna (Admin / Superadmin)',
        },
        id_stasiun: {
          type: 'string',
          example: 'ST123',
          description: 'ID Stasiun (wajib jika peran = Admin)',
        },
        foto: {
          type: 'string',
          format: 'binary',
          description:
            'Foto admin opsional (default Logo_BMKG.png jika tidak diunggah)',
        },
      },
      required: ['nama_depan', 'email', 'password', 'confirmPassword', 'peran'],
    },
  })
  @UseInterceptors(FileInterceptor('foto'))
  @Post('create-admin')
  async createAdmin(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
    @Body() body: any,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    const user = req.user;

    if (!user) {
      throw new BadRequestException('User tidak ditemukan dalam request');
    }

    return this.adminService.createAdmin(body, foto, user, user_id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileAdminDto })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_depan: { type: 'string' },
        nama_belakang: { type: 'string' },
        password: { type: 'string' },
        confirmPassword: { type: 'string' },
        foto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('foto'))
  @Put('update-admin')
  @ApiHeader({
    name: 'id_admin',
    description:
      'ID Admin yang akan diperbarui (hanya Superadmin yang bisa ubah admin lain)',
    required: true,
    example: '788cb8a1-e20b-4dfb-990c-90dbbca67a96',
  })
  @ApiHeader({
    name: 'user_id',
    description: 'ID superadmin',
    required: true,
    example: '69fe727f-17e3-4065-a16e-23efb26382cf',
  })
  async updateAdmin(
    @Request() req: { user: SupabaseUser },
    @Body() dto: UpdateProfileAdminDto,
    @UploadedFile() foto: Express.Multer.File,
    @Headers('id_admin') id_admin: string,
    @Headers('user_id') user_id: string,
  ) {
    const user = req.user;
    return this.adminService.updateAdmin(
      user,
      id_admin,
      {
        ...dto,
        foto,
      },
      user_id,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(SupabaseAuthGuard)
  @Delete('delete-admin/:id_admin')
  @ApiHeader({
    name: 'user_id',
    description: 'ID user',
    required: true,
  })
  async deleteAdmin(
    @Request() req: { user: SupabaseUser },
    @Headers('user_id') user_id: string,
    @Param('id_admin') id_admin: string,
  ) {
    const user = req.user;
    return this.adminService.deleteAdmin(user, user_id, id_admin);
  }
}
