const express = require('express');
const router = express.Router();

// Mock students data
const mockStudents = [
  {
    id: 1,
    student_id: 'STU001',
    full_name: 'John Doe',
    email: 'john.doe@university.edu',
    program: 'Computer Science',
    year: 3,
    status: 'active',
    department_name: 'Computer Science',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    student_id: 'STU002',
    full_name: 'Jane Smith',
    email: 'jane.smith@university.edu',
    program: 'Business Administration',
    year: 2,
    status: 'active',
    department_name: 'Business',
    created_at: new Date().toISOString()
  }
];

// Get all students
router.get('/', async (req, res) => {
  try {
    res.json(mockStudents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = mockStudents.find(s => s.id === parseInt(id));
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    const { username, email, full_name, student_id, program, year } = req.body;
    
    const newStudent = {
      id: mockStudents.length + 1,
      student_id,
      full_name,
      email,
      program,
      year,
      status: 'active',
      department_name: 'General',
      created_at: new Date().toISOString()
    };
    
    mockStudents.push(newStudent);
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, program, year, status } = req.body;
    
    const studentIndex = mockStudents.findIndex(s => s.id === parseInt(id));
    
    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    mockStudents[studentIndex] = {
      ...mockStudents[studentIndex],
      full_name: full_name || mockStudents[studentIndex].full_name,
      program: program || mockStudents[studentIndex].program,
      year: year || mockStudents[studentIndex].year,
      status: status || mockStudents[studentIndex].status
    };
    
    res.json(mockStudents[studentIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const studentIndex = mockStudents.findIndex(s => s.id === parseInt(id));
    
    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    mockStudents.splice(studentIndex, 1);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;