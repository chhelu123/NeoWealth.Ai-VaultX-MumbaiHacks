const { Wallet, Transaction } = require('../models');

class RewardService {
  static async calculateDailyReward(userId) {
    try {
      const wallet = await Wallet.findOne({ where: { userId } });
      if (!wallet) return 0;

      // Check if already rewarded today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (wallet.lastRewardDate && new Date(wallet.lastRewardDate) >= today) {
        return 0; // Already rewarded today
      }

      // Base daily reward
      let reward = 5.0;

      // Bonus for consistent usage (check last 7 days of transactions)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentTransactions = await Transaction.count({
        where: {
          userId,
          createdAt: { [require('sequelize').Op.gte]: weekAgo }
        }
      });

      if (recentTransactions >= 5) {
        reward *= 1.5; // 50% bonus for active users
      }

      return reward;
    } catch (error) {
      console.error('Error calculating daily reward:', error);
      return 0;
    }
  }

  static async awardDailyReward(userId) {
    try {
      const reward = await this.calculateDailyReward(userId);
      if (reward <= 0) return null;

      const wallet = await Wallet.findOne({ where: { userId } });
      await wallet.update({
        neoCoins: parseFloat(wallet.neoCoins) + reward,
        lastRewardDate: new Date()
      });

      // Create reward transaction
      await Transaction.create({
        userId,
        type: 'income',
        category: 'rewards',
        amount: reward,
        description: 'Daily login reward',
        date: new Date()
      });

      return reward;
    } catch (error) {
      console.error('Error awarding daily reward:', error);
      return null;
    }
  }

  static async awardTransactionReward(userId, transactionAmount, transactionType) {
    try {
      if (transactionType !== 'expense') return 0;

      const wallet = await Wallet.findOne({ where: { userId } });
      if (!wallet) return 0;

      // 1% cashback on expenses
      const reward = parseFloat(transactionAmount) * 0.01 * parseFloat(wallet.rewardMultiplier);

      await wallet.update({
        neoCoins: parseFloat(wallet.neoCoins) + reward
      });

      await Transaction.create({
        userId,
        type: 'income',
        category: 'rewards',
        amount: reward,
        description: `Cashback reward (1% of ${transactionAmount})`,
        date: new Date()
      });

      return reward;
    } catch (error) {
      console.error('Error awarding transaction reward:', error);
      return 0;
    }
  }
}

module.exports = RewardService;