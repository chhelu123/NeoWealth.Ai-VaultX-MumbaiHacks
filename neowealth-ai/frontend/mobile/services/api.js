// Use the actual network IP for both web and mobile
const API_BASE_URL = 'http://192.168.0.100:4000/api';
// For testing, you can also try: 'http://localhost:4000/api'

class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (options.token) {
      config.headers.Authorization = `Bearer ${options.token}`;
    }

    try {
      console.log('API Request:', url);
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error.message);
      console.error('API URL:', url);
      throw error;
    }
  }

  static async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async getDashboard(token) {
    return this.request('/users/dashboard', {
      method: 'GET',
      token,
    });
  }

  static async getWallet(token) {
    return this.request('/wallet', {
      method: 'GET',
      token,
    });
  }

  static async claimDailyReward(token) {
    return this.request('/rewards/daily', {
      method: 'POST',
      token,
    });
  }

  static async addTransaction(token, transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      token,
      body: JSON.stringify(transactionData),
    });
  }

  // AI Services
  static async getBehaviorAnalysis(token) {
    return this.request('/ai/behavior-analysis', {
      method: 'GET',
      token,
    });
  }

  static async getPersonalizedNudges(token) {
    return this.request('/ai/nudges', {
      method: 'GET',
      token,
    });
  }

  static async optimizeGoals(token) {
    return this.request('/ai/optimize-goals', {
      method: 'POST',
      token,
    });
  }

  static async getSpendingInsights(token) {
    return this.request('/ai/spending-insights', {
      method: 'GET',
      token,
    });
  }

  static async processSMS(token, smsText, sender) {
    return this.request('/ai/process-sms', {
      method: 'POST',
      token,
      body: JSON.stringify({ smsText, sender }),
    });
  }

  // Agentic AI Services
  static async initializeAgent(token) {
    return this.request('/ai/initialize-agent', {
      method: 'POST',
      token,
    });
  }

  static async getAgentStatus(token) {
    return this.request('/ai/agent-status', {
      method: 'GET',
      token,
    });
  }

  static async triggerAIAnalysis(token) {
    return this.request('/ai/analyze-now', {
      method: 'POST',
      token,
    });
  }

  static async processRealTimeEvent(token, eventType, eventData) {
    return this.request('/ai/real-time-event', {
      method: 'POST',
      token,
      body: JSON.stringify({ eventType, eventData }),
    });
  }
}

export default ApiService;