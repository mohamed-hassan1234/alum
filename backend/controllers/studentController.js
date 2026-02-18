const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const ClassModel = require('../models/Class');
const Batch = require('../models/Batch');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');
const uploadBufferToCloudinary = require('../utils/uploadToCloudinary');
const { escapeRegex, parseArrayParam, parseBooleanParam, parseIntParam } = require('../utils/query');

function toObjectIds(values) {
  return values
    .filter(mongoose.isValidObjectId)
    .map((id) => new mongoose.Types.ObjectId(id));
}

async function resolveDepartmentIds({ facultyIds, departmentIds }) {
  if (!facultyIds.length) return departmentIds;
  const filter = { facultyId: { $in: facultyIds } };
  if (departmentIds.length) filter._id = { $in: departmentIds };
  const deps = await Department.find(filter).select('_id').lean();
  return deps.map((d) => d._id);
}

async function resolveClassIds({ facultyIds, departmentIds, classIds }) {
  const depIds = await resolveDepartmentIds({ facultyIds, departmentIds });
  const filter = {};
  if (classIds.length) filter._id = { $in: classIds };
  if (depIds.length) filter.departmentId = { $in: depIds };
  if (!Object.keys(filter).length) return [];

  const classes = await ClassModel.find(filter).select('_id').lean();
  return classes.map((c) => c._id);
}

async function resolveBatchIds({ batchIds, batchYears }) {
  const years = batchYears.map((y) => Number(y)).filter((y) => Number.isFinite(y));
  const filter = {};
  if (batchIds.length) filter._id = { $in: batchIds };
  if (years.length) filter.year = { $in: years };
  if (!Object.keys(filter).length) return [];

  const batches = await Batch.find(filter).select('_id').lean();
  return batches.map((b) => b._id);
}

function buildPhotoUrl(req) {
  if (!req.file) return '';
  return `${req.protocol}://${req.get('host')}/uploads/students/${req.file.filename}`;
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

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function cellToString(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText.map((x) => String(x.text || '')).join('');
    }
    if (value.text !== undefined && value.text !== null) return String(value.text);
    if (value.result !== undefined && value.result !== null) return String(value.result);
  }
  return String(value);
}

function normalizeGender(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Male';
  if (/^male$/i.test(raw)) return 'Male';
  if (/^female$/i.test(raw)) return 'Female';
  return null;
}

function parseStudentId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function isDuplicateKeyError(err, keyName) {
  return (
    err &&
    err.code === 11000 &&
    err.keyPattern &&
    Object.prototype.hasOwnProperty.call(err.keyPattern, keyName)
  );
}

const listStudents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseIntParam(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, parseIntParam(req.query.limit, 25)));
  const skip = (page - 1) * limit;

  const facultyIdsRaw = parseArrayParam(req.query.facultyIds);
  const departmentIdsRaw = parseArrayParam(req.query.departmentIds);
  const classIdsRaw = parseArrayParam(req.query.classIds);
  const batchIdsRaw0 = parseArrayParam(req.query.batchIds);
  const batchYears = parseArrayParam(req.query.batchYears);
  const jobIdsRaw = parseArrayParam(req.query.jobIds);

  const facultyIds = toObjectIds(facultyIdsRaw);
  const departmentIds = toObjectIds(departmentIdsRaw);
  const classIds = toObjectIds(classIdsRaw);
  const batchIdsRaw = toObjectIds(batchIdsRaw0);
  const jobIds = toObjectIds(jobIdsRaw);
  const genders = parseArrayParam(req.query.genders).filter((g) => g === 'Male' || g === 'Female');

  const search = String(req.query.search || '').trim();
  const includeDeleted = parseBooleanParam(req.query.includeDeleted, false);
  const employmentStatus = String(req.query.employmentStatus || 'all').toLowerCase();

  const match = {};
  if (!includeDeleted) match.isDeleted = false;

  if (genders.length) match.gender = { $in: genders };

  const classFilterRequested =
    facultyIdsRaw.length > 0 || departmentIdsRaw.length > 0 || classIdsRaw.length > 0;
  const resolvedClassIds = await resolveClassIds({ facultyIds, departmentIds, classIds });
  if (classFilterRequested) match.classId = { $in: resolvedClassIds };

  const batchFilterRequested = batchIdsRaw0.length > 0 || batchYears.length > 0;
  const resolvedBatchIds = await resolveBatchIds({ batchIds: batchIdsRaw, batchYears });
  if (batchFilterRequested) match.batchId = { $in: resolvedBatchIds };

  if (jobIdsRaw.length > 0) {
    match.jobId = { $in: jobIds };
  } else if (employmentStatus === 'employed') {
    match.jobId = { $ne: null };
  } else if (employmentStatus === 'unemployed') {
    match.jobId = null;
  }

  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const searchStudentId = parseStudentId(search);
    const conditions = [{ name: rx }, { email: rx }];
    if (searchStudentId) conditions.push({ studentId: searchStudentId });
    match.$or = conditions;
  }

  const total = await Student.countDocuments(match);
  const pages = Math.max(1, Math.ceil(total / limit));

  const students = await Student.find(match)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: 'batchId', select: 'batchName year' })
    .populate({ path: 'jobId', select: 'jobName' })
    .populate({
      path: 'classId',
      select: 'className departmentId',
      populate: {
        path: 'departmentId',
        select: 'departmentName facultyId',
        populate: { path: 'facultyId', select: 'facultyName' },
      },
    })
    .lean();

  return res.json({
    data: students,
    pagination: { page, limit, total, pages },
  });
});

