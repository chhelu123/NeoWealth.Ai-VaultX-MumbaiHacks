const { Goal, Transaction, User } = require('../models');
const { Op } = require('sequelize');

class DynamicGoalService {
  static async optimizeUserGoals(userId) {
    try {
      const user = await User.findByPk(userId);
      const activeGoals = await Goal.findAll({
        where: { userId, status: 'active' }
      });

      const optimizations = [];

      for (const goal of activeGoals) {
        const optimization = await this.analyzeGoalProgress(goal, user);
        if (optimization.shouldAdjust) {
          await this.adjustGoal(goal, optimization);
          optimizations.push(optimization);
        }
      }

      // Suggest new goals based on behavior
      const suggestedGoals = await this.suggestNewGoals(userId, user);
      
      return {
        optimizations,
        suggestedGoals,
        totalGoalsOptimized: optimizations.length
      };
    } catch (error) {
      console.error('Error optimizing goals:', error);
      return null;
    }
  }

  static async analyzeGoalProgress(goal, user) {
    const daysRemaining = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
    const dailyRequired = (parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)) / Math.max(daysRemaining, 1);

    // Analyze user's recent saving behavior
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentTransactions = await Transaction.findAll({
      where: {
        userId: user.id,
        type: 'income',
        createdAt: { [Op.gte]: last30Days }
      }
    });

    const monthlyIncome = recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const savingCapacity = monthlyIncome * 0.2; // Assume 20% saving capacity

    const analysis = {
      goalId: goal.id,
      currentProgress: progress,
      daysRemaining,
      dailyRequired,
      savingCapacity,
      shouldAdjust: false,
      adjustmentType: null,
      newTarget: null,
      newDate: null,
      confidence: 0,
      reasoning: ''
    };

    // Goal is too ambitious
    if (dailyRequired > savingCapacity / 30 && progress < 50) {
      analysis.shouldAdjust = true;
      analysis.adjustmentType = 'reduce_target';
      analysis.newTarget = Math.floor(parseFloat(goal.currentAmount) + (savingCapacity * (daysRemaining / 30)));
      analysis.confidence = 0.85;
      analysis.reasoning = 'Goal target reduced based on current saving capacity and progress';
    }

    // Goal is too easy
    if (progress > 80 && daysRemaining > 30) {
      analysis.shouldAdjust = true;
      analysis.adjustmentType = 'increase_target';
      analysis.newTarget = Math.floor(parseFloat(goal.targetAmount) * 1.3);
      analysis.confidence = 0.78;
      analysis.reasoning = 'Goal target increased due to excellent progress';
    }

