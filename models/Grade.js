const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  yearOfStudy: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  courseCode: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  finalGrade: {
    type: Number,
    required: true
  },
  gradeDescription: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Grade', gradeSchema, 'studentrecords');