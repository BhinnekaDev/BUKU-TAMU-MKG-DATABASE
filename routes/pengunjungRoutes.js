const express = require('express');
const router = express.Router();
const pengunjungController = require('../controllers/pengunjungController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/profile', authenticateToken, authorizeRole('pengunjung'), pengunjungController.getProfile);
router.put('/profile', authenticateToken, authorizeRole('pengunjung'), pengunjungController.updateProfile);

module.exports = router;
