const { Goal } = require('../models');

const createGoal = async (req, res) => {
  try {
    const { title, description, targetAmount, targetDate, category, priority } = req.body;

    const goal = await Goal.create({
      userId: req.userId,
      title,
      description,
      targetAmount,
      targetDate,
      category,
      priority: priority || 'medium'
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: { goal }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message
    });
  }
};

const getGoals = async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const where = { userId: req.userId };
    if (status !== 'all') {
      where.status = status;
    }

    const goals = await Goal.findAll({
      where,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal.toJSON(),
      progress: Math.min((parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100, 100),
      daysRemaining: Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      data: { goals: goalsWithProgress }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goals',
      error: error.message
    });
  }
};

const getGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const goalWithProgress = {
      ...goal.toJSON(),
      progress: Math.min((parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100, 100),
      daysRemaining: Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
    };

    res.json({
      success: true,
      data: { goal: goalWithProgress }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goal',
      error: error.message
    });
  }
};

const updateGoal = async (req, res) => {
  try {
    const { title, description, targetAmount, currentAmount, targetDate, category, priority, status } = req.body;

    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.update({
      title: title || goal.title,
      description: description || goal.description,
      targetAmount: targetAmount || goal.targetAmount,
      currentAmount: currentAmount !== undefined ? currentAmount : goal.currentAmount,
      targetDate: targetDate || goal.targetDate,
      category: category || goal.category,
      priority: priority || goal.priority,
      status: status || goal.status
    });

    // Check if goal is completed
    if (parseFloat(goal.currentAmount) >= parseFloat(goal.targetAmount) && goal.status === 'active') {
      await goal.update({ status: 'completed' });
    }

    res.json({
      success: true,
      message: 'Goal updated successfully',
      data: { goal }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message
    });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.destroy();

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message
    });
  }
};

const addContribution = async (req, res) => {
  try {
    const { amount } = req.body;

    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const newAmount = parseFloat(goal.currentAmount) + parseFloat(amount);
    await goal.update({ currentAmount: newAmount });

    // Check if goal is completed
    if (newAmount >= parseFloat(goal.targetAmount)) {
      await goal.update({ status: 'completed' });
    }

    res.json({
      success: true,
      message: 'Contribution added successfully',
      data: { 
        goal,
        progress: Math.min((newAmount / parseFloat(goal.targetAmount)) * 100, 100)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add contribution',
      error: error.message
    });
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  addContribution
};