const mongoose = require('mongoose');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const ClassModel = require('../models/Class');
const Batch = require('../models/Batch');
const asyncHandler = require('../utils/asyncHandler');
const { parseArrayParam } = require('../utils/query');

function toObjectIds(values) {
  return values
    .filter(mongoose.isValidObjectId)
    .map((id) => new mongoose.Types.ObjectId(id));
}

function parseDateBoundary(value, endOfDay = false) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const date = isDateOnly
    ? new Date(`${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return null;

  if (!isDateOnly) {
    if (endOfDay) date.setUTCHours(23, 59, 59, 999);
    else date.setUTCHours(0, 0, 0, 0);
  }

  return date;
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

function fillYearSeries({ startYear, endYear, rows, mapper }) {
  const byYear = new Map(rows.map((r) => [Number(r._id), r]));
  const out = [];
  for (let y = startYear; y <= endYear; y += 1) {
    out.push(mapper(y, byYear.get(y)));
  }
  return out;
}

const dashboard = asyncHandler(async (req, res) => {
  const startYear = Number(req.query.startYear || 2020);
  const endYear = Number(req.query.endYear || 2025);

  const [totalStudents, totalEmployed, totalFaculties, totalDepartments, totalBatches, totalClasses] = await Promise.all([
    Student.countDocuments({ isDeleted: false }),
    Student.countDocuments({ isDeleted: false, jobId: { $ne: null } }),
    Faculty.countDocuments(),
    Department.countDocuments(),
    Batch.countDocuments(),
    ClassModel.countDocuments(),
  ]);
  const totalUnemployed = Math.max(totalStudents - totalEmployed, 0);
  const employmentRate = totalStudents ? Number(((totalEmployed / totalStudents) * 100).toFixed(1)) : 0;

  const studentsPerBatchRaw = await Student.aggregate([
    { $match: { isDeleted: false } },
    { $lookup: { from: 'batches', localField: 'batchId', foreignField: '_id', as: 'batch' } },
    { $unwind: '$batch' },
    { $group: { _id: '$batch.year', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const employedVsUnemployedRaw = await Student.aggregate([
    { $match: { isDeleted: false } },
    { $lookup: { from: 'batches', localField: 'batchId', foreignField: '_id', as: 'batch' } },
    { $unwind: '$batch' },
    {
      $group: {
        _id: '$batch.year',
        employed: { $sum: { $cond: [{ $ne: ['$jobId', null] }, 1, 0] } },
        unemployed: { $sum: { $cond: [{ $eq: ['$jobId', null] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const genderDistribution = await Student.aggregate([
    { $match: { isDeleted: false, gender: { $in: ['Male', 'Female'] } } },
    { $group: { _id: '$gender', count: { $sum: 1 } } },
    { $project: { _id: 0, gender: '$_id', count: 1 } },
    { $sort: { gender: 1 } },
  ]);

  const studentsPerBatch = fillYearSeries({
    startYear,
    endYear,
    rows: studentsPerBatchRaw,
    mapper: (year, row) => ({ year, count: row ? row.count : 0 }),
  });

  const employedVsUnemployedPerBatch = fillYearSeries({
    startYear,
    endYear,
    rows: employedVsUnemployedRaw,
    mapper: (year, row) => ({
      year,
      employed: row ? row.employed : 0,
      unemployed: row ? row.unemployed : 0,
    }),
  });

  const employmentTrend = employedVsUnemployedPerBatch.map((r) => {
    const total = r.employed + r.unemployed;
    const employedRate = total ? Number(((r.employed / total) * 100).toFixed(1)) : 0;
    return { year: r.year, employedRate };
  });

  const studentsPerFaculty = await Student.aggregate([
    { $match: { isDeleted: false } },
    { $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    {
      $lookup: {
        from: 'departments',
        localField: 'class.departmentId',
        foreignField: '_id',
        as: 'department',
      },
    },
    { $unwind: '$department' },
    {
      $lookup: {
        from: 'faculties',
        localField: 'department.facultyId',
        foreignField: '_id',
        as: 'faculty',
      },
    },
    { $unwind: '$faculty' },
    {
      $group: {
        _id: '$faculty._id',
        facultyName: { $first: '$faculty.facultyName' },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, facultyId: '$_id', facultyName: 1, count: 1 } },
    { $sort: { count: -1, facultyName: 1 } },
  ]);

  const studentsPerDepartment = await Student.aggregate([
    { $match: { isDeleted: false } },
    { $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    {
      $lookup: {
        from: 'departments',
        localField: 'class.departmentId',
        foreignField: '_id',
        as: 'department',
      },
    },
    { $unwind: '$department' },
    {
      $group: {
        _id: '$department._id',
        departmentName: { $first: '$department.departmentName' },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, departmentId: '$_id', departmentName: 1, count: 1 } },
    { $sort: { count: -1, departmentName: 1 } },
  ]);

  const classSizes = await Student.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
    { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    { $project: { _id: 0, classId: '$_id', className: '$class.className', count: 1 } },
    { $sort: { count: -1, className: 1 } },
  ]);

  const topJobs = await Student.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
    { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
    { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        jobId: '$_id',
        jobName: { $ifNull: ['$job.jobName', 'Unemployed'] },
        count: 1,
      },
    },
    { $sort: { count: -1, jobName: 1 } },
  ]);

  return res.json({
    data: {
      totals: {
        totalStudents,
        totalEmployed,
        totalUnemployed,
        employmentRate,
        totalFaculties,
        totalDepartments,
        totalBatches,
        totalClasses,
      },
      charts: {
        studentsPerBatch,
        genderDistribution,
        employedVsUnemployedPerBatch,
        employmentTrend,
      },
      mini: {
        studentsPerFaculty,
        studentsPerDepartment,
        classSizes,
        topJobs,
      },
    },
  });
});

const hub = asyncHandler(async (req, res) => {
  const facultyIdsRaw = parseArrayParam(req.query.facultyIds);
  const departmentIdsRaw = parseArrayParam(req.query.departmentIds);
  const classIdsRaw = parseArrayParam(req.query.classIds);
  const batchIdsRaw0 = parseArrayParam(req.query.batchIds);
  const batchYears = parseArrayParam(req.query.batchYears);
  const jobIdsRaw = parseArrayParam(req.query.jobIds);
  const genders = parseArrayParam(req.query.genders).filter((g) => g === 'Male' || g === 'Female');

  const facultyIds = toObjectIds(facultyIdsRaw);
  const departmentIds = toObjectIds(departmentIdsRaw);
  const classIds = toObjectIds(classIdsRaw);
  const batchIdsRaw = toObjectIds(batchIdsRaw0);
  const jobIds = toObjectIds(jobIdsRaw);

  const employmentStatus = String(req.query.employmentStatus || 'all').toLowerCase();
  let dateFrom = parseDateBoundary(req.query.dateFrom, false);
  let dateTo = parseDateBoundary(req.query.dateTo, true);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    const temp = dateFrom;
    dateFrom = dateTo;
    dateTo = temp;
  }

  const match = { isDeleted: false };

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

  if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    match.createdAt = { ...(match.createdAt || {}), $gte: dateFrom };
  }
  if (dateTo && !Number.isNaN(dateTo.getTime())) {
    match.createdAt = { ...(match.createdAt || {}), $lte: dateTo };
  }

  const genderDistribution = await Student.aggregate([
    { $match: { ...match, gender: { $in: ['Male', 'Female'] } } },
    { $group: { _id: '$gender', count: { $sum: 1 } } },
    { $project: { _id: 0, gender: '$_id', count: 1 } },
    { $sort: { gender: 1 } },
  ]);

  const employmentByGender = await Student.aggregate([
    { $match: { ...match, gender: { $in: ['Male', 'Female'] } } },
    {
      $group: {
        _id: '$gender',
        employed: { $sum: { $cond: [{ $ne: ['$jobId', null] }, 1, 0] } },
        unemployed: { $sum: { $cond: [{ $eq: ['$jobId', null] }, 1, 0] } },
      },
    },
    { $project: { _id: 0, gender: '$_id', employed: 1, unemployed: 1 } },
    { $sort: { gender: 1 } },
  ]);

  const batchGenderRaw = await Student.aggregate([
    { $match: { ...match, gender: { $in: ['Male', 'Female'] } } },
    { $lookup: { from: 'batches', localField: 'batchId', foreignField: '_id', as: 'batch' } },
    { $unwind: '$batch' },
    {
      $group: {
        _id: { year: '$batch.year', gender: '$gender' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1 } },
  ]);

  const batchGenderRatioMap = new Map();
  for (const row of batchGenderRaw) {
    const year = row._id.year;
    const gender = row._id.gender;
    if (!batchGenderRatioMap.has(year)) {
      batchGenderRatioMap.set(year, { year, Male: 0, Female: 0 });
    }
    if (gender === 'Male' || gender === 'Female') {
      batchGenderRatioMap.get(year)[gender] = row.count;
    }
  }
  const batchGenderRatio = Array.from(batchGenderRatioMap.values()).sort((a, b) => a.year - b.year);

  const jobsByGenderRaw = await Student.aggregate([
    { $match: { ...match, gender: { $in: ['Male', 'Female'] } } },
    { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'job' } },
    { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { jobName: { $ifNull: ['$job.jobName', 'Unemployed'] }, gender: '$gender' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.jobName': 1 } },
  ]);

  const jobsByGenderMap = new Map();
  for (const row of jobsByGenderRaw) {
    const jobName = row._id.jobName;
    const gender = row._id.gender;
    if (!jobsByGenderMap.has(jobName)) {
      jobsByGenderMap.set(jobName, { jobName, Male: 0, Female: 0, total: 0 });
    }
    const item = jobsByGenderMap.get(jobName);
    if (gender === 'Male' || gender === 'Female') {
      item[gender] = row.count;
    }
    item.total += row.count;
  }
  const jobsByGender = Array.from(jobsByGenderMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const facultyStats = await Student.aggregate([
    { $match: match },
    { $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    { $lookup: { from: 'departments', localField: 'class.departmentId', foreignField: '_id', as: 'department' } },
    { $unwind: '$department' },
    { $lookup: { from: 'faculties', localField: 'department.facultyId', foreignField: '_id', as: 'faculty' } },
    { $unwind: '$faculty' },
    {
      $group: {
        _id: '$faculty._id',
        facultyName: { $first: '$faculty.facultyName' },
        total: { $sum: 1 },
        employed: { $sum: { $cond: [{ $ne: ['$jobId', null] }, 1, 0] } },
        unemployed: { $sum: { $cond: [{ $eq: ['$jobId', null] }, 1, 0] } },
      },
    },
    { $project: { _id: 0, facultyId: '$_id', facultyName: 1, total: 1, employed: 1, unemployed: 1 } },
    { $sort: { total: -1, facultyName: 1 } },
  ]);

  const departmentStats = await Student.aggregate([
    { $match: match },
    { $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    { $lookup: { from: 'departments', localField: 'class.departmentId', foreignField: '_id', as: 'department' } },
    { $unwind: '$department' },
    {
      $group: {
        _id: '$department._id',
        departmentName: { $first: '$department.departmentName' },
        total: { $sum: 1 },
        employed: { $sum: { $cond: [{ $ne: ['$jobId', null] }, 1, 0] } },
        unemployed: { $sum: { $cond: [{ $eq: ['$jobId', null] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        departmentId: '$_id',
        departmentName: 1,
        total: 1,
        employed: 1,
        unemployed: 1,
      },
    },
    { $sort: { total: -1, departmentName: 1 } },
  ]);

  return res.json({
    data: {
      genderDistribution,
      employmentByGender,
      batchGenderRatio,
      jobsByGender,
      facultyStats,
      departmentStats,
    },
  });
});

module.exports = { dashboard, hub };
