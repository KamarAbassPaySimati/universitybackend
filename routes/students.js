const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    console.log('Fetching students from studentrecords collection...');
    
    // Get unique students from studentrecords collection (limit to first 100 for performance)
    const students = await db.collection('studentrecords').aggregate([
      {
        $group: {
          _id: '$registrationNumber',
          studentName: { $first: '$studentName' },
          courseCode: { $first: '$courseCode' },
          academicYear: { $first: '$academicYear' },
          semester: { $first: '$semester' },
          yearOfStudy: { $first: '$yearOfStudy' },
          finalGrade: { $avg: '$finalGrade' },
          totalCourses: { $sum: 1 },
          courses: { $push: { course: '$courseCode', grade: '$finalGrade' } }
        }
      },
      {
        $project: {
          student_id: '$_id',
          full_name: { $trim: { input: '$studentName' } },
          program_name: { $arrayElemAt: [{ $split: ['$_id', '/'] }, 0] }, // Extract program from registration number
          academic_year: '$academicYear',
          semester: '$semester',
          enrollment_year: '$yearOfStudy',
          status: 'active',
          email: { 
            $concat: [
              { $toLower: { $replaceAll: { input: { $trim: { input: '$studentName' } }, find: ' ', replacement: '.' } } }, 
              '@university.edu'
            ] 
          },
          total_courses: '$totalCourses',
          average_grade: { $round: ['$finalGrade', 1] }
        }
      },
      { $sort: { student_id: 1 } },
      { $limit: 100 } // Limit for performance
    ]).toArray();
    
    console.log(`Found ${students.length} unique students`);
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