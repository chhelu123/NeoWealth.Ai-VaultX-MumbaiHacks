const { User, Wallet, Transaction, Goal } = require('../models');

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        { model: Wallet, as: 'wallet' },
        { model: Transaction, as: 'transactions', limit: 5, order: [['createdAt', 'DESC']] },
        { model: Goal, as: 'goals', where: { status: 'active' }, required: false }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, monthlyIncome, riskTolerance } = req.body;

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      monthlyIncome: monthlyIncome || user.monthlyIncome,
      riskTolerance: riskTolerance || user.riskTolerance
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          monthlyIncome: user.monthlyIncome,
          riskTolerance: user.riskTolerance
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        { model: Wallet, as: 'wallet' },
        { 
          model: Transaction, 
          as: 'transactions',
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        { 
          model: Goal, 
          as: 'goals',
          where: { status: 'active' },
          required: false
        }
      ],
      attributes: { exclude: ['password'] }
    });

    // Calculate monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const monthlyTransactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        createdAt: {
          [require('sequelize').Op.gte]: currentMonth
        }
      }
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      success: true,
      data: {
        user,
        monthlyStats: {
          income: monthlyIncome,
          expenses: monthlyExpenses,
          savings: monthlyIncome - monthlyExpenses
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard
};