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
exports.UpdatePengunjungDto = exports.AsalPengunjung = exports.AlamatDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AlamatDto {
    Provinsi;
    Kabupaten;
    Kecamatan;
    Kelurahan;
    Kode_Pos;
    RT;
    RW;
    Alamat_Jalan;
}
exports.AlamatDto = AlamatDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "Provinsi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "Kabupaten", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "Kecamatan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "Kelurahan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "Kode_Pos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AlamatDto.prototype, "RT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AlamatDto.prototype, "RW", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "Alamat_Jalan", void 0);
var AsalPengunjung;
(function (AsalPengunjung) {
    AsalPengunjung["BMKG"] = "BMKG";
    AsalPengunjung["PEMPROV"] = "PEMPROV";
    AsalPengunjung["PEMKAB"] = "PEMKAB";
    AsalPengunjung["PEMKOT"] = "PEMKOT";
    AsalPengunjung["UNIVERSITAS"] = "UNIVERSITAS";
    AsalPengunjung["UMUM"] = "UMUM";
})(AsalPengunjung || (exports.AsalPengunjung = AsalPengunjung = {}));
class UpdatePengunjungDto {
    password;
    nama_depan_pengunjung;
    nama_belakang_pengunjung;
    no_telepon_pengunjung;
    asal_pengunjung;
    keterangan_asal_pengunjung;
    alamat;
    foto_pengunjung;
}
exports.UpdatePengunjungDto = UpdatePengunjungDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePengunjungDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePengunjungDto.prototype, "nama_depan_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePengunjungDto.prototype, "nama_belakang_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePengunjungDto.prototype, "no_telepon_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AsalPengunjung }),
    (0, class_validator_1.IsEnum)(AsalPengunjung),
    __metadata("design:type", String)
], UpdatePengunjungDto.prototype, "asal_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePengunjungDto.prototype, "keterangan_asal_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: AlamatDto }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", AlamatDto)
], UpdatePengunjungDto.prototype, "alamat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePengunjungDto.prototype, "foto_pengunjung", void 0);
//# sourceMappingURL=update-pengunjung.dto.js.map