import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { colors } from '../styles/colors';

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [permissions, setPermissions] = useState({
    sms: false,
    notifications: false,
  });

  const requestSMSPermission = async () => {
    console.log('Button clicked - requestSMSPermission called');
    try {
      if (Platform.OS === 'android') {
        console.log('Android platform detected');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission',
            message: 'NeoWealth.AI needs access to your SMS to automatically detect bank transactions and provide AI-powered financial insights.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        console.log('Permission result:', granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissions(prev => ({ ...prev, sms: true }));
          Alert.alert('Success!', '🤖 Your AI Financial Twin is now active!\n\nI\'ll automatically analyze your bank SMS messages to:\n• Track expenses & income\n• Categorize transactions\n• Detect spending patterns\n• Award NeoCoins for good habits\n• Provide personalized insights');
          setStep(2);
        } else {
          Alert.alert('Permission Required', 'SMS access is required for automatic transaction detection. You can enable it later in settings.');
        }
      } else {
        // iOS or Expo Go simulation
        console.log('iOS/Expo Go - simulating permission grant');
        setPermissions(prev => ({ ...prev, sms: true }));
        Alert.alert('Success!', '🤖 Your AI Financial Twin is now active!', [
          { text: 'OK', onPress: () => setStep(2) }
        ]);
      }
    } catch (err) {
      console.error('Error in requestSMSPermission:', err);
      Alert.alert('Error', 'Something went wrong. Moving to next step.', [
        { text: 'OK', onPress: () => setStep(2) }
      ]);
    }
  };

  const enableNotifications = () => {
    setPermissions(prev => ({ ...prev, notifications: true }));
    Alert.alert('Notifications Enabled!', '🔔 You\'ll receive:\n• Smart spending alerts\n• Goal progress updates\n• NeoCoin rewards\n• AI coaching tips\n• Hive community updates');
    setStep(3);
  };

  const completeOnboarding = () => {
    global.onboardingComplete = true;
    navigation.replace('Main');
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepNumber}>Step 1 of 3</Text>
      <Text style={styles.emoji}>🤖</Text>
      <Text style={styles.title}>Meet Your AI Financial Twin</Text>
      <Text style={styles.description}>
        Your personal AI agent that learns your spending habits, predicts financial risks, and helps you build wealth automatically.
      </Text>
      
      <View style={styles.featureList}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📱</Text>
          <Text style={styles.featureText}>Reads bank SMS automatically</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🧠</Text>
          <Text style={styles.featureText}>AI categorizes every transaction</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🎯</Text>
          <Text style={styles.featureText}>Predicts and prevents overspending</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🪙</Text>
          <Text style={styles.featureText}>Rewards good financial behavior</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={() => {
          console.log('BUTTON PRESSED!');
          setStep(2);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryButtonText}>🚀 Activate AI Twin</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepNumber}>Step 2 of 3</Text>
      <Text style={styles.emoji}>🔔</Text>
      <Text style={styles.title}>Smart Notifications</Text>
      <Text style={styles.description}>
        Get personalized alerts and coaching from your AI twin to stay on track with your financial goals.
      </Text>

      <View style={styles.featureList}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>⚡</Text>
          <Text style={styles.featureText}>Real-time spending alerts</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🎯</Text>
          <Text style={styles.featureText}>Goal progress updates</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>💡</Text>
          <Text style={styles.featureText}>AI coaching tips</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🏆</Text>
          <Text style={styles.featureText}>Achievement celebrations</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={enableNotifications}>
        <Text style={styles.primaryButtonText}>Enable Notifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(3)}>
        <Text style={styles.secondaryButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepNumber}>Step 3 of 3</Text>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.description}>
        Your AI Financial Twin is ready to help you build wealth. Here's what happens next:
      </Text>

      <View style={styles.featureList}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureText}>AI analyzes your spending patterns</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🎯</Text>
          <Text style={styles.featureText}>Creates personalized goals</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={styles.featureText}>Matches you with Hive communities</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🪙</Text>
          <Text style={styles.featureText}>Starts earning you NeoCoins</Text>
        </View>
      </View>

      <View style={styles.rewardCard}>
        <Text style={styles.rewardTitle}>🎁 Welcome Bonus</Text>
        <Text style={styles.rewardAmount}>100 NeoCoins</Text>
        <Text style={styles.rewardDescription}>For completing onboarding!</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={completeOnboarding}>
        <Text style={styles.primaryButtonText}>Start Building Wealth 🚀</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  rewardCard: {
    backgroundColor: colors.neoCoin,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  rewardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

export default OnboardingScreen;