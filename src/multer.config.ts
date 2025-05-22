import { memoryStorage } from 'multer';

export const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
    return callback(
      new Error('Hanya file gambar (jpg, jpeg, png) yang diizinkan'),
      false,
    );
  }
  callback(null, true);
};

export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
