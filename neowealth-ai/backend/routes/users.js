const express = require('express');
const { getProfile, updateProfile, getDashboard } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/dashboard', authenticateToken, getDashboard);

module.exports = router;