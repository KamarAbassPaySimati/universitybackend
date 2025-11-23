const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const StudentRecord = require('../models/StudentRecord');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/excel', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const records = data.map(row => ({
      registrationNumber: row['Registration Number'] || '',
      studentName: row['Student Name'] || '',
      yearOfStudy: parseInt(row['Year of Study']) || 1,
      academicYear: row['Academic Year'] || '',
      semester: row['Semester'] || '',
      courseCode: row['Course Code'] || '',
      courseName: row['Course Name'] || '',
      finalGrade: parseInt(row['Final Grade']) || 0,
      gradeDescription: row['Grade Description'] || ''
    })).filter(record => record.registrationNumber && record.studentName);

    await StudentRecord.insertMany(records);
    res.json({ message: `${records.length} records uploaded successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/records', async (req, res) => {
  try {
    const records = await StudentRecord.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;