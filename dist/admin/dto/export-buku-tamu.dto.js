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
exports.ExportBukuTamuDto = void 0;
const class_validator_1 = require("class-validator");
class ExportBukuTamuDto {
    bulan;
    tahun;
    format;
}
exports.ExportBukuTamuDto = ExportBukuTamuDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Bulan wajib diisi' }),
    (0, class_validator_1.Matches)(/^(0[1-9]|1[0-2]|all)$/, {
        message: 'Bulan harus dalam format 01-12 atau "all"',
    }),
    __metadata("design:type", String)
], ExportBukuTamuDto.prototype, "bulan", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Tahun wajib diisi' }),
    (0, class_validator_1.Matches)(/^\d{4}$/, {
        message: 'Tahun harus 4 digit, misalnya 2025',
    }),
    __metadata("design:type", String)
], ExportBukuTamuDto.prototype, "tahun", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['pdf', 'excel'], { message: 'Format harus pdf atau excel' }),
    __metadata("design:type", String)
], ExportBukuTamuDto.prototype, "format", void 0);
//# sourceMappingURL=export-buku-tamu.dto.js.map