const { User, Transaction } = require('../models');
const { Op } = require('sequelize');

class AIClassificationService {
  static async classifyTransaction(transactionText, amount, sender) {
    try {
      if (!transactionText || !amount) {
        throw new Error('Transaction text and amount are required');
      }
      
      const text = transactionText.toLowerCase().trim();
      const numAmount = parseFloat(amount);
      
      if (isNaN(numAmount)) {
        throw new Error('Invalid amount provided');
      }
      
      let category = 'other';
      let subcategory = null;
      let confidence = 0.6;
      
      // Enhanced classification with better patterns
      const patterns = {
        food: {
          keywords: ['zomato', 'swiggy', 'food', 'restaurant', 'cafe', 'dominos', 'pizza', 'burger', 'kfc', 'mcdonalds'],
          confidence: 0.95
        },
        transport: {
          keywords: ['uber', 'ola', 'metro', 'petrol', 'fuel', 'parking', 'taxi', 'bus', 'train'],
          confidence: 0.9
        },
        shopping: {
          keywords: ['amazon', 'flipkart', 'myntra', 'shopping', 'purchase', 'buy', 'order'],
          confidence: 0.85
        },
        entertainment: {
          keywords: ['netflix', 'spotify', 'movie', 'cinema', 'game', 'youtube', 'prime'],
          confidence: 0.9
        },
        utilities: {
          keywords: ['electricity', 'water', 'gas', 'internet', 'mobile', 'recharge', 'bill'],
          confidence: 0.95
        },
        healthcare: {
          keywords: ['hospital', 'medical', 'pharmacy', 'doctor', 'medicine', 'clinic'],
          confidence: 0.9
        },
        investment: {
          keywords: ['sip', 'mutual fund', 'stock', 'investment', 'zerodha', 'groww', 'equity'],
          confidence: 0.95
        },
        income: {
          keywords: ['salary', 'credited', 'bonus', 'refund', 'cashback'],
          confidence: 0.8
        }
      };
      
      // Find best matching category
      let bestMatch = { category: 'other', confidence: 0.6 };
      
      for (const [cat, pattern] of Object.entries(patterns)) {
        const matchCount = pattern.keywords.filter(keyword => text.includes(keyword)).length;
        if (matchCount > 0) {
          const matchConfidence = pattern.confidence * (matchCount / pattern.keywords.length);
          if (matchConfidence > bestMatch.confidence) {
            bestMatch = { category: cat, confidence: matchConfidence };
          }
        }
      }
      
      category = bestMatch.category;
      confidence = bestMatch.confidence;
      
      // Determine subcategory based on specific keywords
      subcategory = this.determineSubcategory(text, category);
      
      // Special handling for income detection
      if (text.includes('credited') || text.includes('salary') || numAmount > 50000) {
        category = 'income';
        subcategory = text.includes('salary') ? 'salary' : 'other_income';
        confidence = 0.85;
      }
      
      return {
        category,
        subcategory,
        confidence: Math.round(confidence * 100) / 100,
        amount: numAmount,
        description: this.generateDescription(category, subcategory, numAmount),
        tags: this.generateTags(text, category),
        riskLevel: this.assessRiskLevel(category, numAmount),
        suggestions: this.generateSuggestions(category, numAmount),
        timestamp: new Date().toISOString(),
        sender: sender || 'unknown'
      };
    } catch (error) {
      console.error('Error classifying transaction:', error);
      throw error;
    }
  }

  static determineSubcategory(text, category) {
    const subcategories = {
      food: {
        'delivery': ['zomato', 'swiggy', 'delivery'],
        'dining': ['restaurant', 'cafe', 'dine'],
        'groceries': ['grocery', 'supermarket', 'vegetables']
      },
      transport: {
        'rideshare': ['uber', 'ola', 'taxi'],
        'fuel': ['petrol', 'diesel', 'fuel'],
        'public': ['metro', 'bus', 'train']
      },
      shopping: {
        'online': ['amazon', 'flipkart', 'myntra'],
        'clothing': ['clothes', 'shirt', 'dress'],
        'electronics': ['mobile', 'laptop', 'gadget']
      },
      entertainment: {
        'streaming': ['netflix', 'spotify', 'prime'],
        'movies': ['cinema', 'movie', 'film'],
        'gaming': ['game', 'gaming', 'xbox']
      },
      utilities: {
        'electricity': ['electricity', 'power'],
        'internet': ['internet', 'wifi', 'broadband'],
        'mobile': ['mobile', 'phone', 'recharge']
      }
    };
    
    if (subcategories[category]) {
      for (const [subcat, keywords] of Object.entries(subcategories[category])) {
        if (keywords.some(keyword => text.includes(keyword))) {
          return subcat;
        }
      }
    }
    
    return null;
  }
  
