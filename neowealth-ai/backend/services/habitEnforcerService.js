const { User, Transaction, Goal } = require('../models');
const { Op } = require('sequelize');

class HabitEnforcerService {
  static async analyzeUserBehavior(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const transactions = await Transaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: last30Days }
        },
        order: [['createdAt', 'DESC']]
      });

      if (transactions.length === 0) {
        return {
          message: 'No transaction data available for analysis',
          spendingPatterns: null,
          riskFactors: [],
          positiveHabits: [],
          recommendations: [{
            type: 'onboarding',
            priority: 'high',
            title: 'Start Your Financial Journey',
            message: 'Add your first transaction or connect your bank SMS to begin AI analysis',
            reward: 0
          }]
        };
      }

      const behaviorProfile = {
        spendingPatterns: this.analyzeSpendingPatterns(transactions),
        riskFactors: this.identifyRiskFactors(transactions),
        positiveHabits: this.identifyPositiveHabits(transactions),
        recommendations: []
      };

      behaviorProfile.recommendations = this.generateRecommendations(behaviorProfile);
      
      return behaviorProfile;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  static analyzeSpendingPatterns(transactions) {
    const patterns = {
      weekendSpending: 0,
      weekdaySpending: 0,
      impulsePurchases: 0,
      recurringExpenses: 0,
      categoryDistribution: {}
    };

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const amount = parseFloat(transaction.amount);

      if (isWeekend) {
        patterns.weekendSpending += amount;
      } else {
        patterns.weekdaySpending += amount;
      }

      // Detect impulse purchases (high amounts in entertainment/shopping)
      if ((transaction.category === 'shopping' || transaction.category === 'entertainment') && amount > 1000) {
        patterns.impulsePurchases += amount;
      }

      // Track category distribution
      patterns.categoryDistribution[transaction.category] = 
        (patterns.categoryDistribution[transaction.category] || 0) + amount;
    });

    return patterns;
  }

  static identifyRiskFactors(transactions) {
    const risks = [];
    const categoryTotals = {};

    transactions.forEach(transaction => {
      const category = transaction.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(transaction.amount);
    });

    // High food delivery spending
    if (categoryTotals.food > 5000) {
      risks.push({
        type: 'high_food_spending',
        severity: 'medium',
        message: 'High food delivery expenses detected',
        amount: categoryTotals.food,
        suggestion: 'Consider cooking at home more often'
      });
    }

    // Excessive shopping
    if (categoryTotals.shopping > 10000) {
      risks.push({
        type: 'excessive_shopping',
        severity: 'high',
        message: 'Excessive shopping expenses',
        amount: categoryTotals.shopping,
        suggestion: 'Implement a 24-hour waiting period before purchases'
      });
    }

    // Weekend overspending
    const weekendTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getDay() === 0 || date.getDay() === 6;
    });

    const weekendTotal = weekendTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const weekdayTotal = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) - weekendTotal;

    if (weekendTotal > weekdayTotal * 0.4) {
      risks.push({
        type: 'weekend_overspending',
        severity: 'medium',
        message: 'High weekend spending detected',
        amount: weekendTotal,
        suggestion: 'Set weekend spending limits'
      });
    }

    return risks;
  }

  static identifyPositiveHabits(transactions) {
    const positiveHabits = [];

    // Investment habit
    const investmentTransactions = transactions.filter(t => t.category === 'investment');
    if (investmentTransactions.length >= 3) {
      positiveHabits.push({
        type: 'regular_investing',
        message: 'Consistent investment habit detected',
        frequency: investmentTransactions.length,
        reward: 50
      });
    }

    // Utility bill payments on time
    const utilityTransactions = transactions.filter(t => t.category === 'utilities');
    if (utilityTransactions.length >= 2) {
      positiveHabits.push({
        type: 'timely_bills',
        message: 'Regular utility bill payments',
        frequency: utilityTransactions.length,
        reward: 25
      });
    }

    return positiveHabits;
  }

  static generateRecommendations(behaviorProfile) {
    const recommendations = [];

    // Based on risk factors
    behaviorProfile.riskFactors.forEach(risk => {
      switch (risk.type) {
        case 'high_food_spending':
          recommendations.push({
            type: 'habit_change',
            priority: 'medium',
            title: 'Reduce Food Delivery',
            message: 'Try cooking at home 3 days this week',
            reward: 30,
            challenge: {
              type: 'cooking_challenge',
              duration: 7,
              target: 3,
              reward: 50
            }
          });
          break;

        case 'excessive_shopping':
          recommendations.push({
            type: 'spending_control',
            priority: 'high',
            title: 'Shopping Pause',
            message: 'Wait 24 hours before any purchase over ₹1000',
            reward: 40,
            challenge: {
              type: 'mindful_spending',
              duration: 14,
              target: 5,
              reward: 75
            }
          });
          break;

        case 'weekend_overspending':
          recommendations.push({
            type: 'budget_control',
            priority: 'medium',
            title: 'Weekend Budget',
            message: 'Set a ₹2000 weekend spending limit',
            reward: 35,
            challenge: {
              type: 'weekend_budget',
              duration: 14,
              target: 2000,
              reward: 60
            }
          });
          break;
      }
    });

    // Positive reinforcement
    behaviorProfile.positiveHabits.forEach(habit => {
      recommendations.push({
        type: 'positive_reinforcement',
        priority: 'low',
        title: 'Keep It Up!',
        message: `Great job on ${habit.message.toLowerCase()}`,
        reward: habit.reward,
        challenge: null
      });
    });

    return recommendations;
  }

  static async createPersonalizedChallenge(userId, recommendation) {
    try {
      if (!recommendation || !recommendation.challenge) {
        throw new Error('Invalid recommendation for challenge creation');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const challenge = {
        userId,
        type: recommendation.challenge.type,
        title: recommendation.title,
        description: recommendation.message,
        target: recommendation.challenge.target,
        duration: recommendation.challenge.duration,
        reward: recommendation.challenge.reward,
        status: 'active',
        progress: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + recommendation.challenge.duration * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TODO: Save to Challenges table when implemented
      // const savedChallenge = await Challenge.create(challenge);
      
      return challenge;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  static async sendPersonalizedNudge(userId) {
    try {
      const behaviorProfile = await this.analyzeUserBehavior(userId);
      const nudges = [];

      // Generate contextual nudges based on behavior
      if (behaviorProfile.riskFactors && behaviorProfile.riskFactors.length > 0) {
        const topRisk = behaviorProfile.riskFactors[0];
        nudges.push({
          type: 'warning',
          title: '⚠️ Spending Alert',
          message: `${topRisk.message}. ${topRisk.suggestion}.`,
          priority: topRisk.severity,
          actionable: true,
          timestamp: new Date().toISOString()
        });
      }

      if (behaviorProfile.positiveHabits && behaviorProfile.positiveHabits.length > 0) {
        const topHabit = behaviorProfile.positiveHabits[0];
        nudges.push({
          type: 'encouragement',
          title: '🎉 Great Job!',
          message: topHabit.message,
          priority: 'low',
          actionable: false,
          timestamp: new Date().toISOString()
        });
      }

      // Time-based contextual nudges
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();

      if (hour >= 18 && hour <= 20) {
        nudges.push({
          type: 'reminder',
          title: '🍽️ Smart Dinner Choice',
          message: 'Cooking at home can save ₹300+ and earn you 25 NeoCoins!',
          priority: 'medium',
          actionable: true,
          timestamp: new Date().toISOString()
        });
      }

      if (dayOfWeek === 5 && hour >= 17) { // Friday evening
        nudges.push({
          type: 'weekend_planning',
          title: '🎯 Weekend Budget Ready?',
          message: 'Set your weekend spending limit to stay on track with your goals',
          priority: 'medium',
          actionable: true,
          timestamp: new Date().toISOString()
        });
      }

      return nudges;
    } catch (error) {
      console.error('Error generating nudges:', error);
      throw error;
    }
  }

  static async getSpendingInsights(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const last60Days = new Date();
      last60Days.setDate(last60Days.getDate() - 60);

      const currentPeriod = await Transaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: last30Days }
        }
      });

      const previousPeriod = await Transaction.findAll({
        where: {
          userId,
          createdAt: { 
            [Op.gte]: last60Days,
            [Op.lt]: last30Days
          }
        }
      });

      const currentTotal = currentPeriod.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const previousTotal = previousPeriod.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const percentageChange = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal) * 100 
        : 0;

      const categoryBreakdown = {};
      currentPeriod.forEach(transaction => {
        const category = transaction.category || 'other';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + parseFloat(transaction.amount);
      });

      const topCategories = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }));

      return {
        totalSpending: currentTotal,
        previousPeriodSpending: previousTotal,
        percentageChange: Math.round(percentageChange * 100) / 100,
        trend: percentageChange > 0 ? 'increasing' : percentageChange < 0 ? 'decreasing' : 'stable',
        categoryBreakdown: topCategories,
        transactionCount: currentPeriod.length,
        averageTransaction: currentPeriod.length > 0 ? currentTotal / currentPeriod.length : 0,
        period: '30 days'
      };
    } catch (error) {
      console.error('Error getting spending insights:', error);
      throw error;
    }
  }
}

module.exports = HabitEnforcerService;