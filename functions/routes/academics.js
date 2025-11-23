const express = require('express');
const router = express.Router();

const mockCourses = [
  {
    id: 1,
    course_code: 'CS101',
    title: 'Introduction to Computer Science',
    credits: 3,
    department: 'Computer Science'
  }
];

router.get('/courses', (req, res) => {
  res.json(mockCourses);
});

module.exports = router;