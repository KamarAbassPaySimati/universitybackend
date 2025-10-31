const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get counts
    const studentsCount = await pool.query('SELECT COUNT(*) FROM students WHERE status = $1', ['active']);
    const facultyCount = await pool.query('SELECT COUNT(*) FROM faculty');
    const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
    const departmentsCount = await pool.query('SELECT COUNT(*) FROM departments');
    
    // Get recent enrollments
    const recentEnrollments = await pool.query(`
      SELECT COUNT(*) as count, DATE(e.created_at) as date
      FROM enrollments e
      WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(e.created_at)
      ORDER BY date DESC
      LIMIT 7
    `);
    
    // Get grade distribution
    const gradeDistribution = await pool.query(`
      SELECT letter_grade, COUNT(*) as count
      FROM grades
      WHERE letter_grade IS NOT NULL
      GROUP BY letter_grade
      ORDER BY letter_grade
    `);
    
    // Get department stats
    const departmentStats = await pool.query(`
      SELECT d.name, 
        COUNT(s.id) as student_count,
        COUNT(f.id) as faculty_count
      FROM departments d
      LEFT JOIN students s ON d.id = s.department_id AND s.status = 'active'
      LEFT JOIN faculty f ON d.id = f.department_id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);
    
    res.json({
      totals: {
        students: parseInt(studentsCount.rows[0].count),
        faculty: parseInt(facultyCount.rows[0].count),
        courses: parseInt(coursesCount.rows[0].count),
        departments: parseInt(departmentsCount.rows[0].count)
      },
      recentEnrollments: recentEnrollments.rows,
      gradeDistribution: gradeDistribution.rows,
      departmentStats: departmentStats.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;