import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors } from '../styles/colors';
import ApiService from '../services/api';

const AIInsightsScreen = () => {
  const [insights, setInsights] = useState(null);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState(null);
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAIData = async () => {
    try {
      const [insightsResponse, behaviorResponse, nudgesResponse] = await Promise.all([
        ApiService.getSpendingInsights(global.userToken),
        ApiService.getBehaviorAnalysis(global.userToken),
        ApiService.getPersonalizedNudges(global.userToken),
      ]);

      if (insightsResponse.success) {
        setInsights(insightsResponse.data);
      }

      if (behaviorResponse.success) {
        setBehaviorAnalysis(behaviorResponse.data.behaviorProfile);
      }

      if (nudgesResponse.success) {
        setNudges(nudgesResponse.data.nudges || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load AI insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const optimizeGoals = async () => {
    try {
      const response = await ApiService.optimizeGoals(global.userToken);
      if (response.success) {
        Alert.alert(
          'Goals Optimized!',
          response.data.optimization.summary || 'Your goals have been optimized based on AI analysis.'
        );
        loadAIData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize goals');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAIData();
  };

  useEffect(() => {
    loadAIData();
  }, []);

  const renderInsight = (insight, index) => (
    <View key={index} style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{getInsightIcon(insight.type)}</Text>
        <View style={styles.insightTitleContainer}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightConfidence}>
            Confidence: {Math.round((insight.confidence || 0.8) * 100)}%
          </Text>
        </View>
      </View>
      <Text style={styles.insightMessage}>{insight.message}</Text>
      {insight.suggestion && (
        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionLabel}>💡 Suggestion:</Text>
          <Text style={styles.suggestionText}>{insight.suggestion}</Text>
        </View>
      )}
    </View>
  );

  const renderNudge = (nudge, index) => (
    <View key={index} style={styles.nudgeCard}>
      <View style={styles.nudgeHeader}>
        <Text style={styles.nudgeIcon}>{getNudgeIcon(nudge.type)}</Text>
        <Text style={styles.nudgeTitle}>{nudge.title}</Text>
        <View style={[styles.priorityBadge, getPriorityStyle(nudge.priority)]}>
          <Text style={styles.priorityText}>{nudge.priority}</Text>
        </View>
      </View>
      <Text style={styles.nudgeMessage}>{nudge.message}</Text>
      {nudge.actionable && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Take Action</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRiskFactor = (risk, index) => (
    <View key={index} style={styles.riskCard}>
      <View style={styles.riskHeader}>
        <Text style={styles.riskIcon}>⚠️</Text>
        <View style={styles.riskContent}>
          <Text style={styles.riskTitle}>{risk.message}</Text>
          <Text style={styles.riskAmount}>Amount: ₹{risk.amount?.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.severityBadge, getSeverityStyle(risk.severity)]}>
          <Text style={styles.severityText}>{risk.severity}</Text>
        </View>
      </View>
      <Text style={styles.riskSuggestion}>{risk.suggestion}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>AI is analyzing your financial data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Financial Twin</Text>
        <Text style={styles.headerSubtitle}>
          Personalized insights based on your spending patterns
        </Text>
      </View>

      {/* AI Optimization Button */}
      <TouchableOpacity style={styles.optimizeButton} onPress={optimizeGoals}>
        <Text style={styles.optimizeButtonIcon}>🚀</Text>
        <Text style={styles.optimizeButtonText}>Optimize My Goals</Text>
      </TouchableOpacity>

      {/* Spending Insights */}
      {insights && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Spending Analysis</Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Spending</Text>
                <Text style={styles.statValue}>
                  ₹{insights.totalSpending?.toLocaleString('en-IN') || '0'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Transactions</Text>
                <Text style={styles.statValue}>{insights.totalTransactions || 0}</Text>
              </View>
            </View>
            
            {insights.percentageChange !== undefined && (
              <View style={styles.trendContainer}>
                <Text style={styles.trendLabel}>vs Last Month:</Text>
                <Text
                  style={[
                    styles.trendValue,
                    {
                      color: insights.percentageChange > 0 ? colors.danger : colors.success,
                    },
                  ]}
                >
                  {insights.percentageChange > 0 ? '+' : ''}
                  {insights.percentageChange.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {insights.insights?.map(renderInsight)}
        </View>
      )}

      {/* Personalized Nudges */}
      {nudges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 AI Recommendations</Text>
          {nudges.map(renderNudge)}
        </View>
      )}

      {/* Risk Factors */}
      {behaviorAnalysis?.riskFactors?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Risk Alerts</Text>
          {behaviorAnalysis.riskFactors.map(renderRiskFactor)}
        </View>
      )}

      {/* Positive Habits */}
      {behaviorAnalysis?.positiveHabits?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Good Habits Detected</Text>
          {behaviorAnalysis.positiveHabits.map((habit, index) => (
            <View key={index} style={styles.habitCard}>
              <Text style={styles.habitIcon}>🎉</Text>
              <View style={styles.habitContent}>
                <Text style={styles.habitTitle}>{habit.message}</Text>
                <Text style={styles.habitReward}>Reward: +{habit.reward} NeoCoins</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI Predictions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 AI Predictions</Text>
        <View style={styles.predictionCard}>
          <Text style={styles.predictionTitle}>Next Month Forecast</Text>
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Expected Expenses:</Text>
            <Text style={styles.predictionValue}>
              ₹{((insights?.totalSpending || 0) * 1.05).toFixed(0)}
            </Text>
          </View>
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Savings Potential:</Text>
            <Text style={styles.predictionValue}>
              ₹{((insights?.totalSpending || 0) * 0.15).toFixed(0)}
            </Text>
          </View>
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Goal Achievement:</Text>
            <Text style={styles.predictionValue}>
              {behaviorAnalysis?.positiveHabits?.length > 0 ? '85%' : '65%'} likely
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const getInsightIcon = (type) => {
  const icons = {
    top_category: '📈',
    daily_average: '📊',
    weekend_alert: '🎉',
    trend_analysis: '📉',
  };
  return icons[type] || '💡';
};

const getNudgeIcon = (type) => {
  const icons = {
    warning: '⚠️',
    encouragement: '🎉',
    reminder: '🔔',
    weekend_planning: '📅',
  };
  return icons[type] || '💬';
};

const getPriorityStyle = (priority) => {
  const styles = {
    high: { backgroundColor: colors.danger },
    medium: { backgroundColor: colors.warning },
    low: { backgroundColor: colors.success },
  };
  return styles[priority] || styles.low;
};

const getSeverityStyle = (severity) => {
  const styles = {
    high: { backgroundColor: colors.danger },
    medium: { backgroundColor: colors.warning },
    low: { backgroundColor: colors.success },
  };
  return styles[severity] || styles.medium;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  optimizeButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  optimizeButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  optimizeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightTitleContainer: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  insightConfidence: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  insightMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionContainer: {
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  nudgeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nudgeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  nudgeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  nudgeMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  riskCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  riskContent: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  riskAmount: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  riskSuggestion: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  habitCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  habitReward: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  predictionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default AIInsightsScreen;