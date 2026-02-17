const express = require('express');
const { dashboard, hub } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', dashboard);
router.get('/hub', hub);

module.exports = router;

