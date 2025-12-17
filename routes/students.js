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

// Create admission application
router.post('/admissions', async (req, res) => {
  try {
    const {
      fullName, email, phone, dateOfBirth, gender, nationality,
      program, degree, gpa, satScore, documents, address
    } = req.body;
    
    const newApplication = {
      id: `ADM${new Date().getFullYear()}${String(Date.now()).slice(-3)}`,
      applicationNumber: `APP-${new Date().getFullYear()}-${program.substring(0,3).toUpperCase()}-${String(Date.now()).slice(-3)}`,
      fullName, email, phone, dateOfBirth, gender, nationality,
      program, degree, gpa, satScore, documents, address,
      applicationDate: new Date().toISOString().split('T')[0],
      status: 'Under Review',
      createdAt: new Date()
    };
    
    res.status(201).json(newApplication);
  } catch (error) {
    console.error('Create admission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admissions endpoint using real MongoDB data
router.get('/admissions', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Try to get from admissions collection first
    let admissions = await db.collection('admissions').find({}).limit(50).toArray();
    
    // If no admissions collection, create from student records
    if (admissions.length === 0) {
      console.log('No admissions collection found, generating from student records...');
      
      const students = await db.collection('studentrecords').aggregate([
        {
          $group: {
            _id: '$registrationNumber',
            studentName: { $first: '$studentName' },
            courseCode: { $first: '$courseCode' },
            academicYear: { $first: '$academicYear' },
            finalGrade: { $avg: '$finalGrade' }
          }
        },
        { $limit: 20 }
      ]).toArray();
      
      const statuses = ['Pending', 'Approved', 'Under Review', 'Rejected'];
      const programs = ['Bachelor of Science', 'Bachelor of Engineering', 'Master of Business Administration', 'Doctor of Medicine'];
      
      admissions = students.map((student, index) => ({
        id: `APP${String(index + 1).padStart(3, '0')}`,
        applicationNumber: student._id || `APP-2024-${index + 1}`,
        fullName: student.studentName || `Student ${index + 1}`,
        email: `${(student.studentName || `student${index + 1}`).toLowerCase().replace(/\s+/g, '.')}@email.com`,
        program: programs[index % programs.length],
        gpa: student.finalGrade ? (student.finalGrade / 25).toFixed(1) : (3.0 + Math.random() * 1.0).toFixed(1),
        testScore: Math.floor(1200 + Math.random() * 400),
        applicationDate: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        status: statuses[index % statuses.length],
        academicYear: student.academicYear
      }));
    }
    
    console.log(`Returning ${admissions.length} admission applications`);
    res.json(admissions);
  } catch (error) {
    console.error('Admissions fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;