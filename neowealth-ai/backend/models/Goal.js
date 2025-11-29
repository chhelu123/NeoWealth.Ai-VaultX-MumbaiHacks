const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  targetAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('emergency', 'vacation', 'house', 'car', 'education', 'retirement', 'other'),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled'),
    defaultValue: 'active'
  },
  aiRecommendations: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

module.exports = Goal;