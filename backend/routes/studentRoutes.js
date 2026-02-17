const express = require('express');
const { body } = require('express-validator');
const {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  getStudentFilters,
  downloadStudentImportTemplate,
  importStudentsByClassBatch,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { uploadStudentPhoto, uploadStudentImportFile } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', listStudents);
router.get('/filters', getStudentFilters);
router.get('/import-template', downloadStudentImportTemplate);
router.post(
  '/import',
  uploadStudentImportFile,
  [
    body('facultyId').isString().trim().notEmpty().withMessage('facultyId is required'),
    body('departmentId').isString().trim().notEmpty().withMessage('departmentId is required'),
    body('classId').isString().trim().notEmpty().withMessage('classId is required'),
    body('batchId').isString().trim().notEmpty().withMessage('batchId is required'),
  ],
  validate,
  importStudentsByClassBatch
);
router.get('/:id', getStudent);

router.post(
  '/',
  uploadStudentPhoto,
  [
    body('studentId')
      .isInt({ min: 1 })
      .withMessage('studentId is required and must be a positive integer'),
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    body('gender')
      .optional()
      .isIn(['Male', 'Female'])
      .withMessage('Gender must be Male or Female'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('classId').isString().trim().notEmpty().withMessage('classId is required'),
    body('batchId').isString().trim().notEmpty().withMessage('batchId is required'),
    body('jobId').optional().isString(),
  ],
  validate,
  createStudent
);

router.put(
  '/:id',
  uploadStudentPhoto,
  [
    body('studentId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('studentId must be a positive integer'),
    body('name').optional().isString().trim().notEmpty().withMessage('Name is required'),
    body('gender')
      .optional()
      .isIn(['Male', 'Female'])
      .withMessage('Gender must be Male or Female'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('classId').optional().isString(),
    body('batchId').optional().isString(),
    body('jobId').optional().isString(),
  ],
  validate,
  updateStudent
);

router.delete('/:id', deleteStudent);
router.patch('/:id/restore', restoreStudent);

module.exports = router;
