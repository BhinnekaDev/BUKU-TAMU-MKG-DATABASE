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
exports.UpdateAdminProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpdateAdminProfileDto {
    nama_depan_admin;
    nama_belakang_admin;
    password;
    foto_admin;
}
exports.UpdateAdminProfileDto = UpdateAdminProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Budi',
        description: 'Nama depan admin',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminProfileDto.prototype, "nama_depan_admin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Santoso',
        description: 'Nama belakang admin',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminProfileDto.prototype, "nama_belakang_admin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'NewStrongPassword123',
        description: 'Password baru (min 8 karakter)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], UpdateAdminProfileDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: 'string',
        format: 'binary',
        description: 'Foto admin dalam format JPG, JPEG, atau PNG',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null),
    (0, class_validator_1.IsString)({ message: 'Foto harus berupa string yang merepresentasikan file' }),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Object)
], UpdateAdminProfileDto.prototype, "foto_admin", void 0);
//# sourceMappingURL=update-admin.dto.js.map