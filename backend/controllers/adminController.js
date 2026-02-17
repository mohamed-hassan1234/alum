const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const uploadBufferToCloudinary = require('../utils/uploadToCloudinary');

function buildAdminPhotoUrl(req) {
  if (!req.file) return '';
  return `${req.protocol}://${req.get('host')}/uploads/admins/${req.file.filename}`;
}

const getMe = asyncHandler(async (req, res) => {
  return res.json({ admin: req.admin });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const admin = await Admin.findById(req.admin._id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  const provider = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();

  if (email && String(email).toLowerCase() !== admin.email) {
    const existing = await Admin.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    admin.email = String(email).toLowerCase();
  }

  if (name) admin.name = String(name).trim();

  if (req.file) {
    if (provider === 'cloudinary') {
      const folder = `${process.env.CLOUDINARY_FOLDER || 'alumni-management'}/admins`;
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder,
        resource_type: 'image',
      });
      admin.photoImage = result.secure_url;
    } else {
      admin.photoImage = buildAdminPhotoUrl(req);
    }
  }

  await admin.save();

  return res.json({
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      photoImage: admin.photoImage || '',
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  const ok = await admin.matchPassword(String(currentPassword || ''));
  if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

  admin.password = String(newPassword || '');
  await admin.save();

  return res.json({ message: 'Password updated successfully' });
});

module.exports = { getMe, updateMe, changePassword };
