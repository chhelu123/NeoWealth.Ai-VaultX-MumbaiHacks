import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../styles/colors';
import ApiService from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await ApiService.getDashboard(global.userToken);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const claimDailyReward = async () => {
    try {
      const response = await ApiService.claimDailyReward(global.userToken);
      if (response.success) {
        Alert.alert('Reward Claimed!', `You earned ${response.data.amount} NeoCoins!`);
        loadDashboard();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to claim reward');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your financial data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Good {getTimeOfDay()}, {global.userData?.name || 'User'}!</Text>
        <Text style={styles.subtitle}>Your AI Financial Twin is analyzing...</Text>
      </View>

      {/* Balance Overview */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>
          ₹{dashboardData?.totalBalance?.toLocaleString('en-IN') || '0'}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Income</Text>
            <Text style={[styles.balanceItemValue, { color: colors.success }]}>
              +₹{dashboardData?.monthlyIncome?.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Expenses</Text>
            <Text style={[styles.balanceItemValue, { color: colors.danger }]}>
              -₹{dashboardData?.monthlyExpenses?.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
        </View>
      </View>

      {/* NeoCoin Wallet */}
      <TouchableOpacity style={styles.neoCoinCard} onPress={() => navigation.navigate('Wallet')}>
        <View style={styles.neoCoinHeader}>
          <Text style={styles.neoCoinTitle}>🪙 NeoCoin Wallet</Text>
          <Text style={styles.neoCoinBalance}>{dashboardData?.neoCoins || 0}</Text>
        </View>
        <Text style={styles.neoCoinSubtitle}>Tap to view rewards & transactions</Text>
      </TouchableOpacity>

      {/* Daily Reward */}
      {dashboardData?.canClaimDailyReward && (
        <TouchableOpacity style={styles.rewardCard} onPress={claimDailyReward}>
          <Text style={styles.rewardIcon}>🎁</Text>
          <Text style={styles.rewardTitle}>Daily Reward Available!</Text>
          <Text style={styles.rewardSubtitle}>Claim your 10 NeoCoins</Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Goals')}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionText}>Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AIInsights')}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionText}>AI Insights</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {dashboardData?.recentTransactions?.length > 0 ? (
          dashboardData.recentTransactions.slice(0, 3).map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionCategory}>
                  {getCategoryIcon(transaction.category)}
                </Text>
                <View>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color: transaction.amount > 0 ? colors.success : colors.danger,
                  },
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No recent transactions</Text>
        )}
      </View>
    </ScrollView>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const getCategoryIcon = (category) => {
  const icons = {
    food: '🍽️',
    transport: '🚗',
    shopping: '🛒',
    entertainment: '🎬',
    utilities: '💡',
    healthcare: '🏥',
    investment: '📈',
    income: '💰',
    other: '📝',
  };
  return icons[category] || '📝';
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
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  neoCoinCard: {
    backgroundColor: colors.neoCoin,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  neoCoinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  neoCoinTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  neoCoinBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  neoCoinSubtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
  },
  rewardCard: {
    backgroundColor: colors.success,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  rewardSubtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: colors.surface,
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionCategory: {
    fontSize: 20,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DashboardScreen;