const express = require('express');
const router = express.Router();

// Student dashboard endpoint
router.get('/dashboard/:program/:year/:id', (req, res) => {
  const { program, year, id } = req.params;
  
  res.json({
    student: {
      id: `${program}/${year}/${id}`,
      name: 'Demo Student',
      program: program,
      year: year,
      gpa: 3.75
    },
    courses: [
      { code: 'CS301', name: 'Database Systems', grade: 'A-', credits: 3 },
      { code: 'CS302', name: 'Software Engineering', grade: 'B+', credits: 3 },
      { code: 'CS303', name: 'Web Development', grade: 'A', credits: 3 }
    ],
    assignments: [
      { id: 1, title: 'Database Project', dueDate: '2024-02-15', status: 'Pending' },
      { id: 2, title: 'Software Design', dueDate: '2024-02-20', status: 'Submitted' }
    ],
    announcements: [
      { id: 1, title: 'Exam Schedule Released', date: '2024-01-15' },
      { id: 2, title: 'Library Hours Extended', date: '2024-01-10' }
    ]
  });
});

// Student assignments endpoint
router.get('/assignments/:studentId', (req, res) => {
  res.json([
    {
      id: 'ASG001',
      title: 'Database Design Project',
      course: 'CS301',
      dueDate: '2024-02-15',
      status: 'Pending',
      grade: null
    },
    {
      id: 'ASG002',
      title: 'Algorithm Analysis',
      course: 'CS302',
      dueDate: '2024-02-10',
      status: 'Graded',
      grade: 85
    }
  ]);
});

// Student communications endpoint
router.get('/communications/:studentId', (req, res) => {
  res.json({
    messages: [
      { id: 1, from: 'Dr. Smith', subject: 'Assignment Feedback', date: '2024-01-15', unread: true },
      { id: 2, from: 'Admin', subject: 'Fee Payment Reminder', date: '2024-01-10', unread: false }
    ],
    announcements: [
      { id: 1, title: 'Exam Schedule', content: 'Final exams start Feb 20', date: '2024-01-15' },
      { id: 2, title: 'Holiday Notice', content: 'Campus closed Jan 25', date: '2024-01-12' }
    ]
  });
});

module.exports = router;