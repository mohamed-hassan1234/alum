const express = require('express');
const { body } = require('express-validator');
const { getJobs, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getJobs);

router.post(
  '/',
  [body('jobName').isString().trim().notEmpty().withMessage('Job name is required')],
  validate,
  createJob
);

router.put(
  '/:id',
  [body('jobName').optional().isString().trim().notEmpty().withMessage('Job name is required')],
  validate,
  updateJob
);

router.delete('/:id', deleteJob);

module.exports = router;

