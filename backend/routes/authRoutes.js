const express = require('express');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 120 })
      .withMessage('Name is too long'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isString()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', protect, me);

module.exports = router;

