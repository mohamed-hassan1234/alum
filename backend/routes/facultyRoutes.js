const express = require('express');
const { body } = require('express-validator');
const {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/facultyController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getFaculties);

router.post(
  '/',
  [body('facultyName').isString().trim().notEmpty().withMessage('Faculty name is required')],
  validate,
  createFaculty
);

router.put(
  '/:id',
  [body('facultyName').optional().isString().trim().notEmpty().withMessage('Faculty name is required')],
  validate,
  updateFaculty
);

router.delete('/:id', deleteFaculty);

module.exports = router;

