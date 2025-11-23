const express = require('express');
const router = express.Router();

router.get('/stats', (req, res) => {
  res.json({
    totalStudents: 1250,
    totalFaculty: 85,
    totalCourses: 120,
    activeEnrollments: 3500
  });
});

module.exports = router;