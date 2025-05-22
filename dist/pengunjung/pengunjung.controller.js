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
exports.PengunjungController = void 0;
const multer_config_1 = require("../multer.config");
const isi_buku_tamu_dto_1 = require("./dto/isi-buku-tamu.dto");
const login_pengunjung_dto_1 = require("./dto/login-pengunjung.dto");
const register_pengunjung_dto_1 = require("./dto/register-pengunjung.dto");
const pengunjung_service_1 = require("./pengunjung.service");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const update_pengunjung_dto_1 = require("./dto/update-pengunjung.dto");
let PengunjungController = class PengunjungController {
    pengunjungService;
    constructor(pengunjungService) {
        this.pengunjungService = pengunjungService;
    }
    async register(file, body, ip, userAgent) {
        if (typeof body.alamat === 'string') {
            try {
                body.alamat = JSON.parse(body.alamat);
            }
            catch (e) {
                throw new common_1.BadRequestException('Format alamat tidak valid');
            }
        }
        const dto = (0, class_transformer_1.plainToInstance)(register_pengunjung_dto_1.RegisterPengunjungDto, body);
        return this.pengunjungService.register(dto, ip, userAgent, file);
    }
    async login(dto, ip, userAgent) {
        return this.pengunjungService.login(dto, ip, userAgent);
    }
    async logout(token, ip, userAgent) {
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return this.pengunjungService.logout(token, ip, userAgent);
    }
    getProfile(authHeader) {
        return this.pengunjungService.getProfile(authHeader);
    }
    async updateProfile(dto, authHeader, ip, userAgent, file, req) {
        if (typeof dto.alamat === 'string') {
            try {
                dto.alamat = JSON.parse(dto.alamat);
            }
            catch (e) {
                throw new common_1.BadRequestException('Format alamat tidak valid');
            }
        }
        if (dto.foto_pengunjung) {
            try {
                dto.foto_pengunjung = JSON.parse(dto.foto_pengunjung);
            }
            catch (e) {
                throw new common_1.BadRequestException('Format foto tidak valid');
            }
        }
        return this.pengunjungService.updateProfile(authHeader, dto, ip, userAgent, file);
    }
    async resetPassword(dto, ip, userAgent) {
        return this.pengunjungService.resetPasswordPengunjung(dto, ip, userAgent);
    }
    async isiBukuTamu(file, dto, ip, userAgent, token) {
        return this.pengunjungService.isiBukuTamu(dto, file, ip, userAgent, token);
    }
    extractToken(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        return authHeader.replace('Bearer ', '');
    }
};
exports.PengunjungController = PengunjungController;
__decorate([
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Post)('register'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto_pengunjung', multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_pengunjung_dto_1.LoginPengunjungDto, String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PengunjungController.prototype, "getProfile", null);
__decorate([
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Patch)('update-profile'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto_pengunjung', multer_config_1.multerConfig)),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __param(4, (0, common_1.UploadedFile)()),
    __param(5, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_pengunjung_dto_1.UpdatePengunjungDto, String, String, String, Object, Request]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "resetPassword", null);
__decorate([
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Post)('isi-buku-tamu'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('tanda_tangan', multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __param(4, (0, common_1.Headers)('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, isi_buku_tamu_dto_1.IsiBukuTamuDto, String, String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "isiBukuTamu", null);
exports.PengunjungController = PengunjungController = __decorate([
    (0, common_1.Controller)('pengunjung'),
    __metadata("design:paramtypes", [pengunjung_service_1.PengunjungService])
], PengunjungController);
//# sourceMappingURL=pengunjung.controller.js.map