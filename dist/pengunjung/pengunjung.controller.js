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
const isi_buku_tamu_dto_1 = require("./dto/isi-buku-tamu.dto");
const search_pengunjung_dto_1 = require("./dto/search-pengunjung.dto");
const pengunjung_service_1 = require("./pengunjung.service");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
let PengunjungController = class PengunjungController {
    pengunjungService;
    constructor(pengunjungService) {
        this.pengunjungService = pengunjungService;
    }
    getAll() {
        return this.pengunjungService.getAllAsalPengunjung();
    }
    async getAllStasiun() {
        return this.pengunjungService.getAllStasiun();
    }
    async getJumlahPengunjung(id_stasiun) {
        if (!id_stasiun) {
            throw new common_1.BadRequestException('Parameter id_stasiun wajib diisi.');
        }
        return this.pengunjungService.getJumlahPengunjung(id_stasiun);
    }
    async searchPengunjung(dto) {
        return this.pengunjungService.searchPengunjung(dto);
    }
    async isiBukuTamu(dto, req, file) {
        try {
            const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
                req.socket.remoteAddress ||
                null;
            const userAgent = req.headers['user-agent'] || null;
            return await this.pengunjungService.isiBukuTamu(dto, ip, userAgent, file);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message || 'Terjadi kesalahan saat menyimpan data buku tamu');
        }
    }
};
exports.PengunjungController = PengunjungController;
__decorate([
    (0, common_1.Get)('asalpengunjung'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PengunjungController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getAllStasiun", null);
__decorate([
    (0, common_1.Get)('jumlah'),
    (0, swagger_1.ApiQuery)({ name: 'id_stasiun', required: true, type: String }),
    __param(0, (0, common_1.Query)('id_stasiun')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "getJumlahPengunjung", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiBody)({ type: search_pengunjung_dto_1.SearchPengunjungDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_pengunjung_dto_1.SearchPengunjungDto]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "searchPengunjung", null);
__decorate([
    (0, common_1.Post)('isi-buku-tamu'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('tanda_tangan')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        description: 'Isi data buku tamu dengan tanda tangan file',
        schema: {
            type: 'object',
            properties: {
                tujuan: { type: 'string', example: 'Mengikuti rapat koordinasi' },
                id_stasiun: {
                    type: 'string',
                    example: 'b0ae3f1d-901a-4530-a5fb-9c63c872d33e',
                },
                Nama_Depan_Pengunjung: { type: 'string', example: 'Ahmad' },
                Nama_Belakang_Pengunjung: { type: 'string', example: 'Hidayat' },
                Email_Pengunjung: {
                    type: 'string',
                    example: 'ahmad.hidayat@example.com',
                },
                No_Telepon_Pengunjung: { type: 'string', example: '081234567890' },
                Asal_Pengunjung: {
                    type: 'string',
                    enum: [
                        'BMKG',
                        'Universitas',
                        'Pemerintah Pusat/Pemerintah Daerah',
                        'Umum',
                    ],
                    example: 'BMKG',
                },
                Asal_Instansi: {
                    type: 'string',
                    example: 'Perwakilan dari Dishub Jawa Barat',
                },
                waktu_kunjungan: {
                    type: 'string',
                    example: 'Senin, 10 Juni 2024, 14.30',
                    description: 'Waktu kunjungan dalam format yang mudah dibaca',
                },
                Alamat_Lengkap: { type: 'string', example: 'Alamat Jalan' },
                tanda_tangan: {
                    type: 'string',
                    format: 'binary',
                    description: 'File tanda tangan (JPG, PNG, dsb)',
                },
            },
            required: [
                'tujuan',
                'id_stasiun',
                'Nama_Depan_Pengunjung',
                'Nama_Belakang_Pengunjung',
                'Email_Pengunjung',
                'No_Telepon_Pengunjung',
                'Asal_Pengunjung',
            ],
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [isi_buku_tamu_dto_1.IsiBukuTamuDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PengunjungController.prototype, "isiBukuTamu", null);
exports.PengunjungController = PengunjungController = __decorate([
    (0, common_1.Controller)('pengunjung'),
    __metadata("design:paramtypes", [pengunjung_service_1.PengunjungService])
], PengunjungController);
//# sourceMappingURL=pengunjung.controller.js.map