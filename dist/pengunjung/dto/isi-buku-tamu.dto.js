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
exports.IsiBukuTamuDto = exports.AsalPengunjung = exports.AlamatDetailDto = exports.AlamatDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AlamatDto {
    province_id;
    regency_id;
    district_id;
    village_id;
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
class AlamatDetailDto {
    rt;
    rw;
    kode_pos;
    nama_jalan;
}
exports.AlamatDetailDto = AlamatDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '01' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDetailDto.prototype, "rt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '05' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDetailDto.prototype, "rw", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '40285' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDetailDto.prototype, "kode_pos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jl. Sukajadi No. 123' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlamatDetailDto.prototype, "nama_jalan", void 0);
var AsalPengunjung;
(function (AsalPengunjung) {
    AsalPengunjung["BMKG"] = "BMKG";
    AsalPengunjung["Dinas"] = "Dinas";
    AsalPengunjung["Universitas"] = "Universitas";
    AsalPengunjung["Media"] = "Media";
    AsalPengunjung["Lembaga_Non_Pemerintahan"] = "Lembaga Non Pemerintahan";
    AsalPengunjung["Umum"] = "Umum";
})(AsalPengunjung || (exports.AsalPengunjung = AsalPengunjung = {}));
class IsiBukuTamuDto {
    tujuan;
    id_stasiun;
    waktu_kunjungan;
    Nama_Depan_Pengunjung;
    Nama_Belakang_Pengunjung;
    Email_Pengunjung;
    No_Telepon_Pengunjung;
    Asal_Pengunjung;
    Keterangan_Asal_Pengunjung;
    alamat;
    alamat_detail;
}
exports.IsiBukuTamuDto = IsiBukuTamuDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tujuan kunjungan pengunjung',
        example: 'Mengikuti rapat koordinasi',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "tujuan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID stasiun yang dikunjungi',
        example: 'b0ae3f1d-901a-4530-a5fb-9c63c872d33e',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "id_stasiun", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Waktu kunjungan dalam format "Hari, DD MMMM YYYY, HH.mm"',
        example: 'Senin, 10 Juni 2024, 14.30',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "waktu_kunjungan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nama depan pengunjung',
        example: 'Ahmad',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "Nama_Depan_Pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nama belakang pengunjung',
        example: 'Hidayat',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "Nama_Belakang_Pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email pengunjung',
        example: 'ahmad.hidayat@example.com',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "Email_Pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nomor telepon pengunjung',
        example: '081234567890',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "No_Telepon_Pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: () => AsalPengunjung,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "Asal_Pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Keterangan tambahan tentang asal pengunjung',
        example: 'Perwakilan dari Dishub Jawa Barat',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "Keterangan_Asal_Pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Alamat dalam bentuk JSON string',
        example: '{"province_id":"32","regency_id":"3204","district_id":"3204190","village_id":"3204190005"}',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "alamat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detail alamat dalam bentuk JSON string',
        example: '{"rt":"01","rw":"05","kode_pos":"40285","nama_jalan":"Jl. Sukajadi No. 123"}',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IsiBukuTamuDto.prototype, "alamat_detail", void 0);
//# sourceMappingURL=isi-buku-tamu.dto.js.map