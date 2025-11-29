const HiveService = require('../services/hiveService');
const { Hive, HiveMember } = require('../models');

const getHives = async (req, res) => {
  try {
    const hives = await Hive.findAll({
      where: { status: 'active' },
      include: [{
        model: HiveMember,
        as: 'members',
        where: { status: 'active' },
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    const hivesWithProgress = await Promise.all(
      hives.map(async (hive) => {
        return await HiveService.getHiveProgress(hive.id);
      })
    );

    res.json({
      success: true,
      data: { hives: hivesWithProgress }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hives',
      error: error.message
    });
  }
};

const getMyHive = async (req, res) => {
  try {
    const membership = await HiveMember.findOne({
      where: { userId: req.userId, status: 'active' },
      include: [{ model: Hive, as: 'hive' }]
    });

    if (!membership) {
      return res.json({
        success: true,
        data: { hive: null, membership: null }
      });
    }

    const hiveProgress = await HiveService.getHiveProgress(membership.hiveId);

    res.json({
      success: true,
      data: { 
        hive: hiveProgress,
        membership: membership
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user hive',
      error: error.message
    });
  }
};

const findMatchingHive = async (req, res) => {
  try {
    const matchingHive = await HiveService.findMatchingHive(req.userId);

    res.json({
      success: true,
      data: { 
        matchingHive: matchingHive ? await HiveService.getHiveProgress(matchingHive.id) : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to find matching hive',
      error: error.message
    });
  }
};

const joinHive = async (req, res) => {
  try {
    const { hiveId, monthlyContribution } = req.body;

    const membership = await HiveService.joinHive(req.userId, hiveId, monthlyContribution);

    res.json({
      success: true,
      message: 'Successfully joined hive',
      data: { membership }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createHive = async (req, res) => {
  try {
    const hiveData = req.body;
    const hive = await HiveService.createHive(req.userId, hiveData);

    res.status(201).json({
      success: true,
      message: 'Hive created successfully',
      data: { hive }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create hive',
      error: error.message
    });
  }
};

const leaveHive = async (req, res) => {
  try {
    const membership = await HiveMember.findOne({
      where: { userId: req.userId, status: 'active' }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'No active hive membership found'
      });
    }

    await membership.update({ status: 'left' });

    const hive = await Hive.findByPk(membership.hiveId);
    await hive.update({ currentMembers: hive.currentMembers - 1 });

    res.json({
      success: true,
      message: 'Successfully left hive'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to leave hive',
      error: error.message
    });
  }
};

module.exports = {
  getHives,
  getMyHive,
  findMatchingHive,
  joinHive,
  createHive,
  leaveHive
};