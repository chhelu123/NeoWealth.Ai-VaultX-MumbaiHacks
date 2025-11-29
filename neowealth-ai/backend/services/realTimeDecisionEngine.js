const { User, Transaction, Goal } = require('../models');
const { Op } = require('sequelize');
const PersonalAgentService = require('./personalAgentService');
const HabitEnforcerService = require('./habitEnforcerService');
const RewardService = require('./rewardService');

class RealTimeDecisionEngine {
  static async processRealTimeEvent(userId, eventType, eventData) {
    try {
      console.log(`🔄 Processing real-time event: ${eventType} for user ${userId}`);

      // Analyze event context
      const context = await this.analyzeEventContext(userId, eventType, eventData);
      
      // Make real-time decisions
      const decisions = await this.makeRealTimeDecisions(userId, eventType, context);
      
      // Execute immediate actions
      const results = await this.executeImmediateActions(userId, decisions);
      
      return {
        eventType,
        context,
        decisions,
        results,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error processing real-time event:', error);
      throw error;
    }
  }

  static async analyzeEventContext(userId, eventType, eventData) {
    try {
      const context = {
        eventType,
        eventData,
        timestamp: new Date(),
        userProfile: await this.getUserProfile(userId)
      };

      switch (eventType) {
        case 'transaction_added':
          context.transactionAnalysis = await this.analyzeTransaction(userId, eventData);
          break;
        
        case 'goal_created':
          context.goalAnalysis = await this.analyzeGoalFeasibility(userId, eventData);
          break;
        
        case 'spending_threshold_reached':
          context.spendingAnalysis = await this.analyzeSpendingPattern(userId, eventData);
          break;
        
        case 'user_login':
          context.engagementAnalysis = await this.analyzeUserEngagement(userId);
          break;
      }

      return context;
    } catch (error) {
      console.error('Error analyzing event context:', error);
      return { eventType, eventData, timestamp: new Date() };
    }
  }

  static async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      const recentTransactions = await Transaction.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      return {
        userId,
        totalTransactions: recentTransactions.length,
        avgTransactionAmount: recentTransactions.length > 0 
          ? recentTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) / recentTransactions.length
          : 0,
        primaryCategories: this.extractPrimaryCategories(recentTransactions),
        riskProfile: this.calculateRiskProfile(recentTransactions)
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { userId, totalTransactions: 0, avgTransactionAmount: 0 };
    }
  }

  static extractPrimaryCategories(transactions) {
    const categoryCount = {};
    transactions.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  static calculateRiskProfile(transactions) {
    if (transactions.length === 0) return 'unknown';

    const amounts = transactions.map(t => Math.abs(parseFloat(t.amount)));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    if (maxAmount > avgAmount * 3) return 'high_variance';
    if (avgAmount > 2000) return 'high_spender';
    if (avgAmount < 500) return 'conservative';
    return 'moderate';
  }

  static async analyzeTransaction(userId, transactionData) {
    try {
      const amount = Math.abs(parseFloat(transactionData.amount));
      const category = transactionData.category;

      // Get user's spending history in this category
      const categoryHistory = await Transaction.findAll({
        where: { 
          userId, 
          category,
          createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });

      const avgCategorySpending = categoryHistory.length > 0
        ? categoryHistory.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) / categoryHistory.length
        : amount;

      return {
        amount,
        category,
        isUnusualAmount: amount > avgCategorySpending * 2,
        categoryFrequency: categoryHistory.length,
        riskLevel: amount > 5000 ? 'high' : amount > 1000 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      return { amount: 0, category: 'other', isUnusualAmount: false };
    }
  }

  static async analyzeGoalFeasibility(userId, goalData) {
    try {
      const targetAmount = parseFloat(goalData.targetAmount);
      const deadline = new Date(goalData.deadline || goalData.targetDate);
      const daysToDeadline = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

      // Analyze user's saving capacity
      const recentIncome = await this.calculateRecentIncome(userId);
      const recentExpenses = await this.calculateRecentExpenses(userId);
      const monthlySavingCapacity = Math.max(0, recentIncome - recentExpenses);

      const requiredMonthlySaving = targetAmount / (daysToDeadline / 30);

      return {
        targetAmount,
        daysToDeadline,
        requiredMonthlySaving,
        monthlySavingCapacity,
        feasibilityScore: monthlySavingCapacity > 0 
          ? Math.min(1, monthlySavingCapacity / requiredMonthlySaving)
          : 0,
        isFeasible: requiredMonthlySaving <= monthlySavingCapacity
      };
    } catch (error) {
      console.error('Error analyzing goal feasibility:', error);
      return { feasibilityScore: 0.5, isFeasible: true };
    }
  }

  static async calculateRecentIncome(userId) {
    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const incomeTransactions = await Transaction.findAll({
        where: {
          userId,
          amount: { [Op.gt]: 0 },
          createdAt: { [Op.gte]: last30Days }
        }
      });

      return incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    } catch (error) {
      console.error('Error calculating recent income:', error);
      return 0;
    }
  }

  static async calculateRecentExpenses(userId) {
    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const expenseTransactions = await Transaction.findAll({
        where: {
          userId,
          amount: { [Op.lt]: 0 },
          createdAt: { [Op.gte]: last30Days }
        }
      });

      return expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    } catch (error) {
      console.error('Error calculating recent expenses:', error);
      return 0;
    }
  }

  static async analyzeSpendingPattern(userId, eventData) {
    try {
      const currentSpending = eventData.currentSpending || 0;
      const threshold = eventData.threshold || 5000;

      return {
        currentSpending,
        threshold,
        exceedsThreshold: currentSpending > threshold,
        severity: currentSpending > threshold * 1.5 ? 'high' : 'medium'
      };
    } catch (error) {
      console.error('Error analyzing spending pattern:', error);
      return { currentSpending: 0, threshold: 0, exceedsThreshold: false };
    }
  }

  static async analyzeUserEngagement(userId) {
    try {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = await Transaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: last7Days }
        }
      });

      return {
        recentTransactions: recentActivity.length,
        engagementLevel: recentActivity.length > 5 ? 'high' : recentActivity.length > 2 ? 'medium' : 'low',
        lastActivityDate: recentActivity[0]?.createdAt || null
      };
    } catch (error) {
      console.error('Error analyzing user engagement:', error);
      return { recentTransactions: 0, engagementLevel: 'low' };
    }
  }

  static async makeRealTimeDecisions(userId, eventType, context) {
    const decisions = [];

    try {
      switch (eventType) {
        case 'transaction_added':
          if (context.transactionAnalysis?.isUnusualAmount) {
            decisions.push({
              type: 'unusual_spending_alert',
              priority: 'high',
              action: 'send_spending_alert',
              reasoning: 'Transaction amount is unusually high for this category'
            });
          }

          if (context.transactionAnalysis?.riskLevel === 'high') {
            decisions.push({
              type: 'high_risk_transaction',
              priority: 'medium',
              action: 'suggest_budget_review',
              reasoning: 'High-value transaction detected'
            });
          }
          break;

        case 'goal_created':
          if (!context.goalAnalysis?.isFeasible) {
            decisions.push({
              type: 'goal_adjustment_needed',
              priority: 'high',
              action: 'suggest_goal_modification',
              reasoning: 'Goal may not be achievable with current saving capacity'
            });
          }
          break;

        case 'spending_threshold_reached':
          decisions.push({
            type: 'spending_limit_alert',
            priority: 'high',
            action: 'create_spending_intervention',
            reasoning: 'User has reached spending threshold'
          });
          break;

        case 'user_login':
          if (context.engagementAnalysis?.engagementLevel === 'low') {
            decisions.push({
              type: 'engagement_boost',
              priority: 'low',
              action: 'suggest_activities',
              reasoning: 'User has low recent engagement'
            });
          }
          break;
      }

      return decisions;
    } catch (error) {
      console.error('Error making real-time decisions:', error);
      return [];
    }
  }

  static async executeImmediateActions(userId, decisions) {
    const results = [];

    for (const decision of decisions) {
      try {
        let result = null;

        switch (decision.action) {
          case 'send_spending_alert':
            result = await this.sendSpendingAlert(userId, decision);
            break;
          
          case 'suggest_budget_review':
            result = await this.suggestBudgetReview(userId, decision);
            break;
          
          case 'suggest_goal_modification':
            result = await this.suggestGoalModification(userId, decision);
            break;
          
          case 'create_spending_intervention':
            result = await this.createSpendingIntervention(userId, decision);
            break;
          
          case 'suggest_activities':
            result = await this.suggestActivities(userId, decision);
            break;
        }

        results.push({
          decision: decision.type,
          success: result?.success || false,
          result
        });

      } catch (error) {
        console.error(`Error executing action ${decision.action}:`, error);
        results.push({
          decision: decision.type,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  static async sendSpendingAlert(userId, decision) {
    try {
      const alert = {
        userId,
        type: 'spending_alert',
        title: '💰 Unusual Spending Detected',
        message: 'This transaction is higher than your usual spending in this category. Consider if this aligns with your financial goals.',
        priority: decision.priority,
        timestamp: new Date()
      };

      console.log('Real-time spending alert created:', alert);
      return { success: true, alert };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async suggestBudgetReview(userId, decision) {
    try {
      const suggestion = {
        userId,
        type: 'budget_review',
        title: '📊 Budget Review Suggested',
        message: 'Based on your recent high-value transaction, consider reviewing your monthly budget to ensure you stay on track.',
        actionable: true,
        timestamp: new Date()
      };

      console.log('Budget review suggestion created:', suggestion);
      return { success: true, suggestion };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async suggestGoalModification(userId, decision) {
    try {
      const suggestion = {
        userId,
        type: 'goal_modification',
        title: '🎯 Goal Adjustment Recommended',
        message: 'Your new goal might be challenging to achieve. Consider adjusting the target amount or timeline for better success.',
        actionable: true,
        timestamp: new Date()
      };

      console.log('Goal modification suggestion created:', suggestion);
      return { success: true, suggestion };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async createSpendingIntervention(userId, decision) {
    try {
      const intervention = {
        userId,
        type: 'spending_intervention',
        title: '🚨 Spending Limit Reached',
        message: 'You\'ve reached your spending threshold. Consider pausing non-essential purchases for the rest of the period.',
        priority: 'high',
        actionable: true,
        timestamp: new Date()
      };

      console.log('Spending intervention created:', intervention);
      return { success: true, intervention };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async suggestActivities(userId, decision) {
    try {
      const activities = [
        'Add a recent transaction to keep your AI Twin updated',
        'Set a new financial goal to boost your savings',
        'Check out community Hives for group challenges'
      ];

      const suggestion = {
        userId,
        type: 'activity_suggestions',
        title: '🎯 Boost Your Financial Journey',
        activities,
        timestamp: new Date()
      };

      console.log('Activity suggestions created:', suggestion);
      return { success: true, suggestion };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = RealTimeDecisionEngine;