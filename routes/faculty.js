const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get all faculty
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get faculty from existing collection or create sample data
    let faculty = await db.collection('faculty').find({}).toArray();
    
    // If no faculty exists, create sample data based on courses
    if (faculty.length === 0) {
      const courses = await db.collection('grades').distinct('courseCode');
      const sampleFaculty = courses.slice(0, 10).map((course, index) => ({
        faculty_id: `FAC${String(index + 1).padStart(3, '0')}`,
        full_name: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][index]}`,
        email: `faculty${index + 1}@university.edu`,
        department: course.split(' ')[0] || 'General Studies',
        position: ['Professor', 'Associate Professor', 'Assistant Professor'][index % 3],
        specialization: course,
        hire_date: new Date(2015 + (index % 8), index % 12, 1),
        status: 'active',
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        office: `Room ${100 + index}`,
        created_at: new Date()
      }));
      
      if (sampleFaculty.length > 0) {
        await db.collection('faculty').insertMany(sampleFaculty);
        faculty = sampleFaculty;
      }
    }
    
    res.json(faculty);
  } catch (error) {
    console.error('Faculty fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get departments
router.get('/departments', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get departments from grades and faculty data
    const departments = await db.collection('grades').aggregate([
      {
        $group: {
          _id: { $arrayElemAt: [{ $split: ['$courseCode', ' '] }, 0] },
          student_count: { $addToSet: '$registrationNumber' },
          courses: { $addToSet: '$courseCode' }
        }
      },
      {
        $lookup: {
          from: 'faculty',
          localField: '_id',
          foreignField: 'department',
          as: 'faculty_members'
        }
      },
      {
        $project: {
          dept_code: '$_id',
          name: '$_id',
          student_count: { $size: '$student_count' },
          faculty_count: { $size: '$faculty_members' },
          course_count: { $size: '$courses' },
          head_name: 'Department Head',
          established_year: 2000,
          budget: { $multiply: [{ $size: '$student_count' }, 50000] }
        }
      },
      { $sort: { name: 1 } }
    ]).toArray();
    
    res.json(departments);
  } catch (error) {
    console.error('Departments fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create department
router.post('/departments', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { dept_code, name, head_id, established_year, budget } = req.body;
    
    const newDepartment = {
      dept_code,
      name,
      head_id,
      established_year: established_year || new Date().getFullYear(),
      budget: budget || 100000,
      created_at: new Date()
    };
    
    const result = await db.collection('departments').insertOne(newDepartment);
    res.status(201).json({ ...newDepartment, _id: result.insertedId });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update department
router.put('/departments/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    const { name, head_id, established_year, budget } = req.body;
    
    const result = await db.collection('departments').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          name, 
          head_id, 
          established_year, 
          budget,
          updated_at: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;