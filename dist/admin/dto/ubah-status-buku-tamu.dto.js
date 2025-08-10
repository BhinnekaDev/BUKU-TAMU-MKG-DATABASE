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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UbahStatusBukuTamuDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UbahStatusBukuTamuDto {
    statusBaru;
}
exports.UbahStatusBukuTamuDto = UbahStatusBukuTamuDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status baru untuk buku tamu',
        enum: ['menunggu persetujuan', 'disetujui', 'dibatalkan'],
        example: 'disetujui',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Status tidak boleh kosong' }),
    (0, class_validator_1.IsEnum)(['menunggu persetujuan', 'disetujui', 'dibatalkan'], {
        message: 'Status harus berupa salah satu dari: menunggu persetujuan, disetujui, dibatalkan',
    }),
    __metadata("design:type", String)
], UbahStatusBukuTamuDto.prototype, "statusBaru", void 0);
//# sourceMappingURL=ubah-status-buku-tamu.dto.js.map