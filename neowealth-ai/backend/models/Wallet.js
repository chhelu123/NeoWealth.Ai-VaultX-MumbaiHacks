const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  neoCoins: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100.00
  },
  cashBalance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalEarned: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  rewardMultiplier: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.00
  },
  lastRewardDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Wallet;