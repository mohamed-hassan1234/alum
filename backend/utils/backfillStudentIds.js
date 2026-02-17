require('dotenv').config();

const connectDB = require('../config/db');
const Student = require('../models/Student');

function toValidStudentId(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return parsed;
}

async function run() {
  await connectDB();

  const students = await Student.find({})
    .select('_id studentId createdAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const usedStudentIds = new Set();
  const updateTargets = [];
  let maxStudentId = 0;

  for (const student of students) {
    const studentId = toValidStudentId(student.studentId);
    if (!studentId || usedStudentIds.has(studentId)) {
      updateTargets.push(student._id);
      continue;
    }
    usedStudentIds.add(studentId);
    if (studentId > maxStudentId) maxStudentId = studentId;
  }

  if (!updateTargets.length) {
    // eslint-disable-next-line no-console
    console.log('No studentId backfill needed.');
    process.exit(0);
  }

  let nextStudentId = maxStudentId + 1;
  const operations = updateTargets.map((studentIdObject) => {
    while (usedStudentIds.has(nextStudentId)) {
      nextStudentId += 1;
    }
    const assignedStudentId = nextStudentId;
    usedStudentIds.add(assignedStudentId);
    nextStudentId += 1;

    return {
      updateOne: {
        filter: { _id: studentIdObject },
        update: { $set: { studentId: assignedStudentId } },
      },
    };
  });

  await Student.bulkWrite(operations, { ordered: true });

  // eslint-disable-next-line no-console
  console.log(`Backfilled studentId for ${operations.length} students.`);
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
