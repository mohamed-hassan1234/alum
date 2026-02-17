const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 3000,
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

batchSchema.index({ year: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
