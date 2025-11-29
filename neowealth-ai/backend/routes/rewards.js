const express = require('express');
const RewardService = require('../services/rewardService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/daily', authenticateToken, async (req, res) => {
  try {
    const reward = await RewardService.awardDailyReward(req.userId);
    
    if (reward === null) {
      return res.json({
        success: true,
        message: 'Daily reward already claimed today',
        data: { reward: 0 }
      });
    }

    res.json({
      success: true,
      message: 'Daily reward claimed successfully',
      data: { reward }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to claim daily reward',
      error: error.message
    });
  }
});

router.get('/calculate', authenticateToken, async (req, res) => {
  try {
    const reward = await RewardService.calculateDailyReward(req.userId);
    
    res.json({
      success: true,
      data: { availableReward: reward }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate reward',
      error: error.message
    });
  }
});

module.exports = router;