const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid student id' });
  }

  const student = await Student.findOne({ _id: id, isDeleted: false })
    .populate({ path: 'batchId', select: 'batchName year description' })
    .populate({ path: 'jobId', select: 'jobName description' })
    .populate({
      path: 'classId',
      select: 'className description departmentId',
      populate: {
        path: 'departmentId',
        select: 'departmentName description facultyId',
        populate: { path: 'facultyId', select: 'facultyName description' },
      },
    })
    .lean();

  if (!student) return res.status(404).json({ message: 'Student not found' });

  const related = await Student.find({
    _id: { $ne: student._id },
    isDeleted: false,
    $or: [{ batchId: student.batchId?._id }, { classId: student.classId?._id }],
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate({ path: 'batchId', select: 'batchName year' })
    .populate({ path: 'jobId', select: 'jobName' })
    .populate({ path: 'classId', select: 'className' })
    .lean();

  return res.json({ data: student, related });
});

const createStudent = asyncHandler(async (req, res) => {
  const provider = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
  const studentId = parseStudentId(req.body.studentId);

  if (!studentId) {
    return res
      .status(400)
      .json({ message: 'studentId is required and must be a positive integer' });
  }

  let photoImage = '';
  if (req.file) {
    if (provider === 'cloudinary') {
      const folder = process.env.CLOUDINARY_FOLDER || 'alumni-management';
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder,
        resource_type: 'image',
      });
      photoImage = result.secure_url;
    } else {
      photoImage = buildPhotoUrl(req);
    }
  }

  const jobId = req.body.jobId ? String(req.body.jobId).trim() : '';
  const existingStudent = await Student.findOne({ studentId }).select('_id').lean();
  if (existingStudent) {
    return res.status(409).json({ message: `studentId ${studentId} already exists` });
  }

  let student;
  try {
    student = await Student.create({
      studentId,
      name: String(req.body.name).trim(),
      gender: req.body.gender || 'Male',
      email: req.body.email ? String(req.body.email).toLowerCase().trim() : undefined,
      phoneNumber: req.body.phoneNumber ? String(req.body.phoneNumber).trim() : '',
      classId: req.body.classId,
      batchId: req.body.batchId,
      jobId: jobId && mongoose.isValidObjectId(jobId) ? jobId : null,
      photoImage,
      description: String(req.body.description || '').trim(),
    });
  } catch (err) {
    if (isDuplicateKeyError(err, 'studentId')) {
      return res.status(409).json({ message: `studentId ${studentId} already exists` });
    }
    throw err;
  }

  const populated = await Student.findById(student._id)
    .populate({ path: 'batchId', select: 'batchName year' })
    .populate({ path: 'jobId', select: 'jobName' })
    .populate({
      path: 'classId',
      select: 'className departmentId',
      populate: {
        path: 'departmentId',
        select: 'departmentName facultyId',
        populate: { path: 'facultyId', select: 'facultyName' },
      },
    })
    .lean();

  return res.status(201).json({ data: populated });
});

