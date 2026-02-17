const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');

const getFaculties = asyncHandler(async (req, res) => {
  const faculties = await Faculty.find().sort({ facultyName: 1 }).lean();
  return res.json({ data: faculties });
});

const createFaculty = asyncHandler(async (req, res) => {
  const { facultyName, description } = req.body;

  const faculty = await Faculty.create({
    facultyName: String(facultyName).trim(),
    description: String(description || '').trim(),
  });

  return res.status(201).json({ data: faculty });
});

const updateFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid faculty id' });
  }

  const patch = {};
  if (req.body.facultyName !== undefined) patch.facultyName = String(req.body.facultyName).trim();
  if (req.body.description !== undefined) patch.description = String(req.body.description || '').trim();

  const updated = await Faculty.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: 'Faculty not found' });

  return res.json({ data: updated });
});

const deleteFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid faculty id' });
  }

  const deps = await Department.countDocuments({ facultyId: id });
  if (deps > 0) {
    return res.status(409).json({
      message: 'Cannot delete faculty with departments. Delete departments first.',
    });
  }

  const deleted = await Faculty.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'Faculty not found' });

  return res.json({ message: 'Faculty deleted' });
});

module.exports = {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};

