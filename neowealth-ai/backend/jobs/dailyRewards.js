const RewardService = require('../services/rewardService');
const { User } = require('../models');

const processDailyRewards = async () => {
  try {
    console.log('🎯 Starting daily rewards processing...');
    
    const activeUsers = await User.findAll({
      where: { isActive: true }
    });

    let totalRewardsDistributed = 0;
    let usersRewarded = 0;

    for (const user of activeUsers) {
      try {
        const reward = await RewardService.awardDailyReward(user.id);
        if (reward > 0) {
          totalRewardsDistributed += reward;
          usersRewarded++;
        }
      } catch (error) {
        console.error(`Error processing reward for user ${user.id}:`, error);
      }
    }

    console.log(`✅ Daily rewards completed: ${usersRewarded} users rewarded, ${totalRewardsDistributed} NeoCoins distributed`);
    
    return {
      usersProcessed: activeUsers.length,
      usersRewarded,
      totalRewardsDistributed
    };
  } catch (error) {
    console.error('❌ Daily rewards job failed:', error);
    throw error;
  }
};

module.exports = { processDailyRewards };