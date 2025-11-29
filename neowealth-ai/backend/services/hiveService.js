const { Hive, HiveMember, User } = require('../models');
const { Op } = require('sequelize');

class HiveService {
  static async findMatchingHive(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return null;

      // Find hives with similar characteristics
      const matchingHives = await Hive.findAll({
        where: {
          status: 'active',
          currentMembers: { [Op.lt]: sequelize.col('maxMembers') },
          riskLevel: user.riskTolerance || 'medium'
        },
        include: [{
          model: HiveMember,
          as: 'members',
          include: [{ model: User, as: 'user' }]
        }],
        order: [['createdAt', 'DESC']]
      });

      // Simple matching logic - can be enhanced with ML
      for (const hive of matchingHives) {
        const avgIncome = hive.members.reduce((sum, member) => 
          sum + parseFloat(member.user.monthlyIncome || 0), 0) / hive.members.length;
        
        const userIncome = parseFloat(user.monthlyIncome || 0);
        const incomeMatch = Math.abs(avgIncome - userIncome) / avgIncome < 0.5; // 50% tolerance
        
        if (incomeMatch) {
          return hive;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding matching hive:', error);
      return null;
    }
  }

  static async joinHive(userId, hiveId, monthlyContribution) {
    try {
      const hive = await Hive.findByPk(hiveId);
      if (!hive || hive.currentMembers >= hive.maxMembers) {
        throw new Error('Hive is full or not found');
      }

      // Check if user is already in a hive
      const existingMembership = await HiveMember.findOne({
        where: { userId, status: 'active' }
      });

      if (existingMembership) {
        throw new Error('User is already in an active hive');
      }

      const membership = await HiveMember.create({
        userId,
        hiveId,
        monthlyContribution
      });

      await hive.update({
        currentMembers: hive.currentMembers + 1
      });

      return membership;
    } catch (error) {
      console.error('Error joining hive:', error);
      throw error;
    }
  }

  static async createHive(creatorId, hiveData) {
    try {
      const hive = await Hive.create(hiveData);

      // Add creator as admin
      await HiveMember.create({
        userId: creatorId,
        hiveId: hive.id,
        role: 'admin',
        monthlyContribution: hiveData.monthlyContribution
      });

      await hive.update({ currentMembers: 1 });

      return hive;
    } catch (error) {
      console.error('Error creating hive:', error);
      throw error;
    }
  }

  static async getHiveProgress(hiveId) {
    try {
      const hive = await Hive.findByPk(hiveId, {
        include: [{
          model: HiveMember,
          as: 'members',
          where: { status: 'active' },
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
        }]
      });

      if (!hive) return null;

      const progress = (parseFloat(hive.currentAmount) / parseFloat(hive.targetAmount)) * 100;
      const monthsRemaining = Math.ceil((new Date(hive.endDate) - new Date()) / (1000 * 60 * 60 * 24 * 30));
      
      const totalMonthlyContribution = hive.members.reduce((sum, member) => 
        sum + parseFloat(member.monthlyContribution), 0);

      return {
        ...hive.toJSON(),
        progress: Math.min(progress, 100),
        monthsRemaining,
        totalMonthlyContribution,
        projectedCompletion: totalMonthlyContribution > 0 ? 
          (parseFloat(hive.targetAmount) - parseFloat(hive.currentAmount)) / totalMonthlyContribution : null
      };
    } catch (error) {
      console.error('Error getting hive progress:', error);
      return null;
    }
  }
}

module.exports = HiveService;