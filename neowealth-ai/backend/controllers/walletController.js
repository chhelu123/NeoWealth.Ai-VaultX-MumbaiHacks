const { Wallet, Transaction } = require('../models');

const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      where: { userId: req.userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
      error: error.message
    });
  }
};

const earnNeoCoins = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const wallet = await Wallet.findOne({
      where: { userId: req.userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const newBalance = parseFloat(wallet.neoCoins) + parseFloat(amount);
    await wallet.update({ 
      neoCoins: newBalance,
      lastRewardDate: new Date()
    });

    // Create transaction record
    await Transaction.create({
      userId: req.userId,
      type: 'income',
      category: 'rewards',
      amount: amount,
      description: `NeoCoin reward: ${reason}`,
      date: new Date()
    });

    res.json({
      success: true,
      message: 'NeoCoins earned successfully',
      data: { 
        wallet,
        earned: amount,
        newBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to earn NeoCoins',
      error: error.message
    });
  }
};

const spendNeoCoins = async (req, res) => {
  try {
    const { amount, description } = req.body;

    const wallet = await Wallet.findOne({
      where: { userId: req.userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (parseFloat(wallet.neoCoins) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient NeoCoins'
      });
    }

    const newBalance = parseFloat(wallet.neoCoins) - parseFloat(amount);
    await wallet.update({ neoCoins: newBalance });

    // Create transaction record
    await Transaction.create({
      userId: req.userId,
      type: 'expense',
      category: 'neocoin-spend',
      amount: amount,
      description: description || 'NeoCoin spending',
      date: new Date()
    });

    res.json({
      success: true,
      message: 'NeoCoins spent successfully',
      data: { 
        wallet,
        spent: amount,
        newBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to spend NeoCoins',
      error: error.message
    });
  }
};

const transferNeoCoins = async (req, res) => {
  try {
    const { recipientId, amount, message } = req.body;

    const senderWallet = await Wallet.findOne({
      where: { userId: req.userId }
    });

    const recipientWallet = await Wallet.findOne({
      where: { userId: recipientId }
    });

    if (!senderWallet || !recipientWallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (parseFloat(senderWallet.neoCoins) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient NeoCoins'
      });
    }

    // Update balances
    await senderWallet.update({ 
      neoCoins: parseFloat(senderWallet.neoCoins) - parseFloat(amount) 
    });
    
    await recipientWallet.update({ 
      neoCoins: parseFloat(recipientWallet.neoCoins) + parseFloat(amount) 
    });

    // Create transaction records
    await Transaction.create({
      userId: req.userId,
      type: 'transfer',
      category: 'neocoin-transfer-out',
      amount: amount,
      description: `Transfer to user ${recipientId}: ${message || 'NeoCoin transfer'}`,
      date: new Date()
    });

    await Transaction.create({
      userId: recipientId,
      type: 'transfer',
      category: 'neocoin-transfer-in',
      amount: amount,
      description: `Transfer from user ${req.userId}: ${message || 'NeoCoin transfer'}`,
      date: new Date()
    });

    res.json({
      success: true,
      message: 'NeoCoins transferred successfully',
      data: { 
        senderBalance: senderWallet.neoCoins,
        transferred: amount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to transfer NeoCoins',
      error: error.message
    });
  }
};

const getRewardHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const rewards = await Transaction.findAndCountAll({
      where: { 
        userId: req.userId,
        category: 'rewards'
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        rewards: rewards.rows,
        pagination: {
          total: rewards.count,
          page: parseInt(page),
          pages: Math.ceil(rewards.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward history',
      error: error.message
    });
  }
};

module.exports = {
  getWallet,
  earnNeoCoins,
  spendNeoCoins,
  transferNeoCoins,
  getRewardHistory
};