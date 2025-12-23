const express = require('express');
const router = express.Router();

// Dashboard stats endpoint
router.get('/stats', (req, res) => {
  res.json({
    totalStudents: 1250,
    totalFaculty: 85,
    totalCourses: 120,
    totalDepartments: 8,
    activeEnrollments: 1180,
    pendingApplications: 45
  });
});

// Enrollment trends endpoint
router.get('/enrollment-trends', (req, res) => {
  res.json([
    { month: 'Jan', students: 1100 },
    { month: 'Feb', students: 1150 },
    { month: 'Mar', students: 1200 },
    { month: 'Apr', students: 1250 },
    { month: 'May', students: 1220 },
    { month: 'Jun', students: 1180 }
  ]);
});

// General trends endpoint
router.get('/trends', (req, res) => {
  res.json({
    studentGrowth: 8.5,
    facultyGrowth: 3.2,
    courseCompletion: 92.1,
    satisfaction: 4.3
  });
});

module.exports = router;