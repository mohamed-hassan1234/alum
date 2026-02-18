const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function imageFileFilter(req, file, cb) {
  if (file?.mimetype?.startsWith('image/')) return cb(null, true);
  return cb(new Error('Only image uploads are allowed'));
}

function excelFileFilter(req, file, cb) {
  const name = String(file?.originalname || '').toLowerCase();
  const mimetype = String(file?.mimetype || '').toLowerCase();

  const allowedMimeTypes = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ]);

  const hasAllowedExt = name.endsWith('.xlsx');
  if (allowedMimeTypes.has(mimetype) || hasAllowedExt) return cb(null, true);

  return cb(new Error('Only Excel .xlsx files are allowed'));
}

const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'students');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const name = `student-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const adminDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'admins');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const name = `admin-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const uploadLocal = multer({
  storage: localDiskStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const uploadAdminLocal = multer({
  storage: adminDiskStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const uploadAdminMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const uploadImportMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFileFilter,
  limits: { fileSize: MAX_IMPORT_FILE_SIZE_BYTES },
});

function uploadStudentPhoto(req, res, next) {
  const provider = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
  const uploader = provider === 'cloudinary' ? uploadMemory : uploadLocal;
  return uploader.single('photo')(req, res, next);
}

function uploadAdminPhoto(req, res, next) {
  const provider = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
  const uploader = provider === 'cloudinary' ? uploadAdminMemory : uploadAdminLocal;
  return uploader.single('photo')(req, res, next);
}

function uploadStudentImportFile(req, res, next) {
  return uploadImportMemory.single('file')(req, res, next);
}

module.exports = { uploadStudentPhoto, uploadStudentImportFile, uploadAdminPhoto };
