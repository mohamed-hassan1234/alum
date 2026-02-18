const mongoose = require('mongoose');
const ClassModel = require('../models/Class');
const Department = require('../models/Department');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');

const getClasses = asyncHandler(async (req, res) => {
  const { departmentId, facultyId } = req.query;
  const filter = {};

  if (departmentId) {
    if (!mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({ message: 'Invalid departmentId' });
    }
  }

  if (facultyId) {
    if (!mongoose.isValidObjectId(facultyId)) {
      return res.status(400).json({ message: 'Invalid facultyId' });
    }
  }

  if (departmentId && facultyId) {
    const selectedDepartment = await Department.findOne({ _id: departmentId, facultyId })
      .select('_id')
      .lean();
    if (!selectedDepartment) {
      return res.json({ data: [] });
    }
    filter.departmentId = selectedDepartment._id;
  } else if (departmentId) {
    filter.departmentId = departmentId;
  } else if (facultyId) {
    const departments = await Department.find({ facultyId }).select('_id').lean();
    filter.departmentId = { $in: departments.map((d) => d._id) };
  }

  const classes = await ClassModel.find(filter)
    .populate({
      path: 'departmentId',
      select: 'departmentName facultyId',
      populate: { path: 'facultyId', select: 'facultyName' },
    })
    .sort({ className: 1 })
    .lean();

  return res.json({ data: classes });
});

const createClass = asyncHandler(async (req, res) => {
  const { className, departmentId, description } = req.body;

  if (!mongoose.isValidObjectId(departmentId)) {
    return res.status(400).json({ message: 'Invalid departmentId' });
  }

  const dep = await Department.findById(departmentId);
  if (!dep) return res.status(404).json({ message: 'Department not found' });

  const cls = await ClassModel.create({
    className: String(className).trim(),
    departmentId,
    description: String(description || '').trim(),
  });

  return res.status(201).json({ data: cls });
});

const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid class id' });
  }

  const patch = {};
  if (req.body.className !== undefined) patch.className = String(req.body.className).trim();
  if (req.body.description !== undefined) patch.description = String(req.body.description || '').trim();
  if (req.body.departmentId !== undefined) {
    if (!mongoose.isValidObjectId(req.body.departmentId)) {
      return res.status(400).json({ message: 'Invalid departmentId' });
    }
    patch.departmentId = req.body.departmentId;
  }

  const updated = await ClassModel.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: 'Class not found' });

  return res.json({ data: updated });
});

const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid class id' });
  }

  const students = await Student.countDocuments({ classId: id, isDeleted: false });
  if (students > 0) {
    return res.status(409).json({
      message: 'Cannot delete class with students. Move/delete students first.',
    });
  }

  const deleted = await ClassModel.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'Class not found' });
  return res.json({ message: 'Class deleted' });
});

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
};
