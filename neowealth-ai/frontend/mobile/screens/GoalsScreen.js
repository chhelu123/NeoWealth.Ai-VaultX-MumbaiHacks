import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { colors } from '../styles/colors';
import ApiService from '../services/api';

const GoalsScreen = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    category: 'savings',
    deadline: '',
  });

  const loadGoals = async () => {
    try {
      const response = await fetch(`${ApiService.API_BASE_URL.replace('/api', '')}/api/goals`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setGoals(data.data.goals || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${ApiService.API_BASE_URL.replace('/api', '')}/api/goals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newGoal.title,
          targetAmount: parseFloat(newGoal.targetAmount),
          category: newGoal.category,
          deadline: newGoal.deadline || null,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Goal created successfully!');
        setShowAddModal(false);
        setNewGoal({ title: '', targetAmount: '', category: 'savings', deadline: '' });
        loadGoals();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const updateGoalProgress = async (goalId, amount) => {
    try {
      const response = await fetch(`${ApiService.API_BASE_URL.replace('/api', '')}/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Progress updated!');
        loadGoals();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const optimizeGoals = async () => {
    try {
      const response = await ApiService.optimizeGoals(global.userToken);
      if (response.success) {
        Alert.alert(
          'AI Optimization Complete!',
          response.data.optimization.summary || 'Your goals have been optimized based on your spending patterns.'
        );
        loadGoals();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize goals');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGoals();
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const renderGoal = (goal) => {
    const progress = goal.currentAmount / goal.targetAmount;
    const progressPercentage = Math.min(progress * 100, 100);
    const isCompleted = progress >= 1;
    
    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalCategory}>{goal.category}</Text>
        </View>
        
        <View style={styles.goalProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: isCompleted ? colors.success : colors.primary 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progressPercentage.toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.goalAmounts}>
          <Text style={styles.currentAmount}>
            ₹{goal.currentAmount?.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.targetAmount}>
            / ₹{goal.targetAmount?.toLocaleString('en-IN')}
          </Text>
        </View>
        
        {goal.deadline && (
          <Text style={styles.deadline}>
            Deadline: {new Date(goal.deadline).toLocaleDateString()}
          </Text>
        )}
        
        {!isCompleted && (
          <TouchableOpacity
            style={styles.addProgressButton}
            onPress={() => {
              Alert.prompt(
                'Add Progress',
                'Enter amount to add to this goal:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Add',
                    onPress: (amount) => {
                      if (amount && !isNaN(parseFloat(amount))) {
                        updateGoalProgress(goal.id, amount);
                      }
                    },
                  },
                ],
                'numeric'
              );
            }}
          >
            <Text style={styles.addProgressButtonText}>+ Add Progress</Text>
          </TouchableOpacity>
        )}
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>🎉 Goal Completed!</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Goals</Text>
          <Text style={styles.headerSubtitle}>Track your progress towards financial freedom</Text>
        </View>

        {/* AI Optimization Button */}
        <TouchableOpacity style={styles.optimizeButton} onPress={optimizeGoals}>
          <Text style={styles.optimizeButtonIcon}>🤖</Text>
          <Text style={styles.optimizeButtonText}>AI Goal Optimization</Text>
        </TouchableOpacity>

        {/* Goals List */}
        {goals.length > 0 ? (
          goals.map(renderGoal)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first financial goal to get started
            </Text>
          </View>
        )}

        {/* Add Goal Button */}
        <TouchableOpacity
          style={styles.addGoalButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addGoalButtonText}>+ Create New Goal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Goal</Text>
            <TouchableOpacity onPress={createGoal}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                placeholder="e.g., Emergency Fund, Vacation, New Car"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.targetAmount}
                onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
                placeholder="Enter amount in ₹"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {['savings', 'investment', 'purchase', 'emergency', 'travel'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      newGoal.category === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => setNewGoal({ ...newGoal, category })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        newGoal.category === category && styles.categoryButtonTextActive,
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deadline (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.deadline}
                onChangeText={(text) => setNewGoal({ ...newGoal, deadline: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
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
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  goalCategory: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray5,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  targetAmount: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  deadline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  addProgressButton: {
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addProgressButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
  addGoalButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addGoalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray5,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSaveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray5,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray5,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: colors.white,
  },
});

export default GoalsScreen;