const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid student id' });
  }

  const student = await Student.findById(id);
  if (!student || student.isDeleted) return res.status(404).json({ message: 'Student not found' });

  const provider = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
  if (req.file) {
    if (provider === 'cloudinary') {
      const folder = process.env.CLOUDINARY_FOLDER || 'alumni-management';
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder,
        resource_type: 'image',
      });
      student.photoImage = result.secure_url;
    } else {
      student.photoImage = buildPhotoUrl(req);
    }
  }

  if (req.body.studentId !== undefined) {
    const studentId = parseStudentId(req.body.studentId);
    if (!studentId) {
      return res
        .status(400)
        .json({ message: 'studentId must be a positive integer with no decimals' });
    }

    if (studentId !== student.studentId) {
      const existingStudent = await Student.findOne({
        _id: { $ne: student._id },
        studentId,
      })
        .select('_id')
        .lean();
      if (existingStudent) {
        return res.status(409).json({ message: `studentId ${studentId} already exists` });
      }
    }
    student.studentId = studentId;
  }

  if (req.body.name !== undefined) student.name = String(req.body.name).trim();
  if (req.body.gender !== undefined) student.gender = req.body.gender;
  if (req.body.email !== undefined) {
    student.email = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;
  }
  if (req.body.phoneNumber !== undefined) {
    student.phoneNumber = req.body.phoneNumber ? String(req.body.phoneNumber).trim() : '';
  }
  if (req.body.classId !== undefined) student.classId = req.body.classId;
  if (req.body.batchId !== undefined) student.batchId = req.body.batchId;
  if (req.body.jobId !== undefined) {
    const jobId = req.body.jobId ? String(req.body.jobId).trim() : '';
    student.jobId = jobId && mongoose.isValidObjectId(jobId) ? jobId : null;
  }
  if (req.body.description !== undefined) student.description = String(req.body.description || '').trim();

  try {
    await student.save();
  } catch (err) {
    if (isDuplicateKeyError(err, 'studentId')) {
      return res.status(409).json({ message: `studentId ${student.studentId} already exists` });
    }
    throw err;
  }

  const populated = await Student.findById(student._id)
    .populate({ path: 'batchId', select: 'batchName year' })
    .populate({ path: 'jobId', select: 'jobName' })
    .populate({
      path: 'classId',
      select: 'className departmentId',
      populate: {
        path: 'departmentId',
        select: 'departmentName facultyId',
        populate: { path: 'facultyId', select: 'facultyName' },
      },
    })
    .lean();

  return res.json({ data: populated });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid student id' });
  }

  const force = parseBooleanParam(req.query.force, false);
  if (force) {
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Student not found' });
    return res.json({ message: 'Student deleted permanently' });
  }

  const updated = await Student.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Student not found' });
  return res.json({ message: 'Student deleted' });
});

const deleteAllStudents = asyncHandler(async (req, res) => {
  const force = parseBooleanParam(req.query.force, false);

  if (force) {
    const result = await Student.deleteMany({});
    return res.json({
      message: 'All students deleted permanently',
      affected: result.deletedCount || 0,
    });
  }

  const result = await Student.updateMany(
    { isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );

  return res.json({
    message: 'All active students deleted',
    affected: result.modifiedCount || 0,
  });
});

const deleteStudentsByFilter = asyncHandler(async (req, res) => {
  const facultyIdsRaw = parseArrayParam(req.body?.facultyIds || req.query.facultyIds);
  const departmentIdsRaw = parseArrayParam(req.body?.departmentIds || req.query.departmentIds);
  const classIdsRaw = parseArrayParam(req.body?.classIds || req.query.classIds);
  const force = parseBooleanParam(req.body?.force ?? req.query.force, false);

  const classFilterRequested =
    facultyIdsRaw.length > 0 || departmentIdsRaw.length > 0 || classIdsRaw.length > 0;

  if (!classFilterRequested) {
    return res.status(400).json({
      message: 'Select at least one faculty, department, or class filter before delete',
    });
  }

  const facultyIds = toObjectIds(facultyIdsRaw);
  const departmentIds = toObjectIds(departmentIdsRaw);
  const classIds = toObjectIds(classIdsRaw);

  const resolvedClassIds = await resolveClassIds({ facultyIds, departmentIds, classIds });
  if (!resolvedClassIds.length) {
    return res.json({
      message: 'No students matched selected class filters',
      affected: 0,
    });
  }

  if (force) {
    const result = await Student.deleteMany({ classId: { $in: resolvedClassIds } });
    return res.json({
      message: 'Filtered students deleted permanently',
      affected: result.deletedCount || 0,
    });
  }

  const result = await Student.updateMany(
    { classId: { $in: resolvedClassIds }, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );

  return res.json({
    message: 'Filtered students deleted',
    affected: result.modifiedCount || 0,
  });
});

const restoreStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid student id' });
  }

  const updated = await Student.findByIdAndUpdate(
    id,
    { isDeleted: false, deletedAt: null },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Student not found' });
  return res.json({ message: 'Student restored' });
});

const getStudentFilters = asyncHandler(async (req, res) => {
  const [faculties, departments, classes, batches, jobs] = await Promise.all([
    Faculty.find().sort({ facultyName: 1 }).lean(),
    Department.find().sort({ departmentName: 1 }).lean(),
    ClassModel.find().sort({ className: 1 }).lean(),
    Batch.find().sort({ year: -1 }).lean(),
    Job.find().sort({ jobName: 1 }).lean(),
  ]);

  return res.json({ data: { faculties, departments, classes, batches, jobs } });
});

