const express = require('express');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, full_name, role, status, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { username, email, full_name, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, status, created_at
    `, [username, email, hashedPassword, full_name, role]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, status } = req.body;
    
    const result = await pool.query(`
      UPDATE users 
      SET full_name = $2, role = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, full_name, role, status, created_at
    `, [id, full_name, role, status]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports data
router.get('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let result;
    
    switch (type) {
      case 'enrollment':
        result = await pool.query(`
          SELECT d.name as department, 
            COUNT(s.id) as total_students,
            COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_students
          FROM departments d
          LEFT JOIN students s ON d.id = s.department_id
          GROUP BY d.id, d.name
          ORDER BY d.name
        `);
        break;
        
      case 'academic':
        result = await pool.query(`
          SELECT d.name as department,
            AVG(g.gpa) as avg_gpa,
            COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) as distinction_count
          FROM departments d
          LEFT JOIN students s ON d.id = s.department_id
          LEFT JOIN enrollments e ON s.id = e.student_id
          LEFT JOIN grades g ON e.id = g.enrollment_id
          GROUP BY d.id, d.name
          ORDER BY d.name
        `);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;