    // Extend deadline if reasonable
    if (dailyRequired > savingCapacity / 20 && progress > 30) {
      analysis.shouldAdjust = true;
      analysis.adjustmentType = 'extend_deadline';
      const additionalDays = Math.ceil((parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)) / (savingCapacity / 30));
      analysis.newDate = new Date(Date.now() + additionalDays * 24 * 60 * 60 * 1000);
      analysis.confidence = 0.82;
      analysis.reasoning = 'Deadline extended to match realistic saving pace';
    }

    return analysis;
  }

  static async adjustGoal(goal, optimization) {
    try {
      const updates = {};

      if (optimization.newTarget) {
        updates.targetAmount = optimization.newTarget;
      }

      if (optimization.newDate) {
        updates.targetDate = optimization.newDate;
      }

      // Add AI recommendation to goal
      updates.aiRecommendations = {
        lastOptimization: new Date(),
        adjustmentType: optimization.adjustmentType,
        confidence: optimization.confidence,
        reasoning: optimization.reasoning,
        previousTarget: goal.targetAmount,
        previousDate: goal.targetDate
      };

      await goal.update(updates);
      
      console.log(`Goal ${goal.id} optimized: ${optimization.adjustmentType}`);
      return true;
    } catch (error) {
      console.error('Error adjusting goal:', error);
      return false;
    }
  }

  static async suggestNewGoals(userId, user) {
    try {
      const existingGoals = await Goal.findAll({
        where: { userId, status: { [Op.in]: ['active', 'completed'] } }
      });

      const existingCategories = existingGoals.map(g => g.category);
      const suggestions = [];

      // Analyze spending to suggest goals
      const last60Days = new Date();
      last60Days.setDate(last60Days.getDate() - 60);

      const transactions = await Transaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: last60Days }
        }
      });

      const categorySpending = {};
      transactions.forEach(t => {
        if (t.type === 'expense') {
          categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount);
        }
      });

      // Emergency fund suggestion
      if (!existingCategories.includes('emergency')) {
        const monthlyExpenses = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0) / 2;
        suggestions.push({
          category: 'emergency',
          title: 'Emergency Fund',
          description: 'Build a 6-month emergency fund for financial security',
          targetAmount: Math.floor(monthlyExpenses * 6),
          priority: 'high',
          reasoning: 'Essential financial safety net based on your spending patterns',
          confidence: 0.95
        });
      }

      // Vacation fund based on entertainment spending
      if (!existingCategories.includes('vacation') && categorySpending.entertainment > 2000) {
        suggestions.push({
          category: 'vacation',
          title: 'Dream Vacation Fund',
          description: 'Save for your next amazing vacation',
          targetAmount: Math.floor(categorySpending.entertainment * 6),
          priority: 'medium',
          reasoning: 'Based on your entertainment spending, you might enjoy saving for travel',
          confidence: 0.72
        });
      }

      // Investment goal if income is good
      if (!existingCategories.includes('investment') && parseFloat(user.monthlyIncome) > 30000) {
        suggestions.push({
          category: 'investment',
          title: 'Investment Portfolio',
          description: 'Build a diversified investment portfolio',
          targetAmount: Math.floor(parseFloat(user.monthlyIncome) * 12 * 0.15), // 15% of annual income
          priority: 'high',
          reasoning: 'Your income level suggests good investment potential',
          confidence: 0.88
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error suggesting goals:', error);
      return [];
    }
  }

  static async createMilestones(goalId) {
    try {
      const goal = await Goal.findByPk(goalId);
      if (!goal) return [];

      const milestones = [];
      const targetAmount = parseFloat(goal.targetAmount);
      const milestonePercentages = [25, 50, 75, 90];

      milestonePercentages.forEach((percentage, index) => {
        const milestoneAmount = Math.floor(targetAmount * (percentage / 100));
        milestones.push({
          goalId,
          percentage,
          targetAmount: milestoneAmount,
          reward: this.calculateMilestoneReward(percentage, targetAmount),
          title: `${percentage}% Complete`,
          description: `Reach ₹${milestoneAmount.toLocaleString()} towards your goal`,
          status: 'pending'
        });
      });

      return milestones;
    } catch (error) {
      console.error('Error creating milestones:', error);
      return [];
    }
  }

  static calculateMilestoneReward(percentage, targetAmount) {
    const baseReward = Math.floor(targetAmount / 1000); // 1 NeoCoin per ₹1000
    const milestoneMultiplier = {
      25: 1.2,
      50: 1.5,
      75: 2.0,
      90: 3.0
    };

    return Math.floor(baseReward * (milestoneMultiplier[percentage] || 1));
  }

  static async checkMilestoneAchievements(goalId) {
    try {
      const goal = await Goal.findByPk(goalId);
      if (!goal) return [];

      const currentAmount = parseFloat(goal.currentAmount);
      const targetAmount = parseFloat(goal.targetAmount);
      const currentPercentage = (currentAmount / targetAmount) * 100;

      const achievedMilestones = [];
      const milestonePercentages = [25, 50, 75, 90];

      milestonePercentages.forEach(percentage => {
        if (currentPercentage >= percentage) {
          achievedMilestones.push({
            percentage,
            reward: this.calculateMilestoneReward(percentage, targetAmount),
            achieved: true,
            achievedAt: new Date()
          });
        }
      });

      return achievedMilestones;
    } catch (error) {
      console.error('Error checking milestones:', error);
      return [];
    }
  }
}

module.exports = DynamicGoalService;