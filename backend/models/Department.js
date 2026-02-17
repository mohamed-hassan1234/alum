const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

departmentSchema.index({ facultyId: 1, departmentName: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);

