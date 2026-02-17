const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');

function signToken(adminId) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: adminId }, secret, { expiresIn });
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email: String(email || '').toLowerCase() }).select(
    '+password'
  );
  if (!admin) return res.status(401).json({ message: 'Invalid email or password' });

  const ok = await admin.matchPassword(String(password || ''));
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  const token = signToken(admin._id);
  return res.json({
    token,
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      photoImage: admin.photoImage || '',
    },
  });
});

const me = asyncHandler(async (req, res) => {
  return res.json({ admin: req.admin });
});

module.exports = { login, me };
