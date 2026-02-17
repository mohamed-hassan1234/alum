const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');

const getBatches = asyncHandler(async (req, res) => {
  const batches = await Batch.find().sort({ year: -1 }).lean();
  return res.json({ data: batches });
});

const createBatch = asyncHandler(async (req, res) => {
  const { batchName, year, description } = req.body;

  const batch = await Batch.create({
    batchName: String(batchName).trim(),
    year: Number(year),
    description: String(description || '').trim(),
  });

  return res.status(201).json({ data: batch });
});

const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid batch id' });
  }

  const patch = {};
  if (req.body.batchName !== undefined) patch.batchName = String(req.body.batchName).trim();
  if (req.body.year !== undefined) patch.year = Number(req.body.year);
  if (req.body.description !== undefined) patch.description = String(req.body.description || '').trim();

  const updated = await Batch.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: 'Batch not found' });

  return res.json({ data: updated });
});

const deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid batch id' });
  }

  const students = await Student.countDocuments({ batchId: id, isDeleted: false });
  if (students > 0) {
    return res.status(409).json({
      message: 'Cannot delete batch with students. Move/delete students first.',
    });
  }

  const deleted = await Batch.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'Batch not found' });
  return res.json({ message: 'Batch deleted' });
});

module.exports = { getBatches, createBatch, updateBatch, deleteBatch };

