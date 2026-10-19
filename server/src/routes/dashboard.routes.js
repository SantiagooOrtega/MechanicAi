const { Router } = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticate, DashboardController.summary);

module.exports = router;
