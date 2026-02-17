require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const classRoutes = require('./routes/classRoutes');
const batchRoutes = require('./routes/batchRoutes');
const jobRoutes = require('./routes/jobRoutes');
const studentRoutes = require('./routes/studentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function normalizeOriginValue(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

const corsOrigin = (process.env.CORS_ORIGIN || '').trim();
const allowedOrigins =
  corsOrigin === '*'
    ? '*'
    : corsOrigin
        .split(',')
        .map((s) => normalizeOriginValue(s))
        .filter(Boolean);

const localDevOriginRx = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function isOriginAllowed(requestOrigin) {
  const normalizedRequestOrigin = normalizeOriginValue(requestOrigin);
  if (!normalizedRequestOrigin) return true;
  if (allowedOrigins === '*') return true;
  if (Array.isArray(allowedOrigins) && allowedOrigins.includes(normalizedRequestOrigin)) return true;
  if (process.env.NODE_ENV !== 'production' && localDevOriginRx.test(normalizedRequestOrigin)) return true;
  return false;
}

app.use(
  cors({
    origin: (requestOrigin, cb) => {
      if (isOriginAllowed(requestOrigin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${requestOrigin}`));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Static uploads (local provider)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  if ((process.env.UPLOAD_PROVIDER || 'local').toLowerCase() === 'cloudinary') {
    const configured = configureCloudinary();
    if (!configured) {
      // Keep the server working in local development if Cloudinary env vars aren't set.
      // The frontend still receives a valid photo URL via /uploads.
      // eslint-disable-next-line no-console
      console.warn('Cloudinary is not configured; falling back to local uploads.');
      process.env.UPLOAD_PROVIDER = 'local';
    }
  }

  await connectDB();

  const port = Number(process.env.PORT || 7100);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

start();
