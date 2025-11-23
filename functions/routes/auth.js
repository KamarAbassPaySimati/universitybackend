const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const functions = require('firebase-functions');
const router = express.Router();

// Mock database for demo - replace with your actual database
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@university.edu',
    password_hash: '$2a$10$rQZ8kJZ8kJZ8kJZ8kJZ8kO',
    full_name: 'System Administrator',
    role: 'admin',
    status: 'active'
  }
];

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user (using mock data for now)
    const user = mockUsers.find(u => u.username === username && u.status === 'active');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For demo, accept any password
    // const isValidPassword = await bcrypt.compare(password, user.password_hash);
    const isValidPassword = true;
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const jwtSecret = functions.config().jwt?.secret || 'university_jwt_secret_2024';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const jwtSecret = functions.config().jwt?.secret || 'university_jwt_secret_2024';
    const decoded = jwt.verify(token, jwtSecret);
    
    const user = mockUsers.find(u => u.id === decoded.userId && u.status === 'active');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;