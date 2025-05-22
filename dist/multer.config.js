"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerConfig = exports.imageFileFilter = void 0;
const multer_1 = require("multer");
const imageFileFilter = (req, file, callback) => {
    if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
        return callback(new Error('Hanya file gambar (jpg, jpeg, png) yang diizinkan'), false);
    }
    callback(null, true);
};
exports.imageFileFilter = imageFileFilter;
exports.multerConfig = {
    storage: (0, multer_1.memoryStorage)(),
    fileFilter: exports.imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
};
//# sourceMappingURL=multer.config.js.map