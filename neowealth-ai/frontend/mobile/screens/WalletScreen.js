import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { colors } from '../styles/colors';
import ApiService from '../services/api';

const WalletScreen = () => {
  const [walletData, setWalletData] = useState(null);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWalletData = async () => {
    try {
      const response = await ApiService.getWallet(global.userToken);
      if (response.success) {
        setWalletData(response.data.wallet);
        setRewardHistory(response.data.rewardHistory || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const claimDailyReward = async () => {
    try {
      const response = await ApiService.claimDailyReward(global.userToken);
      if (response.success) {
        Alert.alert(
          'Reward Claimed!',
          `You earned ${response.data.amount} NeoCoins!\n\n${response.data.message || ''}`
        );
        loadWalletData();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to claim reward');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const renderRewardItem = ({ item }) => (
    <View style={styles.rewardItem}>
      <View style={styles.rewardLeft}>
        <Text style={styles.rewardIcon}>{getRewardIcon(item.type)}</Text>
        <View>
          <Text style={styles.rewardTitle}>{item.title || item.type}</Text>
          <Text style={styles.rewardDescription}>
            {item.description || getRewardDescription(item.type)}
          </Text>
          <Text style={styles.rewardDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.rewardAmount}>+{item.amount}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>NeoCoin Balance</Text>
          <Text style={styles.neoCoinIcon}>🪙</Text>
        </View>
        <Text style={styles.balanceAmount}>
          {walletData?.neoCoins?.toFixed(2) || '0.00'}
        </Text>
        <Text style={styles.balanceLabel}>NeoCoins</Text>
        
        {/* Cash Equivalent */}
        <View style={styles.cashEquivalent}>
          <Text style={styles.cashLabel}>Cash Equivalent:</Text>
          <Text style={styles.cashAmount}>
            ₹{((walletData?.neoCoins || 0) * 0.1).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Daily Reward Section */}
      <View style={styles.rewardSection}>
        <TouchableOpacity
          style={[
            styles.dailyRewardButton,
            !walletData?.canClaimDailyReward && styles.dailyRewardButtonDisabled,
          ]}
          onPress={claimDailyReward}
          disabled={!walletData?.canClaimDailyReward}
        >
          <Text style={styles.dailyRewardIcon}>🎁</Text>
          <View style={styles.dailyRewardContent}>
            <Text style={styles.dailyRewardTitle}>
              {walletData?.canClaimDailyReward ? 'Claim Daily Reward' : 'Daily Reward Claimed'}
            </Text>
            <Text style={styles.dailyRewardSubtitle}>
              {walletData?.canClaimDailyReward 
                ? 'Get 10 NeoCoins for logging in today!' 
                : 'Come back tomorrow for more rewards'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Earning Opportunities */}
      <View style={styles.earningSection}>
        <Text style={styles.sectionTitle}>Earn More NeoCoins</Text>
        
        <TouchableOpacity style={styles.earningItem}>
          <Text style={styles.earningIcon}>💳</Text>
          <View style={styles.earningContent}>
            <Text style={styles.earningTitle}>Add Transactions</Text>
            <Text style={styles.earningDescription}>Earn 1-5 NeoCoins per transaction</Text>
          </View>
          <Text style={styles.earningReward}>+1-5</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.earningItem}>
          <Text style={styles.earningIcon}>🎯</Text>
          <View style={styles.earningContent}>
            <Text style={styles.earningTitle}>Complete Goals</Text>
            <Text style={styles.earningDescription}>Earn 50-200 NeoCoins per goal</Text>
          </View>
          <Text style={styles.earningReward}>+50-200</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.earningItem}>
          <Text style={styles.earningIcon}>🤖</Text>
          <View style={styles.earningContent}>
            <Text style={styles.earningTitle}>Follow AI Suggestions</Text>
            <Text style={styles.earningDescription}>Earn rewards for good financial habits</Text>
          </View>
          <Text style={styles.earningReward}>+10-25</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.earningItem}>
          <Text style={styles.earningIcon}>👥</Text>
          <View style={styles.earningContent}>
            <Text style={styles.earningTitle}>Join Hive Communities</Text>
            <Text style={styles.earningDescription}>Participate in group challenges</Text>
          </View>
          <Text style={styles.earningReward}>+15-50</Text>
        </TouchableOpacity>
      </View>

      {/* Reward History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Rewards</Text>
        
        {rewardHistory.length > 0 ? (
          <FlatList
            data={rewardHistory.slice(0, 10)}
            renderItem={renderRewardItem}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No rewards yet</Text>
            <Text style={styles.emptyHistorySubtext}>
              Start using the app to earn your first NeoCoins!
            </Text>
          </View>
        )}
      </View>

      {/* NeoCoins Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About NeoCoins</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            NeoCoins are earned by maintaining good financial habits and using AI recommendations. 
            They represent your progress towards financial wellness and can be redeemed for rewards.
          </Text>
          
          <View style={styles.infoStats}>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>1 NeoCoin</Text>
              <Text style={styles.infoStatLabel}>= ₹0.10 value</Text>
            </View>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>Daily Max</Text>
              <Text style={styles.infoStatLabel}>50 NeoCoins</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const getRewardIcon = (type) => {
  const icons = {
    daily_login: '🎁',
    transaction: '💳',
    goal_completion: '🎯',
    ai_suggestion: '🤖',
    hive_participation: '👥',
    streak_bonus: '🔥',
    achievement: '🏆',
  };
  return icons[type] || '🪙';
};

const getRewardDescription = (type) => {
  const descriptions = {
    daily_login: 'Daily login reward',
    transaction: 'Transaction added',
    goal_completion: 'Goal completed',
    ai_suggestion: 'Followed AI suggestion',
    hive_participation: 'Hive community participation',
    streak_bonus: 'Streak bonus',
    achievement: 'Achievement unlocked',
  };
  return descriptions[type] || 'Reward earned';
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
  balanceCard: {
    backgroundColor: colors.neoCoin,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
    marginRight: 8,
  },
  neoCoinIcon: {
    fontSize: 24,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 16,
  },
  cashEquivalent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cashLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginRight: 8,
  },
  cashAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  rewardSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dailyRewardButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  dailyRewardButtonDisabled: {
    backgroundColor: colors.gray3,
  },
  dailyRewardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  dailyRewardContent: {
    flex: 1,
  },
  dailyRewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  dailyRewardSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  earningSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  earningItem: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  earningIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  earningContent: {
    flex: 1,
  },
  earningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  earningDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  earningReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neoCoin,
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  rewardItem: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  rewardDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neoCoin,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoStat: {
    alignItems: 'center',
  },
  infoStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  infoStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default WalletScreen;