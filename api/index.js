const express = require('express');
const mongoose = require('mongoose');

const app = express();

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      isConnected = true;
      console.log('✅ Connected to MongoDB');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data for testing
const mockStudents = [
  {
    id: 1,
    student_id: 'STU001',
    full_name: 'John Doe',
    email: 'john.doe@university.edu',
    program: 'Computer Science',
    year: 3,
    status: 'active'
  }
];

// Routes
app.get('/api/health', async (req, res) => {
  await connectDB();
  res.json({ 
    status: 'OK', 
    message: 'University Management System API on Vercel',
    mongodb: isConnected ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/test-mongo', async (req, res) => {
  try {
    await connectDB();
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ 
      status: 'MongoDB Connected', 
      collections: collections.map(c => c.name),
      dbName: mongoose.connection.db.databaseName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin') {
    res.json({
      token: 'demo-token-123',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@university.edu',
        full_name: 'System Administrator',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token === 'demo-token-123') {
    res.json({
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@university.edu',
        full_name: 'System Administrator',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    await connectDB();
    // Return mock data with correct field names
    const students = mockStudents.map(student => ({
      ...student,
      studentName: student.full_name, // Add studentName field
      studentId: student.student_id   // Add studentId field
    }));
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalStudents: 1250,
    totalFaculty: 85,
    totalCourses: 120,
    activeEnrollments: 3500
  });
});

app.get('/api/faculty', (req, res) => {
  res.json([
    {
      id: 1,
      faculty_id: 'FAC001',
      full_name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      department: 'Computer Science',
      position: 'Professor'
    }
  ]);
});

// Academic routes
app.get('/api/academics/grades', async (req, res) => {
  await connectDB();
  res.json([
    {
      id: 1,
      student_id: 'STU001',
      course_code: 'CS101',
      assignment1: 18,
      assignment2: 17,
      mid_sem: 19,
      end_sem: 55,
      total: 109,
      letter_grade: 'A'
    }
  ]);
});

app.get('/api/academics/courses', async (req, res) => {
  await connectDB();
  res.json([
    {
      id: 1,
      course_code: 'CS101',
      title: 'Introduction to Computer Science',
      credits: 3,
      department: 'Computer Science'
    },
    {
      id: 2,
      course_code: 'MATH101',
      title: 'Calculus I',
      credits: 4,
      department: 'Mathematics'
    }
  ]);
});

app.get('/api/academics/courses/codes', async (req, res) => {
  await connectDB();
  res.json([
    { code: 'CS101', title: 'Introduction to Computer Science' },
    { code: 'MATH101', title: 'Calculus I' },
    { code: 'ENG101', title: 'English Composition' }
  ]);
});

app.get('/api/academics/transcripts', async (req, res) => {
  await connectDB();
  res.json([
    {
      id: 1,
      student_id: 'STU001',
      semester: 'Fall 2023',
      courses: [
        { course_code: 'CS101', title: 'Intro to CS', credits: 3, grade: 'A' },
        { course_code: 'MATH101', title: 'Calculus I', credits: 4, grade: 'B+' }
      ],
      gpa: 3.7
    }
  ]);
});

// Grades by course route
app.get('/api/academics/grades/course/:courseCode', async (req, res) => {
  await connectDB();
  const { courseCode } = req.params;
  
  // Return grades for specific course with correct field names
  res.json([
    {
      id: 1,
      student_id: 'STU001',
      studentId: 'STU001',
      student_name: 'John Doe',
      studentName: 'John Doe',
      course_code: courseCode,
      courseCode: courseCode,
      assignment1: 18,
      assignment2: 17,
      mid_sem: 19,
      end_sem: 55,
      total: 109,
      letter_grade: 'A'
    },
    {
      id: 2,
      student_id: 'STU002',
      studentId: 'STU002',
      student_name: 'Jane Smith',
      studentName: 'Jane Smith',
      course_code: courseCode,
      courseCode: courseCode,
      assignment1: 16,
      assignment2: 18,
      mid_sem: 17,
      end_sem: 52,
      total: 103,
      letter_grade: 'B+'
    }
  ]);
});

// Catch all handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;