  static generateDescription(category, subcategory, amount) {
    const baseDescriptions = {
      food: 'Food & Dining',
      transport: 'Transportation',
      shopping: 'Shopping',
      entertainment: 'Entertainment',
      utilities: 'Utilities',
      healthcare: 'Healthcare',
      investment: 'Investment',
      income: 'Income',
      other: 'Other'
    };
    
    let description = baseDescriptions[category] || 'Transaction';
    if (subcategory) {
      description += ` (${subcategory.replace('_', ' ')})`;
    }
    description += ` of ₹${amount.toLocaleString('en-IN')}`;
    
    return description;
  }

  static generateTags(text, category) {
    const commonTags = {
      food: ['dining', 'meal', 'hunger'],
      transport: ['travel', 'commute', 'mobility'],
      shopping: ['purchase', 'retail', 'goods'],
      entertainment: ['leisure', 'fun', 'relaxation'],
      utilities: ['essential', 'bills', 'services'],
      healthcare: ['medical', 'wellness', 'health'],
      investment: ['wealth', 'growth', 'future'],
      income: ['earnings', 'money', 'salary']
    };
    
    return commonTags[category] || ['expense'];
  }

  static assessRiskLevel(category, amount) {
    const riskThresholds = {
      food: { medium: 1500, high: 3000 },
      shopping: { medium: 3000, high: 8000 },
      entertainment: { medium: 1000, high: 3000 },
      transport: { medium: 2000, high: 5000 },
      utilities: { medium: 3000, high: 6000 },
      healthcare: { medium: 5000, high: 15000 },
      other: { medium: 2000, high: 10000 }
    };
    
    const thresholds = riskThresholds[category] || riskThresholds.other;
    
    if (amount >= thresholds.high) return 'high';
    if (amount >= thresholds.medium) return 'medium';
    return 'low';
  }

  static generateSuggestions(category, amount) {
    const suggestions = {
      food: [
        'Cook at home 3 days this week to save ₹800+',
        'Use food delivery discount codes',
        'Try bulk cooking on weekends'
      ],
      shopping: [
        'Wait 24 hours before buying items over ₹1000',
        'Compare prices on multiple platforms',
        'Check for cashback offers before purchasing'
      ],
      entertainment: [
        'Share streaming subscriptions with family',
        'Look for free events in your city',
        'Set a monthly entertainment budget of ₹2000'
      ],
      transport: [
        'Use public transport to save ₹500/week',
        'Carpool with colleagues',
        'Plan multiple errands in one trip'
      ],
      utilities: [
        'Switch to energy-efficient appliances',
        'Monitor usage to avoid bill spikes',
        'Set up auto-pay to avoid late fees'
      ],
      healthcare: [
        'Keep all medical receipts for tax benefits',
        'Consider health insurance coverage',
        'Use generic medicines when possible'
      ]
    };
    
    const baseSuggestions = suggestions[category] || ['Track this expense for better budgeting'];
    
    // Add amount-specific suggestions
    if (amount > 5000) {
      baseSuggestions.push('This is a high-value transaction - consider if it aligns with your goals');
    }
    
    return baseSuggestions.slice(0, 3); // Return max 3 suggestions
  }

  static async processSMSTransaction(smsText, sender) {
    try {
      if (!smsText) {
        throw new Error('SMS text is required');
      }
      
      // Extract transaction details from SMS
      const transactionData = this.extractTransactionFromSMS(smsText);
      
      if (!transactionData) {
        return {
          success: false,
          message: 'No transaction found in SMS',
          data: null
        };
      }
      
      // Classify the transaction
      const classification = await this.classifyTransaction(
        transactionData.description,
        transactionData.amount,
        sender
      );
      
      return {
        success: true,
        message: 'Transaction processed successfully',
        data: {
          ...transactionData,
          ...classification,
          source: 'sms',
          sender
        }
      };
    } catch (error) {
      console.error('Error processing SMS transaction:', error);
      throw error;
    }
  }
  
