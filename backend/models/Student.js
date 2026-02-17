const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      index: true,
      validate: {
        validator: Number.isInteger,
        message: 'studentId must be an integer',
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      default: 'Male',
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 180,
      unique: true,
      sparse: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
      index: true,
    },
    photoImage: {
      type: String,
      default: '',
      trim: true,
      maxlength: 3000,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4000,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

studentSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Student', studentSchema);
