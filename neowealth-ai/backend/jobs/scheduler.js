const { processDailyRewards } = require('./dailyRewards');

class JobScheduler {
  static start() {
    console.log('🚀 Starting job scheduler...');
    
    // Run daily rewards every 24 hours (in production, use cron)
    setInterval(async () => {
      try {
        await processDailyRewards();
      } catch (error) {
        console.error('Daily rewards job failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run initial daily rewards after 1 minute
    setTimeout(async () => {
      try {
        await processDailyRewards();
      } catch (error) {
        console.error('Initial daily rewards failed:', error);
      }
    }, 60 * 1000); // 1 minute

    console.log('✅ Job scheduler started');
  }
}

module.exports = JobScheduler;