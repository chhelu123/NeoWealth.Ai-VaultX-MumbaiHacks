const express = require('express');
const { getWallet, earnNeoCoins, spendNeoCoins, transferNeoCoins, getRewardHistory } = require('../controllers/walletController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, getWallet);
router.post('/earn', authenticateToken, earnNeoCoins);
router.post('/spend', authenticateToken, spendNeoCoins);
router.post('/transfer', authenticateToken, transferNeoCoins);
router.get('/rewards', authenticateToken, getRewardHistory);

module.exports = router;