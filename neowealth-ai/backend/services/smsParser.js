class SMSParser {
  static parseTransactionSMS(smsText) {
    try {
      const sms = smsText.toLowerCase();
      
      // Common patterns for different banks
      const patterns = {
        amount: /(?:rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        debit: /(?:debited|paid|spent|withdrawn|debit)/i,
        credit: /(?:credited|received|deposited|credit)/i,
        merchant: /(?:at|to)\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+via|\s+using|$)/i,
        upi: /upi|paytm|phonepe|googlepay|bhim/i,
        card: /card\s*(?:ending\s*)?(\d{4})/i,
        balance: /(?:balance|bal).*?(?:rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i
      };

      const result = {
        amount: 0,
        type: 'unknown',
        merchant: null,
        method: 'unknown',
        balance: null,
        isTransaction: false
      };

      // Extract amount
      const amountMatch = sms.match(patterns.amount);
      if (amountMatch) {
        result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        result.isTransaction = true;
      }

      // Determine transaction type
      if (patterns.debit.test(sms)) {
        result.type = 'expense';
      } else if (patterns.credit.test(sms)) {
        result.type = 'income';
      }

      // Extract merchant
      const merchantMatch = sms.match(patterns.merchant);
      if (merchantMatch) {
        result.merchant = merchantMatch[1].trim();
      }

      // Determine payment method
      if (patterns.upi.test(sms)) {
        result.method = 'UPI';
      } else if (patterns.card.test(sms)) {
        result.method = 'Card';
      }

      // Extract balance
      const balanceMatch = sms.match(patterns.balance);
      if (balanceMatch) {
        result.balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      }

      return result;
    } catch (error) {
      console.error('SMS parsing error:', error);
      return { isTransaction: false, error: error.message };
    }
  }

  static categorizeTransaction(merchant, amount) {
    if (!merchant) return 'other';

    const merchant_lower = merchant.toLowerCase();
    
    const categories = {
      'food': ['zomato', 'swiggy', 'dominos', 'pizza', 'restaurant', 'cafe', 'food'],
      'transport': ['uber', 'ola', 'metro', 'bus', 'taxi', 'petrol', 'fuel'],
      'shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store'],
      'entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'bookmyshow'],
      'utilities': ['electricity', 'water', 'gas', 'internet', 'mobile', 'recharge'],
      'healthcare': ['hospital', 'pharmacy', 'doctor', 'medical', 'health'],
      'education': ['school', 'college', 'course', 'book', 'education'],
      'investment': ['mutual', 'sip', 'stock', 'gold', 'investment']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => merchant_lower.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  static async processTransactionSMS(userId, smsText) {
    try {
      const parsed = this.parseTransactionSMS(smsText);
      
      if (!parsed.isTransaction) {
        return null;
      }

      const category = this.categorizeTransaction(parsed.merchant, parsed.amount);

      return {
        userId,
        type: parsed.type,
        category,
        amount: parsed.amount,
        description: `${parsed.method} payment to ${parsed.merchant || 'Unknown'}`,
        date: new Date(),
        tags: [parsed.method.toLowerCase()],
        aiClassification: {
          confidence: 0.8,
          merchant: parsed.merchant,
          method: parsed.method,
          parsedFrom: 'SMS'
        }
      };
    } catch (error) {
      console.error('Error processing transaction SMS:', error);
      return null;
    }
  }
}

module.exports = SMSParser;