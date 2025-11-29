const { Transaction, Wallet } = require('../models');
const { Op } = require('sequelize');

const createTransaction = async (req, res) => {
  try {
    const { type, category, amount, description, date, isRecurring, recurringFrequency, tags } = req.body;

    // Convert amount based on type
    const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      category,
      amount: finalAmount,
      description,
      date: date || new Date(),
      isRecurring: isRecurring || false,
      recurringFrequency,
      tags: tags || []
    });

    // Update wallet balance
    const wallet = await Wallet.findOne({ where: { userId: req.userId } });
    if (wallet) {
      if (type === 'income') {
        await wallet.update({
          cashBalance: parseFloat(wallet.cashBalance) + parseFloat(amount),
          totalEarned: parseFloat(wallet.totalEarned) + parseFloat(amount),
          neoCoins: parseFloat(wallet.neoCoins) + (parseFloat(amount) * 0.01) // 1% reward
        });
      } else if (type === 'expense') {
        await wallet.update({
          cashBalance: parseFloat(wallet.cashBalance) - parseFloat(amount),
          totalSpent: parseFloat(wallet.totalSpent) + parseFloat(amount)
        });
      }
    }

    // Trigger AI analysis in background
    try {
      const RealTimeDecisionEngine = require('../services/realTimeDecisionEngine');
      await RealTimeDecisionEngine.processRealTimeEvent(
        req.userId,
        'transaction_added',
        {
          transactionId: transaction.id,
          amount: finalAmount,
          description: transaction.description,
          category: transaction.category,
          type: transaction.type
        }
      );
      console.log(`🤖 AI analyzed transaction ${transaction.id}`);
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      // Don't fail the transaction creation if AI fails
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
    
    const where = { userId: req.userId };
    
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const transactions = await Transaction.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Add AI insights to transactions
    const transactionsWithInsights = transactions.rows.map(transaction => {
      const transactionData = transaction.toJSON();
      
      // Add simple AI confidence based on category and amount
      const amount = Math.abs(parseFloat(transactionData.amount));
      let confidence = 0.8; // Base confidence
      
      if (amount > 5000) confidence = 0.95; // High amounts are usually accurate
      if (transactionData.category === 'other') confidence = 0.6; // Lower for uncategorized
      
      transactionData.metadata = {
        confidence,
        aiAnalyzed: true,
        riskLevel: amount > 5000 ? 'high' : amount > 1000 ? 'medium' : 'low'
      };
      
      return transactionData;
    });

    res.json({
      success: true,
      data: {
        transactions: transactionsWithInsights,
        pagination: {
          total: transactions.count,
          page: parseInt(page),
          pages: Math.ceil(transactions.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { type, category, amount, description, date, tags } = req.body;

    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.update({
      type: type || transaction.type,
      category: category || transaction.category,
      amount: amount || transaction.amount,
      description: description || transaction.description,
      date: date || transaction.date,
      tags: tags || transaction.tags
    });

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const transactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        date: { [Op.gte]: startDate }
      }
    });

    const analytics = {
      totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalInvestments: transactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + parseFloat(t.amount), 0),
      categoryBreakdown: {},
      transactionCount: transactions.length
    };

    // Category breakdown
    transactions.forEach(t => {
      if (!analytics.categoryBreakdown[t.category]) {
        analytics.categoryBreakdown[t.category] = 0;
      }
      analytics.categoryBreakdown[t.category] += parseFloat(t.amount);
    });

    analytics.netSavings = analytics.totalIncome - analytics.totalExpenses;

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getAnalytics
};