const downloadStudentImportTemplate = asyncHandler(async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Alumni Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Students Import');
  sheet.columns = [
    { header: 'studentId', key: 'studentId', width: 14 },
    { header: 'name', key: 'name', width: 26 },
    { header: 'gender', key: 'gender', width: 12 },
    { header: 'email', key: 'email', width: 32 },
    { header: 'phoneNumber', key: 'phoneNumber', width: 18 },
    { header: 'jobName', key: 'jobName', width: 24 },
    { header: 'description', key: 'description', width: 42 },
  ];

  sheet.addRow({
    studentId: 1001,
    name: 'Ahmed Ali',
    gender: 'Male',
    email: 'ahmed.ali@example.com',
    phoneNumber: '+252611234567',
    jobName: 'Software Engineer',
    description: 'Batch import sample row 1',
  });
  sheet.addRow({
    studentId: 1002,
    name: 'Amina Hassan',
    gender: 'Female',
    email: 'amina.hassan@example.com',
    phoneNumber: '+252611112233',
    jobName: '',
    description: 'Leave jobName empty for unemployed',
  });

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const notes = workbook.addWorksheet('Notes');
  notes.getCell('A1').value = 'Required fields:';
  notes.getCell('A2').value = 'studentId (positive integer, unique)';
  notes.getCell('A3').value = 'name';
  notes.getCell('A4').value = 'Optional fields:';
  notes.getCell('A5').value = 'gender (Male/Female, default Male)';
  notes.getCell('A6').value = 'email (must be unique if provided)';
  notes.getCell('A7').value = 'phoneNumber';
  notes.getCell('A8').value = 'jobName (must match existing Job name; otherwise unemployed)';
  notes.getCell('A9').value = 'description';
  notes.getCell('A11').value =
    'Class/Batch are selected in the import dialog and applied to every row in this file.';
  notes.getColumn(1).width = 110;
  notes.getRow(1).font = { bold: true };
  notes.getRow(4).font = { bold: true };

  const filename = 'students-import-template.xlsx';
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
  await workbook.xlsx.write(res);
  return res.end();
});

