const { Transaction, Goal } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  static async getSpendingInsights(userId, period = 'month') {
    try {
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
          userId,
          type: 'expense',
          date: { [Op.gte]: startDate }
        }
      });

      const categorySpending = {};
      let totalSpent = 0;

      transactions.forEach(t => {
        const amount = parseFloat(t.amount);
        totalSpent += amount;
        
        if (!categorySpending[t.category]) {
          categorySpending[t.category] = 0;
        }
        categorySpending[t.category] += amount;
      });

      // Find top spending categories
      const topCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: ((amount / totalSpent) * 100).toFixed(1)
        }));

      return {
        totalSpent,
        transactionCount: transactions.length,
        averageTransaction: totalSpent / transactions.length || 0,
        topCategories,
        period
      };
    } catch (error) {
      console.error('Error getting spending insights:', error);
      return null;
    }
  }

  static async getGoalProgress(userId) {
    try {
      const goals = await Goal.findAll({
        where: { userId, status: 'active' }
      });

      const goalProgress = goals.map(goal => {
        const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
        const daysRemaining = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
        const monthlyRequired = daysRemaining > 0 ? 
          (parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)) / (daysRemaining / 30) : 0;

        return {
          id: goal.id,
          title: goal.title,
          progress: Math.min(progress, 100),
          daysRemaining,
          monthlyRequired,
          onTrack: monthlyRequired <= (parseFloat(goal.targetAmount) / 12) // Rough estimate
        };
      });

      return goalProgress;
    } catch (error) {
      console.error('Error getting goal progress:', error);
      return [];
    }
  }

  static async getFinancialHealth(userId) {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);

      const monthlyTransactions = await Transaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: currentMonth }
        }
      });

      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const investments = monthlyTransactions
        .filter(t => t.type === 'investment')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      const investmentRate = income > 0 ? (investments / income) * 100 : 0;

      let healthScore = 0;
      if (savingsRate >= 20) healthScore += 40;
      else if (savingsRate >= 10) healthScore += 20;
      
      if (investmentRate >= 10) healthScore += 30;
      else if (investmentRate >= 5) healthScore += 15;

      if (expenses < income) healthScore += 30;

      return {
        income,
        expenses,
        investments,
        netSavings: income - expenses,
        savingsRate: savingsRate.toFixed(1),
        investmentRate: investmentRate.toFixed(1),
        healthScore: Math.min(healthScore, 100),
        recommendations: this.generateRecommendations(savingsRate, investmentRate, income, expenses)
      };
    } catch (error) {
      console.error('Error calculating financial health:', error);
      return null;
    }
  }

  static generateRecommendations(savingsRate, investmentRate, income, expenses) {
    const recommendations = [];

    if (savingsRate < 10) {
      recommendations.push({
        type: 'savings',
        message: 'Try to save at least 10% of your income each month',
        priority: 'high'
      });
    }

    if (investmentRate < 5) {
      recommendations.push({
        type: 'investment',
        message: 'Consider investing 5-10% of your income for long-term growth',
        priority: 'medium'
      });
    }

    if (expenses > income) {
      recommendations.push({
        type: 'budget',
        message: 'Your expenses exceed income. Review and cut unnecessary spending',
        priority: 'critical'
      });
    }

    return recommendations;
  }
}

module.exports = AnalyticsService;