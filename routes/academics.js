const express = require('express');
const pool = require('../config/database');
const Grade = require('../models/Grade');
const mongoose = require('mongoose');
const router = express.Router();

// Debug endpoint to list collections
router.get('/debug/collections', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json(collections.map(c => c.name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check raw data
router.get('/debug/raw-data', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const result = {};
    
    for (const collection of collections) {
      const data = await db.collection(collection.name).find({}).limit(5).toArray();
      result[collection.name] = data;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all grades from MongoDB
router.get('/grades', async (req, res) => {
  try {
    console.log('Fetching grades from studentrecords collection...');
    
    // Try direct database query to studentrecords collection
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const rawData = await db.collection('studentrecords').find({}).toArray();
    console.log('Raw data from studentrecords:', rawData.length, 'records');
    console.log('Sample record:', rawData[0]);
    
    res.json(rawData);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get grades by course code
router.get('/grades/course/:courseCode', async (req, res) => {
  try {
    const { courseCode } = req.params;
    const grades = await Grade.find({ courseCode }).sort({ studentName: 1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique course codes
router.get('/courses/codes', async (req, res) => {
  try {
    const courses = await Grade.aggregate([
      {
        $group: {
          _id: '$courseCode',
          courseName: { $first: '$courseName' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(courses.map(course => ({
      code: course._id,
      name: course.courseName,
      studentCount: course.count
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed course information
router.get('/courses/detailed', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const courses = await db.collection('studentrecords').aggregate([
      {
        $group: {
          _id: '$courseCode',
          courseName: { $first: '$courseName' },
          studentCount: { $sum: 1 },
          averageGrade: { $avg: '$finalGrade' },
          semesters: { $addToSet: '$semester' },
          academicYears: { $addToSet: '$academicYear' },
          yearOfStudy: { $first: '$yearOfStudy' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    const formattedCourses = courses.map((course, index) => ({
      id: index + 1,
      code: course._id,
      name: course.courseName,
      credits: course.yearOfStudy || 3, // Default to 3 credits
      program: course._id.startsWith('ACC') ? 'Accounting' : 
               course._id.startsWith('BUS') ? 'Business' :
               course._id.startsWith('DP') ? 'Development Studies' :
               course._id.startsWith('ENG') ? 'English' :
               course._id.startsWith('MATH') ? 'Mathematics' :
               course._id.startsWith('CS') ? 'Computer Science' : 'General',
      faculty: 'Faculty Member', // Default faculty
      semester: course.semesters[0] || 'Semester 1',
      studentCount: course.studentCount,
      averageGrade: Math.round(course.averageGrade * 10) / 10,
      academicYears: course.academicYears
    }));
    
    res.json(formattedCourses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transcript data for students (fast approach)
router.get('/transcripts', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    // Just get first 50 records directly - super fast
    const records = await db.collection('studentrecords').find({}).limit(50).toArray();
    
    // Create unique students from these records
    const studentMap = new Map();
    
    records.forEach(record => {
      const regNumber = record.registrationNumber;
      if (!studentMap.has(regNumber)) {
        const programCode = regNumber.split('/')[0];
        let programName;
        
        switch (programCode) {
          case 'BBA': programName = 'Bachelor of Business Administration'; break;
          case 'DIP': programName = 'Diploma in Business Studies'; break;
          case 'LSM': programName = 'Bachelor of Logistics and Supply Management'; break;
          case 'BCD': programName = 'Bachelor of Community Development'; break;
          case 'HRM': programName = 'Bachelor of Human Resource Management'; break;
          case 'BAC': programName = 'Bachelor of Accounting'; break;
          default: programName = `${programCode} Program`;
        }
        
        const gpa = record.finalGrade >= 80 ? 4.0 :
                    record.finalGrade >= 70 ? 3.0 :
                    record.finalGrade >= 60 ? 2.0 :
                    record.finalGrade >= 50 ? 1.0 : 0.0;
        
        studentMap.set(regNumber, {
          id: studentMap.size + 1,
          studentId: regNumber,
          studentName: record.studentName.trim(),
          program: programName,
          year: record.yearOfStudy,
          cumulativeGPA: gpa,
          totalCredits: 120, // Default
          averageGrade: record.finalGrade,
          courseCount: 1,
          courses: [record]
        });
      }
    });
    
    const students = Array.from(studentMap.values());
    res.json(students);
  } catch (error) {
    console.error('Transcripts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get academic programs based on registration numbers
router.get('/programs', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const programs = await db.collection('studentrecords').aggregate([
      {
        $addFields: {
          programCode: {
            $arrayElemAt: [
              { $split: ['$registrationNumber', '/'] },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$programCode',
          studentCount: { $sum: 1 },
          averageGrade: { $avg: '$finalGrade' },
          academicYears: { $addToSet: '$academicYear' },
          sampleRegistration: { $first: '$registrationNumber' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    const formattedPrograms = programs.map((program, index) => {
      const programCode = program._id;
      let programName, department, level, duration, totalCredits;
      
      // Determine program details based on code
      switch (programCode) {
        case 'BBA':
          programName = 'Bachelor of Business Administration';
          department = 'Business';
          level = 'Undergraduate';
          duration = '4 years';
          totalCredits = 120;
          break;
        case 'DIP':
          programName = 'Diploma in Business Studies';
          department = 'Business';
          level = 'Diploma';
          duration = '2 years';
          totalCredits = 60;
          break;
        case 'LSM':
          programName = 'Bachelor of Logistics and Supply Management';
          department = 'Business';
          level = 'Undergraduate';
          duration = '4 years';
          totalCredits = 120;
          break;
        case 'BCD':
          programName = 'Bachelor of Community Development';
          department = 'Development Studies';
          level = 'Undergraduate';
          duration = '4 years';
          totalCredits = 120;
          break;
        case 'HRM':
          programName = 'Bachelor of Human Resource Management';
          department = 'Business';
          level = 'Undergraduate';
          duration = '4 years';
          totalCredits = 120;
          break;
        case 'BAC':
          programName = 'Bachelor of Accounting';
          department = 'Accounting';
          level = 'Undergraduate';
          duration = '4 years';
          totalCredits = 120;
          break;
        default:
          programName = `${programCode} Program`;
          department = 'General';
          level = 'Undergraduate';
          duration = '4 years';
          totalCredits = 120;
      }
      
      // Calculate capacity (assuming max 500 per program)
      const maxCapacity = 500;
      const enrollmentPercentage = Math.round((program.studentCount / maxCapacity) * 100);
      
      return {
        id: index + 1,
        code: programCode,
        name: programName,
        department,
        level,
        duration,
        credits: totalCredits,
        enrollment: program.studentCount,
        maxCapacity,
        enrollmentPercentage,
        status: program.studentCount > 0 ? 'Active' : 'Inactive',
        averageGrade: Math.round(program.averageGrade * 10) / 10,
        academicYears: program.academicYears
      };
    });
    
    res.json(formattedPrograms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const courses = await db.collection('studentrecords').aggregate([
      {
        $group: {
          _id: '$courseCode',
          courseName: { $first: '$courseName' },
          studentCount: { $sum: 1 },
          averageGrade: { $avg: '$finalGrade' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    const formattedCourses = courses.map((course, index) => ({
      id: index + 1,
      course_code: course._id,
      name: course.courseName,
      department_name: course._id.split(' ')[0] || 'General',
      credits: 3,
      student_count: course.studentCount,
      average_grade: Math.round(course.averageGrade * 10) / 10
    }));
    
    res.json(formattedCourses);
  } catch (error) {
    console.error('Courses fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get grades for a course
router.get('/grades/:courseId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const { courseId } = req.params;
    
    const grades = await db.collection('studentrecords')
      .find({ courseCode: courseId })
      .sort({ studentName: 1 })
      .toArray();
    
    const formattedGrades = grades.map((grade, index) => ({
      id: index + 1,
      student_id: grade.registrationNumber,
      student_name: grade.studentName,
      course_code: grade.courseCode,
      course_name: grade.courseName,
      assignment1: Math.round(grade.finalGrade * 0.2),
      assignment2: Math.round(grade.finalGrade * 0.2),
      mid_sem: Math.round(grade.finalGrade * 0.3),
      end_sem: Math.round(grade.finalGrade * 0.3),
      letter_grade: grade.finalGrade >= 80 ? 'A' : grade.finalGrade >= 70 ? 'B' : grade.finalGrade >= 60 ? 'C' : 'D',
      gpa: grade.finalGrade >= 80 ? 4.0 : grade.finalGrade >= 70 ? 3.0 : grade.finalGrade >= 60 ? 2.0 : 1.0
    }));
    
    res.json(formattedGrades);
  } catch (error) {
    console.error('Course grades fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update grade
router.put('/grades/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const { id } = req.params;
    const { assignment1, assignment2, mid_sem, end_sem } = req.body;
    
    // Calculate letter grade and GPA
    const total = (assignment1 || 0) + (assignment2 || 0) + (mid_sem || 0) + (end_sem || 0);
    let letter_grade = 'F';
    let gpa = 0.0;
    
    if (total >= 90) { letter_grade = 'A+'; gpa = 4.0; }
    else if (total >= 85) { letter_grade = 'A'; gpa = 4.0; }
    else if (total >= 80) { letter_grade = 'B+'; gpa = 3.3; }
    else if (total >= 75) { letter_grade = 'B'; gpa = 3.0; }
    else if (total >= 70) { letter_grade = 'C+'; gpa = 2.7; }
    else if (total >= 65) { letter_grade = 'C'; gpa = 2.3; }
    else if (total >= 60) { letter_grade = 'D'; gpa = 2.0; }
    
    const result = await db.collection('studentrecords').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          assignment1, 
          assignment2, 
          mid_sem, 
          end_sem, 
          letter_grade, 
          gpa,
          finalGrade: total,
          updated_at: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Grade not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get attendance for a course
router.get('/attendance/:courseId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const { courseId } = req.params;
    
    // Get students enrolled in the course
    const students = await db.collection('studentrecords')
      .find({ courseCode: courseId })
      .sort({ studentName: 1 })
      .toArray();
    
    // Generate mock attendance data based on grades
    const attendanceData = students.map(student => {
      const attendancePercentage = Math.max(50, Math.min(100, student.finalGrade + Math.random() * 10));
      const totalClasses = 30; // Assume 30 classes per semester
      const attendedClasses = Math.round((attendancePercentage / 100) * totalClasses);
      
      return {
        student_id: student.registrationNumber,
        student_name: student.studentName,
        total_classes: totalClasses,
        attended_classes: attendedClasses,
        attendance_percentage: Math.round(attendancePercentage * 100) / 100
      };
    });
    
    res.json(attendanceData);
  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;