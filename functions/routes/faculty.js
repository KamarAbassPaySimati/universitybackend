const express = require('express');
const router = express.Router();

const mockFaculty = [
  {
    id: 1,
    faculty_id: 'FAC001',
    full_name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    department: 'Computer Science',
    position: 'Professor',
    hire_date: '2020-01-15'
  }
];

router.get('/', (req, res) => {
  res.json(mockFaculty);
});

module.exports = router;