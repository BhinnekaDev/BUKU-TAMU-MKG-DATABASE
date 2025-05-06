const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error("Tanda tangan harus berupa file gambar (jpg, jpeg, atau png)")
    );
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
