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
exports.RegisterPengunjungDto = exports.AsalPengunjung = exports.AlamatDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AlamatDto {
    province_id;
    regency_id;
    district_id;
    village_id;
    Kode_Pos;
}
exports.AlamatDto = AlamatDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "province_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "regency_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "district_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "village_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDto.prototype, "Kode_Pos", void 0);
var AsalPengunjung;
(function (AsalPengunjung) {
    AsalPengunjung["BMKG"] = "BMKG";
    AsalPengunjung["Dinas"] = "Dinas";
    AsalPengunjung["Universitas"] = "Universitas";
    AsalPengunjung["Media"] = "Media";
    AsalPengunjung["Lembaga_Non_Pemerintahan"] = "Lembaga Non Pemerintahan";
    AsalPengunjung["Umum"] = "Umum";
})(AsalPengunjung || (exports.AsalPengunjung = AsalPengunjung = {}));
class RegisterPengunjungDto {
    email;
    password;
    nama_depan_pengunjung;
    nama_belakang_pengunjung;
    no_telepon_pengunjung;
    asal_pengunjung;
    keterangan_asal_pengunjung;
    alamat;
    foto_pengunjung;
}
exports.RegisterPengunjungDto = RegisterPengunjungDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "nama_depan_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "nama_belakang_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "no_telepon_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AsalPengunjung }),
    (0, class_validator_1.IsEnum)(AsalPengunjung),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "asal_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "keterangan_asal_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: AlamatDto }),
    __metadata("design:type", AlamatDto)
], RegisterPengunjungDto.prototype, "alamat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPengunjungDto.prototype, "foto_pengunjung", void 0);
//# sourceMappingURL=register-pengunjung.dto.js.map