const express = require('express');
const { body } = require('express-validator');
const { getMe, updateMe, changePassword } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAdminPhoto } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);

router.put(
  '/me',
  uploadAdminPhoto,
  [
    body('name').optional().isString().trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  validate,
  updateMe
);

router.put(
  '/change-password',
  [
    body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isString()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
