const express = require('express');
const { body } = require('express-validator');
const { getBatches, createBatch, updateBatch, deleteBatch } = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getBatches);

router.post(
  '/',
  [
    body('batchName').isString().trim().notEmpty().withMessage('Batch name is required'),
    body('year').isInt({ min: 1900, max: 3000 }).withMessage('Valid year is required'),
  ],
  validate,
  createBatch
);

router.put(
  '/:id',
  [
    body('batchName').optional().isString().trim().notEmpty().withMessage('Batch name is required'),
    body('year').optional().isInt({ min: 1900, max: 3000 }).withMessage('Valid year is required'),
  ],
  validate,
  updateBatch
);

router.delete('/:id', deleteBatch);

module.exports = router;

