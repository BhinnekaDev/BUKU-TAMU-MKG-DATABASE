require("module-alias/register");
const express = require("express");
const router = express.Router();
const pengunjungController = require("@/controllers/pengunjungController");
const {
  authenticateToken,
  authorizeRole,
} = require("@/middleware/authMiddleware");
const upload = require("@/middleware/uploadMulter");

router.post("/register", pengunjungController.registerPengunjung);
router.post("/login", pengunjungController.loginPengunjung);
router.post(
  "/logout",
  authenticateToken,
  pengunjungController.logoutPengunjung
);
router.get(
  "/profile",
  authenticateToken,
  authorizeRole("pengunjung"),
  pengunjungController.getProfile
);
router.put(
  "/profile",
  authenticateToken,
  authorizeRole("pengunjung"),
  pengunjungController.updateProfile
);
router.post(
  "/tamu",
  authenticateToken,
  authorizeRole("pengunjung"),
  upload.single("Tanda_Tangan"),
  pengunjungController.buatKunjunganTamu
);

module.exports = router;
