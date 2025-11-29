const express = require('express');
const { register, login, refreshToken } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

module.exports = router;