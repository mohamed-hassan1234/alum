const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const hasBearer = header.startsWith('Bearer ');
    if (!hasBearer) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    req.admin = admin;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
}

module.exports = { protect };

