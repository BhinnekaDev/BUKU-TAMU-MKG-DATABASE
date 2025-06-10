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
exports.LogoutPengunjungDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class LogoutPengunjungDto {
    id_pengunjung;
    access_token;
}
exports.LogoutPengunjungDto = LogoutPengunjungDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID dari pengunjung yang ingin logout',
        example: 'd41d8cd9-8f00-3204-a980-0998ecf8427e',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LogoutPengunjungDto.prototype, "id_pengunjung", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token akses yang diberikan saat login',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LogoutPengunjungDto.prototype, "access_token", void 0);
//# sourceMappingURL=logout-pengunjung.dto.js.map