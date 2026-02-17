const express = require('express');
const { body } = require('express-validator');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getDepartments);

router.post(
  '/',
  [
    body('departmentName')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Department name is required'),
    body('facultyId').isString().trim().notEmpty().withMessage('facultyId is required'),
  ],
  validate,
  createDepartment
);

router.put(
  '/:id',
  [
    body('departmentName')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Department name is required'),
    body('facultyId').optional().isString().trim().notEmpty().withMessage('facultyId is required'),
  ],
  validate,
  updateDepartment
);

router.delete('/:id', deleteDepartment);

module.exports = router;

