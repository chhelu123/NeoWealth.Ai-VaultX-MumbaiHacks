const express = require('express');
const AnalyticsService = require('../services/analyticsService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/spending', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const insights = await AnalyticsService.getSpendingInsights(req.userId, period);
    
    res.json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spending insights',
      error: error.message
    });
  }
});

router.get('/goals', authenticateToken, async (req, res) => {
  try {
    const progress = await AnalyticsService.getGoalProgress(req.userId);
    
    res.json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goal progress',
      error: error.message
    });
  }
});

router.get('/health', authenticateToken, async (req, res) => {
  try {
    const health = await AnalyticsService.getFinancialHealth(req.userId);
    
    res.json({
      success: true,
      data: { health }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial health',
      error: error.message
    });
  }
});

module.exports = router;