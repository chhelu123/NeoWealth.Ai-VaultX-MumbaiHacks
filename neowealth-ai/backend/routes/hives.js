const express = require('express');
const { getHives, getMyHive, findMatchingHive, joinHive, createHive, leaveHive } = require('../controllers/hiveController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, getHives);
router.get('/my-hive', authenticateToken, getMyHive);
router.get('/find-match', authenticateToken, findMatchingHive);
router.post('/join', authenticateToken, joinHive);
router.post('/create', authenticateToken, createHive);
router.post('/leave', authenticateToken, leaveHive);

module.exports = router;