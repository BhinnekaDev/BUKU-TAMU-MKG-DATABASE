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
exports.RegisterAdminDto = exports.PeranAdmin = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var PeranAdmin;
(function (PeranAdmin) {
    PeranAdmin["ADMIN"] = "Admin";
    PeranAdmin["SUPERADMIN"] = "Superadmin";
})(PeranAdmin || (exports.PeranAdmin = PeranAdmin = {}));
class RegisterAdminDto {
    email;
    password;
    nama_depan_admin;
    nama_belakang_admin;
    peran;
    id_stasiun;
    foto_admin;
}
exports.RegisterAdminDto = RegisterAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'admin@example.com',
        description: 'Email admin yang valid',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'StrongPassword123',
        description: 'Password akun admin (min 8 karakter)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Budi',
        description: 'Nama depan admin',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "nama_depan_admin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Santoso',
        description: 'Nama belakang admin',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "nama_belakang_admin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: PeranAdmin,
        example: PeranAdmin.ADMIN,
        description: 'Peran admin: Admin atau Superadmin',
    }),
    (0, class_validator_1.IsEnum)(PeranAdmin),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "peran", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'a19bf289-2faf-4739-a122-b4d1b783c408',
        description: 'ID stasiun (hanya untuk Admin, Superadmin tidak boleh punya)',
    }),
    (0, class_validator_1.ValidateIf)((o) => o.peran === PeranAdmin.ADMIN),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "id_stasiun", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: 'string',
        format: 'binary',
        description: 'Foto admin dalam format JPG, JPEG, atau PNG',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], RegisterAdminDto.prototype, "foto_admin", void 0);
//# sourceMappingURL=register-admin.dto.js.map