const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get student dashboard data
router.get('/dashboard/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = mongoose.connection.db;
    
    // Get student's courses and grades
    const studentRecords = await db.collection('studentrecords').find({
      registrationNumber: studentId
    }).toArray();
    
    if (studentRecords.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Calculate statistics
    const totalCourses = studentRecords.length;
    const completedCourses = studentRecords.filter(r => r.finalGrade > 0).length;
    const averageGrade = studentRecords.reduce((sum, r) => sum + (r.finalGrade || 0), 0) / totalCourses;
    const currentSemester = studentRecords[0].semester;
    const academicYear = studentRecords[0].academicYear;
    
    // Get recent grades (last 5)
    const recentGrades = studentRecords
      .filter(r => r.finalGrade > 0)
      .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()))
      .slice(0, 5)
      .map(r => ({
        course: r.courseName,
        courseCode: r.courseCode,
        grade: r.finalGrade,
        semester: r.semester,
        year: r.academicYear
      }));
    
    // Get current courses (no grade yet)
    const currentCourses = studentRecords
      .filter(r => !r.finalGrade || r.finalGrade === 0)
      .map(r => ({
        courseCode: r.courseCode,
        courseName: r.courseName,
        semester: r.semester,
        year: r.academicYear,
        status: 'In Progress'
      }));
    
    res.json({
      student: {
        id: studentId,
        name: studentRecords[0].studentName,
        currentSemester,
        academicYear
      },
      statistics: {
        totalCourses,
        completedCourses,
        averageGrade: Math.round(averageGrade * 10) / 10,
        gpa: Math.round((averageGrade / 20) * 4 * 10) / 10 // Convert to 4.0 scale
      },
      recentGrades,
      currentCourses: currentCourses.slice(0, 5)
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student's courses
router.get('/courses/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = mongoose.connection.db;
    
    const courses = await db.collection('studentrecords').find({
      registrationNumber: studentId
    }).toArray();
    
    const formattedCourses = courses.map(course => ({
      courseCode: course.courseCode,
      courseName: course.courseName,
      semester: course.semester,
      academicYear: course.academicYear,
      yearOfStudy: course.yearOfStudy,
      finalGrade: course.finalGrade || 0,
      status: course.finalGrade > 0 ? 'Completed' : 'In Progress',
      gradeText: course.finalGrade > 0 ? getGradeText(course.finalGrade) : 'Pending'
    }));
    
    res.json(formattedCourses);
  } catch (error) {
    console.error('Student courses error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student's grades
router.get('/grades/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = mongoose.connection.db;
    
    const grades = await db.collection('studentrecords').find({
      registrationNumber: studentId,
      finalGrade: { $gt: 0 }
    }).sort({ academicYear: -1, semester: -1 }).toArray();
    
    const formattedGrades = grades.map(grade => ({
      courseCode: grade.courseCode,
      courseName: grade.courseName,
      semester: grade.semester,
      academicYear: grade.academicYear,
      finalGrade: grade.finalGrade,
      gradeText: getGradeText(grade.finalGrade),
      points: calculateGradePoints(grade.finalGrade)
    }));
    
    // Calculate GPA
    const totalPoints = formattedGrades.reduce((sum, g) => sum + g.points, 0);
    const gpa = totalPoints / formattedGrades.length;
    
    res.json({
      grades: formattedGrades,
      gpa: Math.round(gpa * 100) / 100,
      totalCourses: formattedGrades.length
    });
  } catch (error) {
    console.error('Student grades error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student profile
router.get('/profile/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = mongoose.connection.db;
    
    const studentRecord = await db.collection('studentrecords').findOne({
      registrationNumber: studentId
    });
    
    if (!studentRecord) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get all courses for this student to calculate stats
    const allRecords = await db.collection('studentrecords').find({
      registrationNumber: studentId
    }).toArray();
    
    const completedCourses = allRecords.filter(r => r.finalGrade > 0);
    const averageGrade = completedCourses.length > 0 
      ? completedCourses.reduce((sum, r) => sum + r.finalGrade, 0) / completedCourses.length 
      : 0;
    
    res.json({
      studentId: studentRecord.registrationNumber,
      name: studentRecord.studentName,
      email: `${studentRecord.registrationNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@university.edu`,
      academicYear: studentRecord.academicYear,
      semester: studentRecord.semester,
      yearOfStudy: studentRecord.yearOfStudy,
      program: extractProgramFromId(studentRecord.registrationNumber),
      totalCourses: allRecords.length,
      completedCourses: completedCourses.length,
      averageGrade: Math.round(averageGrade * 10) / 10,
      gpa: Math.round((averageGrade / 20) * 4 * 10) / 10,
      status: 'Active'
    });
  } catch (error) {
    console.error('Student profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update student profile
router.put('/profile/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { email, phone, address } = req.body;
    
    // For now, we'll store additional profile info in a separate collection
    const db = mongoose.connection.db;
    
    const profileUpdate = {
      studentId,
      email,
      phone,
      address,
      updatedAt: new Date()
    };
    
    await db.collection('student_profiles').findOneAndUpdate(
      { studentId },
      { $set: profileUpdate },
      { upsert: true, returnDocument: 'after' }
    );
    
    res.json({ message: 'Profile updated successfully', profile: profileUpdate });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function getGradeText(score) {
  if (score >= 18) return 'Distinction';
  if (score >= 15) return 'Credit';
  if (score >= 12) return 'Pass';
  if (score >= 10) return 'Marginal Pass';
  return 'Fail';
}

function calculateGradePoints(score) {
  if (score >= 18) return 4.0;
  if (score >= 15) return 3.0;
  if (score >= 12) return 2.0;
  if (score >= 10) return 1.0;
  return 0.0;
}

function extractProgramFromId(registrationNumber) {
  // Extract program from registration number pattern
  const parts = registrationNumber.split('/');
  return parts[0] || 'General Studies';
}

module.exports = router;