const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all faculty
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, u.full_name, u.email, d.name as department_name
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN departments d ON f.department_id = d.id
      ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get departments
router.get('/departments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.full_name as head_name,
        (SELECT COUNT(*) FROM faculty WHERE department_id = d.id) as faculty_count,
        (SELECT COUNT(*) FROM students WHERE department_id = d.id) as student_count
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      ORDER BY d.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create department
router.post('/departments', async (req, res) => {
  try {
    const { dept_code, name, head_id, established_year, budget } = req.body;
    const result = await pool.query(`
      INSERT INTO departments (dept_code, name, head_id, established_year, budget)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [dept_code, name, head_id, established_year, budget]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update department
router.put('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, head_id, established_year, budget } = req.body;
    
    const result = await pool.query(`
      UPDATE departments 
      SET name = $2, head_id = $3, established_year = $4, budget = $5
      WHERE id = $1
      RETURNING *
    `, [id, name, head_id, established_year, budget]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;