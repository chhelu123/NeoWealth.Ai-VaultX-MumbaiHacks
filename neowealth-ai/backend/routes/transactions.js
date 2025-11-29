const express = require('express');
const { createTransaction, getTransactions, getTransaction, updateTransaction, deleteTransaction, getAnalytics } = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validation');
const router = express.Router();

router.post('/', authenticateToken, validateTransaction, createTransaction);
router.get('/', authenticateToken, getTransactions);
router.get('/analytics', authenticateToken, getAnalytics);
router.get('/:id', authenticateToken, getTransaction);
router.put('/:id', authenticateToken, updateTransaction);
router.delete('/:id', authenticateToken, deleteTransaction);

module.exports = router;