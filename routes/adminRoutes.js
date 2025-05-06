const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);
router.post("/logout", authenticateToken, adminController.logoutAdmin);

router.get(
  "/profile",
  authenticateToken,
  authorizeRole("Admin", "Superadmin"),
  adminController.getProfile
);
router.put(
  "/profile",
  authenticateToken,
  authorizeRole("Admin", "Superadmin"),
  adminController.updateProfile
);
router.get(
  "/tamu",
  authenticateToken,
  authorizeRole("Admin", "Superadmin"),
  adminController.getDaftarTamu
);

module.exports = router;
