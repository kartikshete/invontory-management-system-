const router = require('express').Router();
const { register, login, getProfile, updateProfile, registerRules, loginRules } = require('../controllers/authController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
