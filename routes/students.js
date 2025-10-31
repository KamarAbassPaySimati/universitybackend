const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.full_name, u.email, d.name as department_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { username, email, full_name, student_id, department_id, program, year } = req.body;
    
    // Create user
    const userResult = await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, 'student')
      RETURNING id
    `, [username, email, '$2a$10$defaulthash', full_name]);
    
    // Create student
    const studentResult = await client.query(`
      INSERT INTO students (user_id, student_id, department_id, program, year, admission_date)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
      RETURNING *
    `, [userResult.rows[0].id, student_id, department_id, program, year]);
    
    await client.query('COMMIT');
    res.status(201).json(studentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, program, year, status } = req.body;
    
    const result = await pool.query(`
      UPDATE students s
      SET program = $2, year = $3, status = $4
      FROM users u
      WHERE s.id = $1 AND s.user_id = u.id
      RETURNING s.*
    `, [id, program, year, status]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;