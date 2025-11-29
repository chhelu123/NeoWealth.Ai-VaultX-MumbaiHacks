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

const HivesScreen = () => {
  const [hives, setHives] = useState([]);
  const [myHives, setMyHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  const loadHives = async () => {
    try {
      const response = await fetch(`http://192.168.0.100:4000/api/hives`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setHives(data.data.hives || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load hives');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyHives = async () => {
    try {
      const response = await fetch(`http://192.168.0.100:4000/api/hives/my-hives`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setMyHives(data.data.hives || []);
      }
    } catch (error) {
      console.log('Failed to load my hives');
    }
  };

  const joinHive = async (hiveId) => {
    try {
      const response = await fetch(`http://192.168.0.100:4000/api/hives/${hiveId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success!', 'You have joined the hive successfully!');
        loadHives();
        loadMyHives();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join hive');
    }
  };

  const leaveHive = async (hiveId) => {
    Alert.alert(
      'Leave Hive',
      'Are you sure you want to leave this hive?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://192.168.0.100:4000/api/hives/${hiveId}/leave`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${global.userToken}`,
                  'Content-Type': 'application/json',
                },
              });
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Success', 'You have left the hive');
                loadHives();
                loadMyHives();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to leave hive');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHives();
    loadMyHives();
  };

  useEffect(() => {
    loadHives();
    loadMyHives();
  }, []);

  const renderHive = ({ item: hive }) => {
    const isJoined = myHives.some(myHive => myHive.id === hive.id);
    
    return (
      <View style={styles.hiveCard}>
        <View style={styles.hiveHeader}>
          <Text style={styles.hiveIcon}>{getHiveIcon(hive.category)}</Text>
          <View style={styles.hiveInfo}>
            <Text style={styles.hiveName}>{hive.name}</Text>
            <Text style={styles.hiveCategory}>{hive.category}</Text>
          </View>
          <View style={styles.hiveMemberCount}>
            <Text style={styles.memberCountText}>{hive.memberCount || 0}</Text>
            <Text style={styles.memberCountLabel}>members</Text>
          </View>
        </View>
        
        <Text style={styles.hiveDescription}>{hive.description}</Text>
        
        {hive.currentChallenge && (
          <View style={styles.challengeContainer}>
            <Text style={styles.challengeTitle}>🎯 Current Challenge</Text>
            <Text style={styles.challengeText}>{hive.currentChallenge}</Text>
          </View>
        )}
        
        <View style={styles.hiveStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hive.totalSavings || 0}</Text>
            <Text style={styles.statLabel}>Total Saved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hive.avgProgress || 0}%</Text>
            <Text style={styles.statLabel}>Avg Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hive.rewardPool || 0}</Text>
            <Text style={styles.statLabel}>Reward Pool</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            isJoined ? styles.leaveButton : styles.joinButton,
          ]}
          onPress={() => isJoined ? leaveHive(hive.id) : joinHive(hive.id)}
        >
          <Text
            style={[
              styles.actionButtonText,
              isJoined ? styles.leaveButtonText : styles.joinButtonText,
            ]}
          >
            {isJoined ? 'Leave Hive' : 'Join Hive'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMyHive = ({ item: hive }) => (
    <View style={styles.myHiveCard}>
      <View style={styles.hiveHeader}>
        <Text style={styles.hiveIcon}>{getHiveIcon(hive.category)}</Text>
        <View style={styles.hiveInfo}>
          <Text style={styles.hiveName}>{hive.name}</Text>
          <Text style={styles.hiveCategory}>{hive.category}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{hive.myProgress || 0}%</Text>
        </View>
      </View>
      
      <View style={styles.myHiveStats}>
        <View style={styles.myStatItem}>
          <Text style={styles.myStatLabel}>My Contribution</Text>
          <Text style={styles.myStatValue}>₹{hive.myContribution || 0}</Text>
        </View>
        <View style={styles.myStatItem}>
          <Text style={styles.myStatLabel}>Rank</Text>
          <Text style={styles.myStatValue}>#{hive.myRank || 'N/A'}</Text>
        </View>
      </View>
      
      {hive.nextReward && (
        <View style={styles.rewardContainer}>
          <Text style={styles.rewardText}>
            🏆 Next reward: {hive.nextReward} NeoCoins
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading hive communities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐝 Community Hives</Text>
        <Text style={styles.headerSubtitle}>
          Join communities and achieve goals together
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'discover' && styles.activeTabText,
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-hives' && styles.activeTab]}
          onPress={() => setActiveTab('my-hives')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my-hives' && styles.activeTabText,
            ]}
          >
            My Hives ({myHives.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'discover' ? hives : myHives}
        renderItem={activeTab === 'discover' ? renderHive : renderMyHive}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'discover' ? 'No hives available' : 'You haven\'t joined any hives yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'discover' 
                ? 'Check back later for new communities' 
                : 'Discover and join hives to start your community journey'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const getHiveIcon = (category) => {
  const icons = {
    savings: '💰',
    investment: '📈',
    budgeting: '📊',
    debt_free: '🎯',
    emergency_fund: '🛡️',
    retirement: '🏖️',
    travel: '✈️',
    education: '🎓',
    health: '🏥',
    general: '🐝',
  };
  return icons[category] || '🐝';
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: colors.surface,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  hiveCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  hiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hiveIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  hiveInfo: {
    flex: 1,
  },
  hiveName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  hiveCategory: {
    fontSize: 14,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  hiveMemberCount: {
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  memberCountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  hiveDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  challengeContainer: {
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  challengeText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  hiveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  leaveButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinButtonText: {
    color: colors.white,
  },
  leaveButtonText: {
    color: colors.danger,
  },
  myHiveCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.hiveGreen,
  },
  progressBadge: {
    backgroundColor: colors.hiveGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  myHiveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  myStatItem: {
    alignItems: 'center',
  },
  myStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  myStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.hiveGreen,
  },
  rewardContainer: {
    backgroundColor: colors.neoCoin + '20',
    padding: 12,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HivesScreen;