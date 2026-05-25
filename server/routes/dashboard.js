const router = require('express').Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const protect = require('../middleware/auth');

router.get('/', protect, getDashboardStats);

module.exports = router;
