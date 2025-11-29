const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Hive = sequelize.define('Hive', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 15
  },
  currentMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  goalType: {
    type: DataTypes.ENUM('emergency', 'vacation', 'house', 'car', 'education', 'retirement', 'other'),
    allowNull: false
  },
  targetAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'paused'),
    defaultValue: 'active'
  },
  monthlyContribution: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = Hive;