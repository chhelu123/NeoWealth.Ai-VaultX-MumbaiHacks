const express = require('express');
const { createGoal, getGoals, getGoal, updateGoal, deleteGoal, addContribution } = require('../controllers/goalController');
const { authenticateToken } = require('../middleware/auth');
const { validateGoal } = require('../middleware/validation');
const router = express.Router();

router.post('/', authenticateToken, validateGoal, createGoal);
router.get('/', authenticateToken, getGoals);
router.get('/:id', authenticateToken, getGoal);
router.put('/:id', authenticateToken, updateGoal);
router.delete('/:id', authenticateToken, deleteGoal);
router.post('/:id/contribute', authenticateToken, addContribution);

module.exports = router;