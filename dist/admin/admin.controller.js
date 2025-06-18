"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const login_admin_dto_1 = require("./dto/login-admin.dto");
const logout_admin_dto_1 = require("./dto/logout-admin.dto");
const register_admin_dto_1 = require("./dto/register-admin.dto");
const reset_password_admin_dto_1 = require("./dto/reset-password-admin.dto");
const update_admin_dto_1 = require("./dto/update-admin.dto");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async register(dto, req, foto_admin) {
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] ?? null;
        return this.adminService.register(dto, ip, userAgent, foto_admin);
    }
    async login(dto, req) {
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] || null;
        return this.adminService.login(dto, ip, userAgent);
    }
    async logout(dto, ip, req) {
        const userAgent = req.headers['user-agent'] || null;
        console.log('Logout Admin DTO:', dto);
        console.log('IP Address:', ip);
        console.log('User Agent:', userAgent);
        return this.adminService.logout(dto, ip, userAgent);
    }
    async getProfile(access_token, user_id) {
        return this.adminService.getProfile(user_id, access_token);
    }
    async updateProfile(dto, req, foto, access_token, user_id) {
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] ?? undefined;
        return this.adminService.updateProfile({
            ...dto,
            access_token,
            user_id,
            ip: ip ?? undefined,
            user_agent: userAgent,
        }, foto);
    }
    async resetPassword(dto, req) {
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] || null;
        return this.adminService.resetPassword(dto, ip, userAgent);
    }
    async getBukuTamu(req) {
        const access_token = req.headers['access_token']?.toString();
        const user_id = req.headers['user_id']?.toString();
        if (!access_token || !user_id) {
            throw new common_1.BadRequestException('Header access_token dan user_id wajib diisi');
        }
        return this.adminService.getBukuTamu(access_token, user_id);
    }
    async getHariIni(authorization, user_id) {
        const access_token = authorization?.replace('Bearer ', '');
        return this.adminService.getBukuTamuHariIni(access_token, user_id);
    }
    async getMingguIni(authorization, user_id) {
        const access_token = authorization?.replace('Bearer ', '');
        return this.adminService.getBukuTamuMingguIni(access_token, user_id);
    }
    async getBulanIni(authorization, user_id) {
        const access_token = authorization?.replace('Bearer ', '');
        return this.adminService.getBukuTamuBulanIni(access_token, user_id);
    }
    async getByPeriod(period, authorization, user_id) {
        const access_token = authorization?.replace('Bearer ', '');
        return this.adminService.getBukuTamuByPeriod(access_token, user_id, period);
    }
    async getDashboard(req) {
        const access_token = req.headers['access_token']?.toString();
        const user_id = req.headers['user_id']?.toString();
        if (!user_id || !access_token) {
            throw new common_1.UnauthorizedException('user_id atau access_token tidak ditemukan');
        }
        return this.adminService.getDashboard(user_id, access_token);
    }
    async getDaftarKunjungan(req, search, startDate, endDate) {
        const access_token = req.headers['access_token']?.toString();
        const user_id = req.headers['user_id']?.toString();
        if (!user_id || !access_token) {
            throw new common_1.UnauthorizedException('user_id atau access_token tidak ditemukan');
        }
        return this.adminService.getDaftarKunjungan(user_id, access_token, search, startDate, endDate);
    }
    async getStatistik(req) {
        const access_token = req.headers['access_token']?.toString();
        const user_id = req.headers['user_id']?.toString();
        if (!user_id || !access_token) {
            throw new common_1.UnauthorizedException('user_id atau access_token tidak ditemukan');
        }
        return this.adminService.getStatistikKunjungan(user_id, access_token);
    }
    extractToken(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return authHeader.replace('Bearer ', '');
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Post)('register'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto_admin')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_admin_dto_1.RegisterAdminDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_admin_dto_1.LoginAdminDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logout_admin_dto_1.LogoutAdminDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Headers)('access_token')),
    __param(1, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfile", null);
__decorate([
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ type: update_admin_dto_1.UpdateAdminProfileDto }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Put)('update-profile'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Headers)('access_token')),
    __param(4, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_admin_dto_1.UpdateAdminProfileDto, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_admin_dto_1.ResetPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('buku-tamu'),
    (0, swagger_1.ApiHeader)({ name: 'user_id', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'access_token', required: true }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBukuTamu", null);
__decorate([
    (0, common_1.Get)('hari-ini'),
    __param(0, (0, common_1.Headers)('access_token')),
    __param(1, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getHariIni", null);
__decorate([
    (0, common_1.Get)('minggu-ini'),
    __param(0, (0, common_1.Headers)('access_token')),
    __param(1, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMingguIni", null);
__decorate([
    (0, common_1.Get)('bulan-ini'),
    __param(0, (0, common_1.Headers)('access_token')),
    __param(1, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBulanIni", null);
__decorate([
    (0, common_1.Get)(':period'),
    __param(0, (0, common_1.Param)('period')),
    __param(1, (0, common_1.Headers)('access_token')),
    __param(2, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getByPeriod", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiHeader)({ name: 'user_id', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'access_token', required: true }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('daftar-kunjungan'),
    (0, swagger_1.ApiHeader)({ name: 'user_id', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'access_token', required: true }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDaftarKunjungan", null);
__decorate([
    (0, common_1.Get)('statistik'),
    (0, swagger_1.ApiHeader)({ name: 'user_id', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'access_token', required: true }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStatistik", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map