const importStudentsByClassBatch = asyncHandler(async (req, res) => {
  const facultyId = String(req.body.facultyId || '').trim();
  const departmentId = String(req.body.departmentId || '').trim();
  const classId = String(req.body.classId || '').trim();
  const batchId = String(req.body.batchId || '').trim();

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'Import file is required' });
  }

  if (
    !mongoose.isValidObjectId(facultyId) ||
    !mongoose.isValidObjectId(departmentId) ||
    !mongoose.isValidObjectId(classId) ||
    !mongoose.isValidObjectId(batchId)
  ) {
    return res.status(400).json({ message: 'Invalid faculty/department/class/batch selection' });
  }

  const [faculty, department, classItem, batch, jobs] = await Promise.all([
    Faculty.findById(facultyId).lean(),
    Department.findById(departmentId).lean(),
    ClassModel.findById(classId).lean(),
    Batch.findById(batchId).lean(),
    Job.find().select('_id jobName').lean(),
  ]);

  if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
  if (!department) return res.status(404).json({ message: 'Department not found' });
  if (!classItem) return res.status(404).json({ message: 'Class not found' });
  if (!batch) return res.status(404).json({ message: 'Batch not found' });

  if (String(department.facultyId) !== String(faculty._id)) {
    return res.status(400).json({ message: 'Selected department does not belong to selected faculty' });
  }
  if (String(classItem.departmentId) !== String(department._id)) {
    return res.status(400).json({ message: 'Selected class does not belong to selected department' });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid Excel file. Please upload a valid .xlsx file' });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return res.status(400).json({ message: 'Excel file is empty. Add at least one data row' });
  }

  const headerMap = new Map();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const key = normalizeHeader(cellToString(cell.value));
    if (key) headerMap.set(key, colNumber);
  });

  const colStudentId = headerMap.get('studentid');
  const colName = headerMap.get('name');
  const colGender = headerMap.get('gender');
  const colEmail = headerMap.get('email');
  const colPhone = headerMap.get('phonenumber');
  const colJobName = headerMap.get('jobname');
  const colDescription = headerMap.get('description');

  if (!colStudentId || !colName) {
    return res.status(400).json({
      message: 'Template error: "studentId" and "name" columns are required',
    });
  }

  const jobByName = new Map(
    jobs.map((j) => [String(j.jobName || '').trim().toLowerCase(), j._id])
  );

  const rows = [];
  const pendingEmails = new Set();
  const pendingStudentIds = new Set();
  for (let i = 2; i <= sheet.rowCount; i += 1) {
    const row = sheet.getRow(i);
    const rawStudentId = colStudentId ? cellToString(row.getCell(colStudentId).value).trim() : '';
    const parsedStudentId = parseStudentId(rawStudentId);
    if (parsedStudentId) pendingStudentIds.add(parsedStudentId);
    const rawEmail = colEmail ? cellToString(row.getCell(colEmail).value).trim().toLowerCase() : '';
    if (rawEmail) pendingEmails.add(rawEmail);
    rows.push({ index: i, row });
  }

  const [existingEmailRows, existingStudentIdRows] = await Promise.all([
    Student.find({
      email: { $in: Array.from(pendingEmails) },
    })
      .select('email')
      .lean(),
    Student.find({
      studentId: { $in: Array.from(pendingStudentIds) },
    })
      .select('studentId')
      .lean(),
  ]);

  const usedEmails = new Set(existingEmailRows.map((s) => String(s.email).trim().toLowerCase()));
  const usedStudentIds = new Set(existingStudentIdRows.map((s) => Number(s.studentId)));
  const seenEmailsInFile = new Set();
  const seenStudentIdsInFile = new Set();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const docs = [];
  const skippedRows = [];
  const batchYear = Number(batch.year);

  for (const { index, row } of rows) {
    const studentId = parseStudentId(
      colStudentId ? cellToString(row.getCell(colStudentId).value).trim() : ''
    );
    if (!studentId) {
      skippedRows.push({ row: index, reason: 'Missing/invalid studentId (positive integer only)' });
      continue;
    }
    if (seenStudentIdsInFile.has(studentId) || usedStudentIds.has(studentId)) {
      skippedRows.push({ row: index, reason: `Duplicate studentId ${studentId}` });
      continue;
    }
    seenStudentIdsInFile.add(studentId);
    usedStudentIds.add(studentId);

    const name = cellToString(row.getCell(colName).value).trim();
    if (!name) {
      skippedRows.push({ row: index, reason: 'Missing required name' });
      continue;
    }

    const genderValue = colGender ? cellToString(row.getCell(colGender).value) : '';
    const gender = normalizeGender(genderValue);
    if (!gender) {
      skippedRows.push({ row: index, reason: 'Invalid gender (use Male/Female)' });
      continue;
    }

    const email = colEmail ? cellToString(row.getCell(colEmail).value).trim().toLowerCase() : '';
    if (email) {
      if (!emailRegex.test(email)) {
        skippedRows.push({ row: index, reason: 'Invalid email format' });
        continue;
      }
      if (seenEmailsInFile.has(email) || usedEmails.has(email)) {
        skippedRows.push({ row: index, reason: 'Duplicate email' });
        continue;
      }
      seenEmailsInFile.add(email);
      usedEmails.add(email);
    }

    const phoneNumber = colPhone ? cellToString(row.getCell(colPhone).value).trim() : '';
    const description = colDescription ? cellToString(row.getCell(colDescription).value).trim() : '';

    const jobNameRaw = colJobName ? cellToString(row.getCell(colJobName).value).trim().toLowerCase() : '';
    const jobId = jobNameRaw ? jobByName.get(jobNameRaw) || null : null;

    const createdAt = Number.isFinite(batchYear) ? randomDateInYear(batchYear) : new Date();
    const updatedAt = Number.isFinite(batchYear) ? randomUpdatedAt(createdAt, batchYear) : createdAt;

    docs.push({
      studentId,
      name,
      gender,
      email: email || undefined,
      phoneNumber,
      classId: classItem._id,
      batchId: batch._id,
      jobId,
      description,
      createdAt,
      updatedAt,
    });
  }

  if (!docs.length) {
    return res.status(400).json({
      message: 'No valid rows to import',
      summary: {
        totalRows: rows.length,
        imported: 0,
        skipped: skippedRows.length,
      },
      skippedRows,
    });
  }

  const inserted = await Student.insertMany(docs, { ordered: false });

  return res.status(201).json({
    message: `Imported ${inserted.length} students`,
    summary: {
      totalRows: rows.length,
      imported: inserted.length,
      skipped: skippedRows.length,
      className: classItem.className,
      batchName: batch.batchName,
    },
    skippedRows,
  });
});

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  deleteAllStudents,
  deleteStudentsByFilter,
  restoreStudent,
  getStudentFilters,
  downloadStudentImportTemplate,
  importStudentsByClassBatch,
};
