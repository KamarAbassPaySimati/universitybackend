const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = mongoose.connection.db;
    
    // Find user or create default admin user
    let user = await db.collection('users').findOne({ 
      username: username, 
      status: 'active' 
    });
    
    // If no user found and it's admin, create default admin
    if (!user && username === 'admin') {
      const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
      const defaultAdmin = {
        username: 'admin',
        email: 'admin@university.edu',
        password_hash: hashedPassword,
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active',
        created_at: new Date()
      };
      
      const result = await db.collection('users').insertOne(defaultAdmin);
      user = { ...defaultAdmin, _id: result.insertedId };
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'university_jwt_secret_2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'university_jwt_secret_2024');
    const db = mongoose.connection.db;
    
    const user = await db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId(decoded.userId),
      status: 'active'
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;