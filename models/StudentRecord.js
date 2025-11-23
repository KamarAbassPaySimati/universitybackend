const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema({
  registrationNumber: { type: String, default: '' },
  studentName: { type: String, default: '' },
  yearOfStudy: { type: Number, default: 1 },
  academicYear: { type: String, default: '' },
  semester: { type: String, default: '' },
  courseCode: { type: String, default: '' },
  courseName: { type: String, default: '' },
  finalGrade: { type: Number, default: 0 },
  gradeDescription: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentRecord', studentRecordSchema);