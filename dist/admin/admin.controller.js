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
    async logout(req) {
        const token = req.headers.authorization?.split(' ')[1];
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] || null;
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return this.adminService.logout(token, ip, userAgent);
    }
    async getProfile(authHeader) {
        const token = this.extractToken(authHeader);
        return this.adminService.getProfile(token);
    }
    async updateProfile(authHeader, dto, foto_admin, req) {
        const token = this.extractToken(authHeader);
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] || null;
        return this.adminService.updateProfile(token, dto, ip, userAgent, foto_admin);
    }
    async resetPassword(dto, req, userAgent) {
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        return this.adminService.resetPassword(dto, ip, userAgent);
    }
    async getBukuTamu(authHeader, req) {
        const token = this.extractToken(authHeader);
        return this.adminService.getBukuTamu(token);
    }
    async deleteBukuTamu(id, req) {
        const token = req.headers.authorization?.split(' ')[1];
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.socket.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] || null;
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return this.adminService.deleteBukuTamu(id, token, ip, userAgent);
    }
    async getDashboard(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return this.adminService.getDashboard(token);
    }
    async getKunjungan(req, search, startDate, endDate) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return this.adminService.getDaftarKunjungan(token, search, startDate, endDate);
    }
    async getStatistikKunjungan(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return this.adminService.getStatistikKunjungan(token);
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
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfile", null);
__decorate([
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Patch)('profile'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto_admin')),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_dto_1.UpdateAdminProfileDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_admin_dto_1.ResetPasswordDto, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('buku-tamu'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBukuTamu", null);
__decorate([
    (0, common_1.Delete)('buku-tamu/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteBukuTamu", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('kunjungan'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getKunjungan", null);
__decorate([
    (0, common_1.Get)('statistik'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStatistikKunjungan", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map