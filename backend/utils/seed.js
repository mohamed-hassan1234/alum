require('dotenv').config();

const { faker } = require('@faker-js/faker');
const connectDB = require('../config/db');

const Admin = require('../models/Admin');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const ClassModel = require('../models/Class');
const Batch = require('../models/Batch');
const Job = require('../models/Job');
const Student = require('../models/Student');

function pickWeighted(items) {
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const it of items) {
    acc += it.weight;
    if (r <= acc) return it.value;
  }
  return items[items.length - 1].value;
}

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

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallbackValue;
  return parsed;
}

async function run() {
  const seedAdminName = String(process.env.SEED_ADMIN_NAME || 'System Admin').trim() || 'System Admin';
  const seedAdminEmail = String(process.env.SEED_ADMIN_EMAIL || 'admin@alumni.local')
    .trim()
    .toLowerCase();
  const seedAdminPassword = String(process.env.SEED_ADMIN_PASSWORD || 'Admin@123');
  const seedStudentCount = parsePositiveInt(process.env.SEED_STUDENT_COUNT, 50);

  await connectDB();

  await Promise.all([
    Admin.deleteMany({}),
    Faculty.deleteMany({}),
    Department.deleteMany({}),
    ClassModel.deleteMany({}),
    Batch.deleteMany({}),
    Job.deleteMany({}),
    Student.deleteMany({}),
  ]);

  await Admin.create({
    name: seedAdminName,
    email: seedAdminEmail,
    password: seedAdminPassword,
  });

  const [engineering, science, business] = await Faculty.create(
    {
      facultyName: 'Engineering',
      description: 'Engineering faculty and applied technology disciplines.',
    },
    { facultyName: 'Science', description: 'Science faculty and research programs.' },
    { facultyName: 'Business', description: 'Business and management programs.' }
  );

  const [compEng, civilEng, compSci, biology, busAdmin] = await Department.create(
    {
      departmentName: 'Computer Engineering',
      facultyId: engineering._id,
      description: 'Computer systems, hardware, and embedded engineering.',
    },
    {
      departmentName: 'Civil Engineering',
      facultyId: engineering._id,
      description: 'Structures, transportation, and construction engineering.',
    },
    {
      departmentName: 'Computer Science',
      facultyId: science._id,
      description: 'Software, algorithms, data, and AI.',
    },
    {
      departmentName: 'Biology',
      facultyId: science._id,
      description: 'Biological sciences and lab research.',
    },
    {
      departmentName: 'Business Administration',
      facultyId: business._id,
      description: 'Management, entrepreneurship, and leadership.',
    }
  );

  const classes = await ClassModel.create(
    { className: 'CE-1', departmentId: compEng._id },
    { className: 'CE-2', departmentId: compEng._id },
    { className: 'CivE-1', departmentId: civilEng._id },
    { className: 'CS-1', departmentId: compSci._id },
    { className: 'CS-2', departmentId: compSci._id },
    { className: 'Bio-1', departmentId: biology._id },
    { className: 'BBA-1', departmentId: busAdmin._id },
    { className: 'BBA-2', departmentId: busAdmin._id }
  );

  const batches = await Batch.create(
    { batchName: 'Batch 2022', year: 2022, description: 'Graduating class of 2022' },
    { batchName: 'Batch 2023', year: 2023, description: 'Graduating class of 2023' },
    { batchName: 'Batch 2024', year: 2024, description: 'Graduating class of 2024' },
    { batchName: 'Batch 2025', year: 2025, description: 'Graduating class of 2025' }
  );

  const jobs = await Job.create(
    { jobName: 'Software Engineer', description: 'Builds software products and systems.' },
    { jobName: 'Data Analyst', description: 'Analyzes datasets and produces insights.' },
    { jobName: 'Product Manager', description: 'Owns product direction and execution.' },
    { jobName: 'Research Assistant', description: 'Supports academic or lab research.' },
    { jobName: 'Civil Engineer', description: 'Designs and oversees civil projects.' },
    { jobName: 'Network Engineer', description: 'Designs and maintains networks.' },
    { jobName: 'Accountant', description: 'Manages financial reporting and audits.' },
    { jobName: 'Teacher', description: 'Provides instruction and mentorship.' },
    { jobName: 'Entrepreneur', description: 'Builds and runs a business venture.' },
    { jobName: 'UX Designer', description: 'Designs user experiences and interfaces.' }
  );

  const genderWeights = [
    { value: 'Male', weight: 55 },
    { value: 'Female', weight: 45 },
  ];

  const studentDocs = [];
  for (let i = 0; i < seedStudentCount; i += 1) {
    const name = faker.person.fullName();
    const gender = pickWeighted(genderWeights);
    const employed = Math.random() < 0.7;

    const cls = faker.helpers.arrayElement(classes);
    const batch = faker.helpers.arrayElement(batches);
    const job = employed ? faker.helpers.arrayElement(jobs) : null;
    const createdAt = randomDateInYear(batch.year);
    const updatedAt = randomUpdatedAt(createdAt, batch.year);

    const email = faker.internet
      .email({ firstName: name.split(' ')[0], lastName: name.split(' ').slice(-1)[0] })
      .toLowerCase();

    studentDocs.push({
      studentId: 1000 + i + 1,
      name,
      gender,
      email: `${i + 1}.${email}`,
      phoneNumber: faker.phone.number(),
      classId: cls._id,
      batchId: batch._id,
      jobId: job ? job._id : null,
      photoImage: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
      description: faker.lorem.sentence(),
      createdAt,
      updatedAt,
    });
  }

  await Student.insertMany(studentDocs);

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`Students created: ${seedStudentCount}`);
  // eslint-disable-next-line no-console
  console.log('Admin login:');
  // eslint-disable-next-line no-console
  console.log(`  Email: ${seedAdminEmail}`);
  // eslint-disable-next-line no-console
  console.log(`  Password: ${seedAdminPassword}`);

  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
