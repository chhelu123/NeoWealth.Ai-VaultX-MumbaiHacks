const { User, Transaction, Goal, Wallet } = require('../models');
const { Op } = require('sequelize');
const HabitEnforcerService = require('./habitEnforcerService');
const DynamicGoalService = require('./dynamicGoalService');
const RewardService = require('./rewardService');

class PersonalAgentService {
  static async initializeAgent(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      // Create user's personal AI agent profile
      const agent = {
        userId,
        personality: await this.generateAgentPersonality(userId),
        decisionHistory: [],
        learningData: await this.initializeLearningData(userId),
        lastAnalysis: null,
        autonomousMode: true
      };

      // Start autonomous monitoring
      await this.startAutonomousMonitoring(userId);
      
      return agent;
    } catch (error) {
      console.error('Error initializing agent:', error);
      throw error;
    }
  }

  static async generateAgentPersonality(userId) {
    try {
      const transactions = await Transaction.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      if (transactions.length === 0) {
        return {
          type: 'cautious_advisor',
          traits: ['conservative', 'educational', 'supportive'],
          communicationStyle: 'encouraging'
        };
      }

      // Analyze spending patterns to determine personality
      const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      const avgTransaction = totalSpent / transactions.length;
      const categories = [...new Set(transactions.map(t => t.category))];

      let personality = {
        type: 'balanced_advisor',
        traits: ['analytical', 'proactive'],
        communicationStyle: 'direct'
      };

      if (avgTransaction > 2000) {
        personality.type = 'wealth_optimizer';
        personality.traits.push('ambitious', 'investment_focused');
      } else if (avgTransaction < 500) {
        personality.type = 'budget_guardian';
        personality.traits.push('frugal', 'savings_focused');
      }

      if (categories.includes('investment')) {
        personality.traits.push('growth_oriented');
      }

      return personality;
    } catch (error) {
      console.error('Error generating personality:', error);
      return { type: 'cautious_advisor', traits: ['supportive'], communicationStyle: 'encouraging' };
    }
  }

  static async initializeLearningData(userId) {
    try {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const recentData = await Transaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: last30Days }
        }
      });

      return {
        baselineSpending: recentData.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0),
        spendingPatterns: this.extractSpendingPatterns(recentData),
        decisionAccuracy: 0.7, // Initial accuracy
        userResponseRate: 0.0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error initializing learning data:', error);
      return { baselineSpending: 0, spendingPatterns: {}, decisionAccuracy: 0.7 };
    }
  }

  static extractSpendingPatterns(transactions) {
    const patterns = {
      weekdaySpending: 0,
      weekendSpending: 0,
      morningSpending: 0,
      eveningSpending: 0,
      categoryFrequency: {}
    };

    transactions.forEach(transaction => {
      const date = new Date(transaction.date || transaction.createdAt);
      const amount = Math.abs(parseFloat(transaction.amount));
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      // Weekend vs weekday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        patterns.weekendSpending += amount;
      } else {
        patterns.weekdaySpending += amount;
      }

      // Time of day
      if (hour < 12) {
        patterns.morningSpending += amount;
      } else {
        patterns.eveningSpending += amount;
      }

      // Category frequency
      patterns.categoryFrequency[transaction.category] = 
        (patterns.categoryFrequency[transaction.category] || 0) + 1;
    });

    return patterns;
  }

  static async startAutonomousMonitoring(userId) {
    // Run autonomous analysis every 6 hours
    setInterval(async () => {
      try {
        await this.performAutonomousAnalysis(userId);
      } catch (error) {
        console.error(`Autonomous analysis failed for user ${userId}:`, error);
      }
    }, 21600000); // 6 hours
  }

  static async performAutonomousAnalysis(userId) {
    try {
      console.log(`🤖 Running autonomous analysis for user ${userId}`);

      // Get current financial state
      const currentState = await this.getCurrentFinancialState(userId);
      
      // Make autonomous decisions
      const decisions = await this.makeAutonomousDecisions(userId, currentState);
      
      // Execute decisions
      const results = await this.executeDecisions(userId, decisions);
      
      // Learn from results
      await this.updateLearningData(userId, decisions, results);

      console.log(`✅ Autonomous analysis completed for user ${userId}. Made ${decisions.length} decisions.`);
      
      return { decisions, results };
    } catch (error) {
      console.error('Error in autonomous analysis:', error);
      throw error;
    }
  }

  static async getCurrentFinancialState(userId) {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const [recentTransactions, activeGoals, wallet] = await Promise.all([
        Transaction.findAll({
          where: {
            userId,
            createdAt: { [Op.gte]: last7Days }
          },
          order: [['createdAt', 'DESC']]
        }),
        Goal.findAll({
          where: { userId, status: 'active' }
        }),
        Wallet.findOne({ where: { userId } })
      ]);

      const weeklySpending = recentTransactions
        .filter(t => parseFloat(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

      return {
        weeklySpending,
        transactionCount: recentTransactions.length,
        activeGoalsCount: activeGoals.length,
        neoCoins: wallet?.neoCoins || 0,
        lastTransactionDate: recentTransactions[0]?.createdAt || null,
        spendingTrend: await this.calculateSpendingTrend(userId)
      };
    } catch (error) {
      console.error('Error getting financial state:', error);
      return { weeklySpending: 0, transactionCount: 0, activeGoalsCount: 0, neoCoins: 0 };
    }
  }

  static async calculateSpendingTrend(userId) {
    try {
      const last14Days = new Date();
      last14Days.setDate(last14Days.getDate() - 14);
      
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const [thisWeek, lastWeek] = await Promise.all([
        Transaction.findAll({
          where: {
            userId,
            createdAt: { [Op.gte]: last7Days },
            amount: { [Op.lt]: 0 }
          }
        }),
        Transaction.findAll({
          where: {
            userId,
            createdAt: { 
              [Op.gte]: last14Days,
              [Op.lt]: last7Days
            },
            amount: { [Op.lt]: 0 }
          }
        })
      ]);

      const thisWeekSpending = thisWeek.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      const lastWeekSpending = lastWeek.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

      if (lastWeekSpending === 0) return 'stable';
      
      const change = ((thisWeekSpending - lastWeekSpending) / lastWeekSpending) * 100;
      
      if (change > 20) return 'increasing';
      if (change < -20) return 'decreasing';
      return 'stable';
    } catch (error) {
      console.error('Error calculating spending trend:', error);
      return 'stable';
    }
  }

  static async makeAutonomousDecisions(userId, currentState) {
    const decisions = [];

    try {
      // Decision 1: Spending trend intervention
      if (currentState.spendingTrend === 'increasing' && currentState.weeklySpending > 3000) {
        decisions.push({
          type: 'spending_alert',
          priority: 'high',
          action: 'create_spending_alert',
          reasoning: 'Spending increased significantly this week',
          data: { weeklySpending: currentState.weeklySpending }
        });
      }

      // Decision 2: Goal optimization
      if (currentState.activeGoalsCount > 0) {
        decisions.push({
          type: 'goal_optimization',
          priority: 'medium',
          action: 'optimize_goals',
          reasoning: 'Regular goal optimization based on spending patterns',
          data: { goalsCount: currentState.activeGoalsCount }
        });
      }

      // Decision 3: Reward opportunities
      if (currentState.transactionCount >= 5 && currentState.neoCoins < 100) {
        decisions.push({
          type: 'reward_opportunity',
          priority: 'low',
          action: 'suggest_reward_activities',
          reasoning: 'User is active but has low NeoCoin balance',
          data: { currentNeoCoins: currentState.neoCoins }
        });
      }

      // Decision 4: Inactivity intervention
      if (currentState.transactionCount === 0 && currentState.lastTransactionDate) {
        const daysSinceLastTransaction = Math.floor(
          (new Date() - new Date(currentState.lastTransactionDate)) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastTransaction > 3) {
          decisions.push({
            type: 'engagement_nudge',
            priority: 'medium',
            action: 'send_engagement_nudge',
            reasoning: 'User has been inactive for several days',
            data: { daysSinceLastTransaction }
          });
        }
      }

      return decisions;
    } catch (error) {
      console.error('Error making autonomous decisions:', error);
      return [];
    }
  }

  static async executeDecisions(userId, decisions) {
    const results = [];

    for (const decision of decisions) {
      try {
        let result = null;

        switch (decision.action) {
          case 'create_spending_alert':
            result = await this.createSpendingAlert(userId, decision.data);
            break;
          
          case 'optimize_goals':
            result = await DynamicGoalService.optimizeUserGoals(userId);
            break;
          
          case 'suggest_reward_activities':
            result = await this.suggestRewardActivities(userId, decision.data);
            break;
          
          case 'send_engagement_nudge':
            result = await this.sendEngagementNudge(userId, decision.data);
            break;
          
          default:
            result = { success: false, message: 'Unknown action' };
        }

        results.push({
          decision: decision.type,
          success: result?.success || false,
          result
        });

      } catch (error) {
        console.error(`Error executing decision ${decision.type}:`, error);
        results.push({
          decision: decision.type,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  static async createSpendingAlert(userId, data) {
    try {
      // Create a personalized spending alert
      const alert = {
        userId,
        type: 'spending_alert',
        title: '⚠️ Spending Alert',
        message: `Your spending this week (₹${data.weeklySpending.toLocaleString('en-IN')}) is higher than usual. Consider reviewing your recent transactions.`,
        priority: 'high',
        actionable: true,
        createdAt: new Date()
      };

      // In a real implementation, save to notifications table
      console.log('Created spending alert:', alert);
      
      return { success: true, alert };
    } catch (error) {
      console.error('Error creating spending alert:', error);
      return { success: false, error: error.message };
    }
  }

  static async suggestRewardActivities(userId, data) {
    try {
      const suggestions = [
        'Add 3 more transactions to earn bonus NeoCoins',
        'Set a new financial goal to earn 50 NeoCoins',
        'Join a Hive community for group rewards'
      ];

      return {
        success: true,
        suggestions,
        currentNeoCoins: data.currentNeoCoins
      };
    } catch (error) {
      console.error('Error suggesting reward activities:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendEngagementNudge(userId, data) {
    try {
      const nudge = {
        userId,
        type: 'engagement_nudge',
        title: '👋 We miss you!',
        message: `It's been ${data.daysSinceLastTransaction} days since your last transaction. Add a transaction to keep your AI Twin learning about your habits.`,
        priority: 'medium',
        actionable: true,
        createdAt: new Date()
      };

      console.log('Created engagement nudge:', nudge);
      
      return { success: true, nudge };
    } catch (error) {
      console.error('Error sending engagement nudge:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateLearningData(userId, decisions, results) {
    try {
      const successfulDecisions = results.filter(r => r.success).length;
      const totalDecisions = decisions.length;
      
      if (totalDecisions > 0) {
        const currentAccuracy = successfulDecisions / totalDecisions;
        
        // Update learning data (in real implementation, save to database)
        console.log(`Updated learning data for user ${userId}: ${successfulDecisions}/${totalDecisions} decisions successful`);
        
        return { accuracy: currentAccuracy, decisionsCount: totalDecisions };
      }
      
      return null;
    } catch (error) {
      console.error('Error updating learning data:', error);
      return null;
    }
  }

  static async getAgentStatus(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      // Get recent autonomous actions (in real implementation, from database)
      const recentActions = await this.getRecentAutonomousActions(userId);
      
      return {
        agentActive: true,
        lastAnalysis: new Date(),
        recentActions: recentActions.length,
        personality: await this.generateAgentPersonality(userId),
        nextAnalysis: new Date(Date.now() + 21600000) // 6 hours from now
      };
    } catch (error) {
      console.error('Error getting agent status:', error);
      throw error;
    }
  }

  static async getRecentAutonomousActions(userId) {
    // In real implementation, query from database
    // For now, return empty array
    return [];
  }
}

module.exports = PersonalAgentService;