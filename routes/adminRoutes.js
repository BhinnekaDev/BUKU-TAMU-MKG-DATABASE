const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/profile', authenticateToken, authorizeRole('admin', 'Superadmin'), adminController.getProfile);
router.put('/profile', authenticateToken, authorizeRole('admin', 'Superadmin'), adminController.updateProfile);

module.exports = router;
