const Admin = require('../models/Admin');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const ClassModel = require('../models/Class');
const Batch = require('../models/Batch');
const Job = require('../models/Job');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');

const backup = asyncHandler(async (req, res) => {
  const [admins, faculties, departments, classes, batches, jobs, students] = await Promise.all([
    Admin.find().select('_id name email createdAt updatedAt').lean(),
    Faculty.find().lean(),
    Department.find().lean(),
    ClassModel.find().lean(),
    Batch.find().lean(),
    Job.find().lean(),
    Student.find({ isDeleted: false }).lean(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    admins,
    faculties,
    departments,
    classes,
    batches,
    jobs,
    students,
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=\"alumni-backup-${new Date().toISOString().slice(0, 10)}.json\"`
  );
  return res.send(JSON.stringify(payload, null, 2));
});

module.exports = { backup };

