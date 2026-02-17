const mongoose = require('mongoose');
const Job = require('../models/Job');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');

const getJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find().sort({ jobName: 1 }).lean();
  return res.json({ data: jobs });
});

const createJob = asyncHandler(async (req, res) => {
  const { jobName, description } = req.body;

  const job = await Job.create({
    jobName: String(jobName).trim(),
    description: String(description || '').trim(),
  });

  return res.status(201).json({ data: job });
});

const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid job id' });
  }

  const patch = {};
  if (req.body.jobName !== undefined) patch.jobName = String(req.body.jobName).trim();
  if (req.body.description !== undefined) patch.description = String(req.body.description || '').trim();

  const updated = await Job.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: 'Job not found' });

  return res.json({ data: updated });
});

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid job id' });
  }

  const students = await Student.countDocuments({ jobId: id, isDeleted: false });
  if (students > 0) {
    return res.status(409).json({
      message: 'Cannot delete job that is assigned to students. Update students first.',
    });
  }

  const deleted = await Job.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'Job not found' });
  return res.json({ message: 'Job deleted' });
});

module.exports = { getJobs, createJob, updateJob, deleteJob };

