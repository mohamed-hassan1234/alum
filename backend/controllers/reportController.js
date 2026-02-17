const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const Student = require('../models/Student');
const Department = require('../models/Department');
const ClassModel = require('../models/Class');
const Batch = require('../models/Batch');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, parseArrayParam, parseBooleanParam } = require('../utils/query');

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

function flattenStudent(s) {
  const cls = s.classId;
  const dep = cls?.departmentId;
  const fac = dep?.facultyId;
  const bat = s.batchId;
  const job = s.jobId;

  return {
    studentId: Number.isInteger(s.studentId) ? s.studentId : '',
    name: s.name || '',
    gender: s.gender || '',
    email: s.email || '',
    phoneNumber: s.phoneNumber || '',
    faculty: fac?.facultyName || '',
    department: dep?.departmentName || '',
    className: cls?.className || '',
    batch: bat?.batchName || '',
    year: bat?.year || '',
    job: job?.jobName || '',
    employmentStatus: job ? 'Employed' : 'Unemployed',
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
  };
}

const exportStudents = asyncHandler(async (req, res) => {
  const format = String(req.query.format || 'csv').toLowerCase();

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
  const employmentStatus = String(req.query.employmentStatus || 'all').toLowerCase();
  const includeDeleted = parseBooleanParam(req.query.includeDeleted, false);

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
    const conditions = [{ name: rx }, { email: rx }];
    const parsedStudentId = Number(search);
    if (Number.isSafeInteger(parsedStudentId) && parsedStudentId > 0) {
      conditions.push({ studentId: parsedStudentId });
    }
    match.$or = conditions;
  }

  const students = await Student.find(match)
    .sort({ createdAt: -1 })
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

  const rows = students.map(flattenStudent);

  const employed = rows.filter((r) => r.employmentStatus === 'Employed').length;
  const unemployed = rows.length - employed;

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  if (format === 'csv') {
    const fields = [
      { label: 'Student ID', value: 'studentId' },
      { label: 'Name', value: 'name' },
      { label: 'Gender', value: 'gender' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phoneNumber' },
      { label: 'Faculty', value: 'faculty' },
      { label: 'Department', value: 'department' },
      { label: 'Class', value: 'className' },
      { label: 'Batch', value: 'batch' },
      { label: 'Year', value: 'year' },
      { label: 'Job', value: 'job' },
      { label: 'Employment Status', value: 'employmentStatus' },
      { label: 'Created At', value: 'createdAt' },
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"students-${stamp}.csv\"`);
    return res.send(csv);
  }

  if (format === 'xlsx' || format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Alumni Management System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Students');
    sheet.columns = [
      { header: 'Student ID', key: 'studentId', width: 14 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Phone', key: 'phoneNumber', width: 16 },
      { header: 'Faculty', key: 'faculty', width: 18 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Class', key: 'className', width: 16 },
      { header: 'Batch', key: 'batch', width: 14 },
      { header: 'Year', key: 'year', width: 8 },
      { header: 'Job', key: 'job', width: 22 },
      { header: 'Employment Status', key: 'employmentStatus', width: 18 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    sheet.addRow({
      studentId: '',
      name: `Report generated: ${now.toISOString()}`,
      gender: '',
      email: '',
      phoneNumber: '',
      faculty: '',
      department: '',
      className: '',
      batch: '',
      year: '',
      job: '',
      employmentStatus: '',
      createdAt: '',
    });
    sheet.addRow({
      studentId: '',
      name: `Total: ${rows.length}`,
      gender: '',
      email: '',
      phoneNumber: '',
      faculty: '',
      department: '',
      className: '',
      batch: '',
      year: '',
      job: '',
      employmentStatus: `Employed: ${employed} | Unemployed: ${unemployed}`,
      createdAt: '',
    });
    sheet.addRow({});

    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(2).font = { bold: true };
    sheet.getRow(4).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=\"students-${stamp}.xlsx\"`);
    await workbook.xlsx.write(res);
    return res.end();
  }

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=\"students-${stamp}.pdf\"`);

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    doc.pipe(res);

    doc.fontSize(18).text('Alumni Management System', { align: 'left' });
    doc.moveDown(0.25);
    doc.fontSize(12).text('Students Report', { align: 'left' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .text(`Generated: ${now.toISOString()}`)
      .text(`Total: ${rows.length} | Employed: ${employed} | Unemployed: ${unemployed}`);

    doc.moveDown(1);
    doc.fontSize(10).text('Entries:', { underline: true });
    doc.moveDown(0.5);

    const lineHeight = 14;
    let y = doc.y;

    function maybeNewPage() {
      if (y > doc.page.height - doc.page.margins.bottom - 2 * lineHeight) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    for (const r of rows) {
      const line = `${r.studentId || '-'} | ${r.name} | ${r.gender} | ${r.batch} (${r.year}) | ${
        r.className
      } | ${r.job || 'Unemployed'}`;
      maybeNewPage();
      doc.fontSize(9).text(line, doc.page.margins.left, y, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
      y += lineHeight;
    }

    doc.end();
    return;
  }

  return res.status(400).json({ message: 'Invalid format. Use csv, xlsx, or pdf.' });
});

module.exports = { exportStudents };
