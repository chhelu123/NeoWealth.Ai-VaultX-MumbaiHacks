const express = require('express');
const SMSParser = require('../services/smsParser');
const { Transaction } = require('../models');
const RewardService = require('../services/rewardService');
const router = express.Router();

router.post('/sms', async (req, res) => {
  try {
    const { userId, smsText, sender } = req.body;

    if (!userId || !smsText) {
      return res.status(400).json({
        success: false,
        message: 'userId and smsText are required'
      });
    }

    // Parse SMS for transaction data
    const transactionData = await SMSParser.processTransactionSMS(userId, smsText);

    if (!transactionData) {
      return res.json({
        success: true,
        message: 'SMS processed but no transaction detected'
      });
    }

    // Create transaction
    const transaction = await Transaction.create(transactionData);

    // Award cashback for expenses
    if (transactionData.type === 'expense') {
      await RewardService.awardTransactionReward(userId, transactionData.amount, transactionData.type);
    }

    res.json({
      success: true,
      message: 'Transaction created from SMS',
      data: { transaction }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process SMS',
      error: error.message
    });
  }
});

router.post('/upi', async (req, res) => {
  try {
    const { userId, amount, type, merchant, method } = req.body;

    const transaction = await Transaction.create({
      userId,
      type,
      category: SMSParser.categorizeTransaction(merchant, amount),
      amount,
      description: `${method} payment to ${merchant}`,
      date: new Date(),
      tags: [method.toLowerCase()],
      aiClassification: {
        confidence: 0.9,
        merchant,
        method,
        parsedFrom: 'UPI_WEBHOOK'
      }
    });

    // Award cashback for expenses
    if (type === 'expense') {
      await RewardService.awardTransactionReward(userId, amount, type);
    }

    res.json({
      success: true,
      message: 'UPI transaction processed',
      data: { transaction }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process UPI transaction',
      error: error.message
    });
  }
});

module.exports = router;