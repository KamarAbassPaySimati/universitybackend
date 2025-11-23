const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get unique students from grades collection
    const students = await db.collection('grades').aggregate([
      {
        $group: {
          _id: '$registrationNumber',
          studentName: { $first: '$studentName' },
          courseCode: { $first: '$courseCode' },
          academicYear: { $first: '$academicYear' },
          semester: { $first: '$semester' },
          yearOfStudy: { $first: '$yearOfStudy' },
          createdAt: { $first: '$createdAt' },
          grades: { $push: { course: '$courseCode', grade: '$letterGrade', points: '$gradePoints' } }
        }
      },
      {
        $project: {
          student_id: '$_id',
          full_name: '$studentName',
          program_name: { $arrayElemAt: [{ $split: ['$courseCode', ' '] }, 0] },
          academic_year: '$academicYear',
          semester: '$semester',
          enrollment_year: '$yearOfStudy',
          status: 'active',
          email: { $concat: [{ $toLower: { $replaceAll: { input: '$studentName', find: ' ', replacement: '.' } } }, '@university.edu'] },
          total_courses: { $size: '$grades' },
          created_at: '$createdAt'
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
    
    res.json(students);
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { full_name, student_id, program, year, email, department } = req.body;
    
    const newStudent = {
      student_id,
      full_name,
      email: email || `${student_id}@university.edu`,
      program_name: program,
      enrollment_year: year,
      academic_year: new Date().getFullYear(),
      semester: 'Fall',
      status: 'active',
      department: department || 'General',
      created_at: new Date()
    };
    
    const result = await db.collection('students').insertOne(newStudent);
    res.status(201).json({ ...newStudent, _id: result.insertedId });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    const { full_name, program, year, status } = req.body;
    
    const result = await db.collection('students').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          full_name, 
          program_name: program, 
          enrollment_year: year, 
          status,
          updated_at: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    
    const result = await db.collection('students').findOneAndDelete(
      { _id: new mongoose.Types.ObjectId(id) }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;