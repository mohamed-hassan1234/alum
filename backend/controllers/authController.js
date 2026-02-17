const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');

function signToken(adminId) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: adminId }, secret, { expiresIn });
}

function toAuthPayload(admin, token) {
  return {
    token,
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      photoImage: admin.photoImage || '',
    },
  };
}

const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const exists = await Admin.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Admin with this email already exists' });

  const admin = await Admin.create({ name, email, password });
  const token = signToken(admin._id);

  return res.status(201).json(toAuthPayload(admin, token));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email: String(email || '').toLowerCase() }).select(
    '+password'
  );
  if (!admin) return res.status(401).json({ message: 'Invalid email or password' });

  const ok = await admin.matchPassword(String(password || ''));
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  const token = signToken(admin._id);
  return res.json(toAuthPayload(admin, token));
});

const me = asyncHandler(async (req, res) => {
  return res.json({ admin: req.admin });
});

module.exports = { register, login, me };
