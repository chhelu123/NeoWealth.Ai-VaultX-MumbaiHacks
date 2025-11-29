const User = require('./User');
const Transaction = require('./Transaction');
const Goal = require('./Goal');
const Wallet = require('./Wallet');
const Hive = require('./Hive');
const HiveMember = require('./HiveMember');

// Define associations
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Goal, { foreignKey: 'userId', as: 'goals' });
Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Hive associations
Hive.hasMany(HiveMember, { foreignKey: 'hiveId', as: 'members' });
HiveMember.belongsTo(Hive, { foreignKey: 'hiveId', as: 'hive' });

User.hasMany(HiveMember, { foreignKey: 'userId', as: 'hiveMembers' });
HiveMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Transaction,
  Goal,
  Wallet,
  Hive,
  HiveMember
};