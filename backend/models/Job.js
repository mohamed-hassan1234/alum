const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
      unique: true,
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

module.exports = mongoose.model('Job', jobSchema);

