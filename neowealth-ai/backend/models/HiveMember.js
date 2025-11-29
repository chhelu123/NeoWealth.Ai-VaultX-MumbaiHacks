const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HiveMember = sequelize.define('HiveMember', {
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
  hiveId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Hives',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('member', 'admin'),
    defaultValue: 'member'
  },
  monthlyContribution: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalContributed: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'left'),
    defaultValue: 'active'
  },
  consistencyScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.00
  }
});

module.exports = HiveMember;