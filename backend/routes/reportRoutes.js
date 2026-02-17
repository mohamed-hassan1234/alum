const express = require('express');
const { exportStudents } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/students', exportStudents);

module.exports = router;

