const validateRegistration = (req, res, next) => {
  const { email, password, firstName, lastName, monthlyIncome } = req.body;
  const errors = [];

  if (!email || !email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!firstName || firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }

  if (monthlyIncome && (isNaN(monthlyIncome) || parseFloat(monthlyIncome) < 0)) {
    errors.push('Monthly income must be a valid positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateTransaction = (req, res, next) => {
  const { type, category, amount } = req.body;
  const errors = [];

  if (!type || !['income', 'expense', 'investment', 'transfer'].includes(type)) {
    errors.push('Valid transaction type is required (income, expense, investment, transfer)');
  }

  if (!category || category.trim().length < 2) {
    errors.push('Category is required');
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.push('Valid amount greater than 0 is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateGoal = (req, res, next) => {
  const { title, targetAmount, targetDate, category } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Goal title must be at least 3 characters');
  }

  if (!targetAmount || isNaN(targetAmount) || parseFloat(targetAmount) <= 0) {
    errors.push('Valid target amount greater than 0 is required');
  }

  if (!targetDate || new Date(targetDate) <= new Date()) {
    errors.push('Target date must be in the future');
  }

  if (!category || !['emergency', 'vacation', 'house', 'car', 'education', 'retirement', 'other'].includes(category)) {
    errors.push('Valid category is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateTransaction,
  validateGoal
};