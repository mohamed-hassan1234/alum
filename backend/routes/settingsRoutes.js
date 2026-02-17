const express = require('express');
const { backup } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/backup', backup);

module.exports = router;

