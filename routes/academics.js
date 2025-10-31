const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, d.name as department_name
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.course_code
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get grades for a course
router.get('/grades/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(`
      SELECT g.*, s.student_id, u.full_name as student_name, c.course_code, c.name as course_name
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE c.id = $1
      ORDER BY u.full_name
    `, [courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update grade
router.put('/grades/:id', async (req, res) => {
  try {
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
    
    const result = await pool.query(`
      UPDATE grades 
      SET assignment1 = $2, assignment2 = $3, mid_sem = $4, end_sem = $5, 
          letter_grade = $6, gpa = $7
      WHERE id = $1
      RETURNING *
    `, [id, assignment1, assignment2, mid_sem, end_sem, letter_grade, gpa]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grade not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance for a course
router.get('/attendance/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(`
      SELECT s.student_id, u.full_name as student_name,
        COUNT(a.id) as total_classes,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as attended_classes,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2
        ) as attendance_percentage
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON e.id = a.enrollment_id
      WHERE e.course_id = $1
      GROUP BY s.id, s.student_id, u.full_name
      ORDER BY u.full_name
    `, [courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;