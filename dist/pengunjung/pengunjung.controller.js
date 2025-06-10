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
const logout_pengunjung_dto_1 = require("./dto/logout-pengunjung.dto");
const register_pengunjung_dto_1 = require("./dto/register-pengunjung.dto");
const reset_password_pengunjung_dto_1 = require("./dto/reset-password-pengunjung.dto");
const update_pengunjung_dto_1 = require("./dto/update-pengunjung.dto");
const wilayah_response_dto_1 = require("./dto/wilayah-response.dto");
const pengunjung_service_1 = require("./pengunjung.service");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
let PengunjungController = class PengunjungController {
    pengunjungService;
    constructor(pengunjungService) {
        this.pengunjungService = pengunjungService;
    }
    getAll() {
        return this.pengunjungService.getAllAsalPengunjung();
    }
    async getProvinceById(id) {
        const result = await this.pengunjungService.getProvinceById(id);
        return Array.isArray(result) ? result : [result];
    }
    async getRegencyById(id) {
        const result = await this.pengunjungService.getRegencyById(id);
        return [result];
    }
    async getDistrictById(id) {
        const result = await this.pengunjungService.getDistrictById(id);
        return [result];
    }
    async getVillageById(id) {
        const result = await this.pengunjungService.getVillageById(id);
        return [result];
    }
    async register(file, body, ip, req) {
        if (body.alamat) {
            try {
                body.alamat =
                    typeof body.alamat === 'string'
                        ? JSON.parse(body.alamat)
                        : body.alamat;
            }
            catch (e) {
                throw new common_1.BadRequestException({
                    message: 'Format alamat tidak valid',
                    error: 'Harus berupa JSON string yang sesuai dengan AlamatDto',
                });
            }
        }
        const userAgent = req.headers['user-agent'] || null;
        const dto = (0, class_transformer_1.plainToInstance)(register_pengunjung_dto_1.RegisterPengunjungDto, {
            ...body,
            foto_pengunjung: file?.filename,
        });
        return this.pengunjungService.register(dto, ip, userAgent, file);
    }
    async getAllStasiun() {
        return this.pengunjungService.getAllStasiun();
    }
    async login(dto, ip, req) {
        const userAgent = req.headers['user-agent'] || null;
        return this.pengunjungService.login(dto, ip, userAgent);
    }
    async getJumlahPengunjung(authorization, user_id) {
        try {
            const access_token = authorization?.replace('Bearer ', '');
            if (!access_token) {
                throw new Error('Token akses tidak ditemukan');
            }
            return await this.pengunjungService.getJumlahPengunjung(access_token, user_id);
        }
        catch (error) {
            throw error;
        }
    }
    async logout(req, dto) {
        const userAgent = req.headers['user-agent'] || null;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        return this.pengunjungService.logout(dto, ip, userAgent);
    }
    async getProfile(access_token, user_id) {
        return this.pengunjungService.getProfile(user_id, access_token);
    }
    async updateProfile(dto, foto, ip, req, authHeader, idPengunjungHeader) {
        const access_token = authHeader?.replace('Bearer ', '');
        const id_pengunjung = idPengunjungHeader;
        const fullDto = { ...dto, access_token, id_pengunjung };
        const userAgent = req.headers['user-agent'] || null;
        return this.pengunjungService.updateProfile(fullDto, ip, userAgent, foto);
    }
    async resetPassword(dto, ip, req) {
        const userAgent = req.headers['user-agent'] || null;
        return this.pengunjungService.resetPasswordPengunjung(dto, ip, userAgent);
    }
    async isiBukuTamu(file, dto, accessTokenHeader, userIdHeader, ip, req) {
        console.log('Access Token Header:', accessTokenHeader);
        console.log('User ID Header:', userIdHeader);
        const access_token = accessTokenHeader?.trim();
        const user_id = userIdHeader?.trim();
        if (!access_token) {
            throw new common_1.UnauthorizedException({
                message: 'access_token header harus disertakan',
                example: 'access_token: your_jwt_token_here',
            });
        }
        if (!user_id) {
            throw new common_1.UnauthorizedException({
                message: 'user_id header harus disertakan',
                example: 'user_id: 1fc56aad-13cc-4e5a-ba8c-1c9a0f4d4f56',
            });
        }
        const userAgent = req.headers['user-agent'] || null;
        return this.pengunjungService.isiBukuTamu(dto, access_token, user_id, ip, userAgent, file);
    }
    async getRiwayatBukuTamu(access_token, user_id) {
        return this.pengunjungService.getRiwayatBukuTamu(user_id, access_token);
    }
};
exports.PengunjungController = PengunjungController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PengunjungController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('provinces/:id'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of provinces',
        type: [wilayah_response_dto_1.WilayahResponseDto],
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getProvinceById", null);
__decorate([
    (0, common_1.Get)('regencies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getRegencyById", null);
__decorate([
    (0, common_1.Get)('districts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getDistrictById", null);
__decorate([
    (0, common_1.Get)('villages/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getVillageById", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Registrasi berhasil',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Data tidak valid/gambar corrupt',
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto_pengunjung', multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "register", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getAllStasiun", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_pengunjung_dto_1.LoginPengunjungDto, String, Object]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('jumlah'),
    __param(0, (0, common_1.Headers)('access_token')),
    __param(1, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getJumlahPengunjung", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, logout_pengunjung_dto_1.LogoutPengunjungDto]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Visitor profile retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid token or user mismatch',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Visitor data not found',
    }),
    __param(0, (0, common_1.Headers)('access_token')),
    __param(1, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getProfile", null);
__decorate([
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Put)('update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('Foto_Pengunjung')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Headers)('access_token')),
    __param(5, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_pengunjung_dto_1.UpdatePengunjungDto, Object, String, Object, String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_pengunjung_dto_1.ResetPasswordPengunjungDto, String, Object]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "resetPassword", null);
__decorate([
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, common_1.Post)('isi-buku-tamu'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('tanda_tangan')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('access_token')),
    __param(3, (0, common_1.Headers)('user_id')),
    __param(4, (0, common_1.Ip)()),
    __param(5, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, isi_buku_tamu_dto_1.IsiBukuTamuDto, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "isiBukuTamu", null);
__decorate([
    (0, common_1.Get)('riwayat'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Visitor guest book history retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid token or user mismatch',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'No guest book entries found',
    }),
    __param(0, (0, common_1.Headers)('access_token')),
    __param(1, (0, common_1.Headers)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getRiwayatBukuTamu", null);
exports.PengunjungController = PengunjungController = __decorate([
    (0, common_1.Controller)('pengunjung'),
    __metadata("design:paramtypes", [pengunjung_service_1.PengunjungService])
], PengunjungController);
//# sourceMappingURL=pengunjung.controller.js.map