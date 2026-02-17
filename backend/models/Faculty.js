const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    facultyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
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

module.exports = mongoose.model('Faculty', facultySchema);