  static extractTransactionFromSMS(smsText) {
    try {
      const text = smsText.toLowerCase();
      
      // Common patterns for transaction SMS
      const patterns = [
        /(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?:rs\.?|inr|₹)/i,
        /amount\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /debited\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i
      ];
      
      let amount = null;
      let description = smsText;
      
      // Try to extract amount
      for (const pattern of patterns) {
        const match = smsText.match(pattern);
        if (match) {
          amount = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      
      if (!amount) {
        return null;
      }
      
      // Determine transaction type
      const isDebit = text.includes('debited') || text.includes('spent') || text.includes('paid');
      const isCredit = text.includes('credited') || text.includes('received') || text.includes('deposited');
      
      // Extract merchant/description
      const merchantPatterns = [
        /at\s+([^\s]+(?:\s+[^\s]+)*?)\s+on/i,
        /to\s+([^\s]+(?:\s+[^\s]+)*?)\s+on/i,
        /for\s+([^\s]+(?:\s+[^\s]+)*?)\s+on/i
      ];
      
      for (const pattern of merchantPatterns) {
        const match = smsText.match(pattern);
        if (match) {
          description = match[1].trim();
          break;
        }
      }
      
      return {
        amount: isCredit ? amount : -amount,
        description: description.substring(0, 100), // Limit description length
        type: isCredit ? 'credit' : 'debit',
        date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting transaction from SMS:', error);
      return null;
    }
  }

  static async generateSpendingInsights(userId) {
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
          message: 'No transactions available for insights',
          insights: []
        };
      }

      const insights = [];
      const categoryTotals = {};
      const dailySpending = {};

      // Analyze spending patterns
      transactions.forEach(transaction => {
        const category = transaction.category || 'other';
        const date = new Date(transaction.date).toDateString();
        const amount = Math.abs(parseFloat(transaction.amount));
        
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        dailySpending[date] = (dailySpending[date] || 0) + amount;
      });

      // Top spending category insight
      const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b
      );

      insights.push({
        type: 'top_category',
        title: `Highest Spending: ${topCategory.charAt(0).toUpperCase() + topCategory.slice(1)}`,
        message: `You've spent ₹${categoryTotals[topCategory].toLocaleString('en-IN')} on ${topCategory} this month`,
        confidence: 0.95,
        actionable: true,
        suggestion: `Consider setting a monthly budget limit for ${topCategory} expenses`
      });

      // Daily average insight
      const totalSpending = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      const dailyAverage = totalSpending / 30;

      insights.push({
        type: 'daily_average',
        title: 'Daily Spending Average',
        message: `Your average daily spending is ₹${dailyAverage.toFixed(0)}`,
        confidence: 0.88,
        actionable: true,
        suggestion: dailyAverage > 1000 ? 'Try to reduce daily expenses by ₹200 to improve savings' : 'Great job maintaining controlled daily spending!'
      });

      // Weekend vs weekday analysis
      const weekendSpending = transactions
        .filter(t => {
          const day = new Date(t.date).getDay();
          return day === 0 || day === 6;
        })
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

      const weekdaySpending = totalSpending - weekendSpending;
      
      if (weekendSpending > weekdaySpending * 0.4) {
        insights.push({
          type: 'weekend_alert',
          title: 'High Weekend Spending',
          message: `Weekend expenses are ₹${weekendSpending.toFixed(0)} (${((weekendSpending/totalSpending)*100).toFixed(1)}% of total)`,
          confidence: 0.82,
          actionable: true,
          suggestion: 'Set a weekend budget to control leisure spending'
        });
      }

      return {
        totalTransactions: transactions.length,
        totalSpending,
        insights
      };
    } catch (error) {
      console.error('Error generating spending insights:', error);
      throw error;
    }
  }
}

module.exports = AIClassificationService;