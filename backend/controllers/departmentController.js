const mongoose = require('mongoose');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const ClassModel = require('../models/Class');
const asyncHandler = require('../utils/asyncHandler');

const getDepartments = asyncHandler(async (req, res) => {
  const { facultyId } = req.query;
  const filter = {};
  if (facultyId) {
    if (!mongoose.isValidObjectId(facultyId)) {
      return res.status(400).json({ message: 'Invalid facultyId' });
    }
    filter.facultyId = facultyId;
  }

  const departments = await Department.find(filter)
    .populate('facultyId', 'facultyName')
    .sort({ departmentName: 1 })
    .lean();

  return res.json({ data: departments });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { departmentName, facultyId, description } = req.body;

  if (!mongoose.isValidObjectId(facultyId)) {
    return res.status(400).json({ message: 'Invalid facultyId' });
  }

  const faculty = await Faculty.findById(facultyId);
  if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

  const dep = await Department.create({
    departmentName: String(departmentName).trim(),
    facultyId,
    description: String(description || '').trim(),
  });

  return res.status(201).json({ data: dep });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid department id' });
  }

  const patch = {};
  if (req.body.departmentName !== undefined) {
    patch.departmentName = String(req.body.departmentName).trim();
  }
  if (req.body.description !== undefined) {
    patch.description = String(req.body.description || '').trim();
  }
  if (req.body.facultyId !== undefined) {
    if (!mongoose.isValidObjectId(req.body.facultyId)) {
      return res.status(400).json({ message: 'Invalid facultyId' });
    }
    patch.facultyId = req.body.facultyId;
  }

  const updated = await Department.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: 'Department not found' });

  return res.json({ data: updated });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid department id' });
  }

  const classes = await ClassModel.countDocuments({ departmentId: id });
  if (classes > 0) {
    return res.status(409).json({
      message: 'Cannot delete department with classes. Delete classes first.',
    });
  }

  const deleted = await Department.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'Department not found' });
  return res.json({ message: 'Department deleted' });
});

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
