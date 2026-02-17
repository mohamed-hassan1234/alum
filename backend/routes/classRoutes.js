const express = require('express');
const { body } = require('express-validator');
const { getClasses, createClass, updateClass, deleteClass } = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getClasses);

router.post(
  '/',
  [
    body('className').isString().trim().notEmpty().withMessage('Class name is required'),
    body('departmentId').isString().trim().notEmpty().withMessage('departmentId is required'),
  ],
  validate,
  createClass
);

router.put(
  '/:id',
  [body('className').optional().isString().trim().notEmpty().withMessage('Class name is required')],
  validate,
  updateClass
);

router.delete('/:id', deleteClass);

module.exports = router;

