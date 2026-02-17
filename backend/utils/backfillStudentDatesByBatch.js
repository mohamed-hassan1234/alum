require('dotenv').config();

const connectDB = require('../config/db');
const Student = require('../models/Student');
require('../models/Batch');

function randomDateInYear(year) {
  const start = Date.UTC(year, 0, 1, 0, 0, 0, 0);
  const end = Date.UTC(year, 11, 31, 23, 59, 59, 999);
  const timestamp = start + Math.floor(Math.random() * (end - start + 1));
  return new Date(timestamp);
}

function randomUpdatedAt(createdAt, year) {
  const end = Date.UTC(year, 11, 31, 23, 59, 59, 999);
  const start = createdAt.getTime();
  const timestamp = start + Math.floor(Math.random() * (Math.max(1, end - start + 1)));
  return new Date(timestamp);
}

async function run() {
  await connectDB();

  const students = await Student.find({})
    .select('_id batchId createdAt')
    .populate({ path: 'batchId', select: 'year' })
    .lean();

  const operations = [];
  let skipped = 0;

  for (const student of students) {
    const year = Number(student.batchId?.year);
    if (!Number.isFinite(year)) {
      skipped += 1;
      continue;
    }

    const currentYear = student.createdAt ? new Date(student.createdAt).getUTCFullYear() : null;
    if (currentYear === year) continue;

    const createdAt = randomDateInYear(year);
    const updatedAt = randomUpdatedAt(createdAt, year);

    operations.push({
      updateOne: {
        filter: { _id: student._id },
        update: { $set: { createdAt, updatedAt } },
      },
    });
  }

  if (operations.length) {
    await Student.bulkWrite(operations, { ordered: false });
  }

  // eslint-disable-next-line no-console
  console.log(`Students scanned: ${students.length}`);
  // eslint-disable-next-line no-console
  console.log(`Students updated: ${operations.length}`);
  // eslint-disable-next-line no-console
  console.log(`Students skipped (missing batch/year): ${skipped}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
