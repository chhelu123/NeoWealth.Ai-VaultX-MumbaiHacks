const express = require('express');
const AIClassificationService = require('../services/aiClassificationService');
const HabitEnforcerService = require('../services/habitEnforcerService');
const DynamicGoalService = require('../services/dynamicGoalService');
const { authenticateToken } = require('../middleware/auth');
const { Transaction } = require('../models');
const router = express.Router();

// AI Transaction Classification
router.post('/classify-transaction', authenticateToken, async (req, res) => {
  try {
    const { description, amount, sender } = req.body;
    
    if (!description || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Description and amount are required'
      });
    }
    
    const classification = await AIClassificationService.classifyTransaction(description, amount, sender);
    
    res.json({
      success: true,
      data: classification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI classification failed',
      error: error.message
    });
  }
});

// Get AI Behavior Analysis
router.get('/behavior-analysis', authenticateToken, async (req, res) => {
  try {
    const behaviorProfile = await HabitEnforcerService.analyzeUserBehavior(req.userId);
    
    res.json({
      success: true,
      data: { behaviorProfile }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Behavior analysis failed',
      error: error.message
    });
  }
});

// Get Personalized Nudges
router.get('/nudges', authenticateToken, async (req, res) => {
  try {
    const nudges = await HabitEnforcerService.sendPersonalizedNudge(req.userId);
    
    res.json({
      success: true,
      data: { nudges }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate nudges',
      error: error.message
    });
  }
});

// Create Personalized Challenge
router.post('/create-challenge', authenticateToken, async (req, res) => {
  try {
    const { recommendation } = req.body;
    
    const challenge = await HabitEnforcerService.createPersonalizedChallenge(req.userId, recommendation);
    
    res.json({
      success: true,
      message: 'Challenge created successfully',
      data: { challenge }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge',
      error: error.message
    });
  }
});

// Optimize Goals
router.post('/optimize-goals', authenticateToken, async (req, res) => {
  try {
    const optimization = await DynamicGoalService.optimizeUserGoals(req.userId);
    
    res.json({
      success: true,
      message: 'Goals optimized successfully',
      data: { optimization }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Goal optimization failed',
      error: error.message
    });
  }
});

// Get AI Spending Insights
router.get('/spending-insights', authenticateToken, async (req, res) => {
  try {
    const insights = await AIClassificationService.generateSpendingInsights(req.userId);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
});

// Get Habit Enforcer Spending Insights
router.get('/habit-insights', authenticateToken, async (req, res) => {
  try {
    const insights = await HabitEnforcerService.getSpendingInsights(req.userId);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate habit insights',
      error: error.message
    });
  }
});

// Process SMS Transaction with Real-Time AI
router.post('/process-sms', authenticateToken, async (req, res) => {
  try {
    const { smsText, sender } = req.body;
    
    if (!smsText) {
      return res.status(400).json({
        success: false,
        message: 'SMS text is required'
      });
    }

    // Process SMS using AI classification service
    const result = await AIClassificationService.processSMSTransaction(smsText, sender);
    
    if (!result.success) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    // Create transaction in database
    const transactionData = {
      userId: req.userId,
      amount: result.data.amount,
      description: result.data.description,
      category: result.data.category,
      subcategory: result.data.subcategory,
      type: result.data.type,
      date: result.data.date,
      source: 'sms',
      metadata: {
        sender: result.data.sender,
        confidence: result.data.confidence,
        riskLevel: result.data.riskLevel,
        suggestions: result.data.suggestions
      }
    };

    const transaction = await Transaction.create(transactionData);

    // Award rewards for transactions
    if (result.data.type === 'debit') {
      const RewardService = require('../services/rewardService');
      await RewardService.awardTransactionReward(req.userId, Math.abs(result.data.amount), 'expense');
    }

    // Trigger real-time AI analysis
    const RealTimeDecisionEngine = require('../services/realTimeDecisionEngine');
    const aiDecisions = await RealTimeDecisionEngine.processRealTimeEvent(
      req.userId, 
      'transaction_added', 
      transactionData
    );

    res.json({
      success: true,
      message: 'SMS processed and transaction created with AI analysis',
      data: { 
        transaction,
        aiAnalysis: {
          category: result.data.category,
          confidence: result.data.confidence,
          riskLevel: result.data.riskLevel,
          suggestions: result.data.suggestions
        },
        aiDecisions: aiDecisions.decisions || []
      }
    });
  } catch (error) {
    console.error('SMS processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process SMS',
      error: error.message
    });
  }
});

// Initialize Personal AI Agent
router.post('/initialize-agent', authenticateToken, async (req, res) => {
  try {
    const PersonalAgentService = require('../services/personalAgentService');
    const agent = await PersonalAgentService.initializeAgent(req.userId);
    
    res.json({
      success: true,
      message: 'Personal AI agent initialized successfully',
      data: { agent }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize AI agent',
      error: error.message
    });
  }
});

// Get AI Agent Status
router.get('/agent-status', authenticateToken, async (req, res) => {
  try {
    const PersonalAgentService = require('../services/personalAgentService');
    const status = await PersonalAgentService.getAgentStatus(req.userId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get agent status',
      error: error.message
    });
  }
});

// Trigger Manual AI Analysis
router.post('/analyze-now', authenticateToken, async (req, res) => {
  try {
    const PersonalAgentService = require('../services/personalAgentService');
    const analysis = await PersonalAgentService.performAutonomousAnalysis(req.userId);
    
    res.json({
      success: true,
      message: 'AI analysis completed',
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform AI analysis',
      error: error.message
    });
  }
});

// Process Real-Time Event
router.post('/real-time-event', authenticateToken, async (req, res) => {
  try {
    const { eventType, eventData } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    const RealTimeDecisionEngine = require('../services/realTimeDecisionEngine');
    const result = await RealTimeDecisionEngine.processRealTimeEvent(
      req.userId,
      eventType,
      eventData || {}
    );
    
    res.json({
      success: true,
      message: 'Real-time event processed',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process real-time event',
      error: error.message
    });
  }
});

module.exports = router;