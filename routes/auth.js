const express = require('express');
const User = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        organization: user.organization,
        name: `${user.firstName} ${user.lastName}`
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, department, organization, firstName, lastName } = req.body;
    
    if (!username || !email || !password || !role || !department || !organization || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const user = new User({
      username, email, password, role, department, organization, firstName, lastName
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        organization: user.organization
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        organization: req.user.organization,
        name: `${req.user.firstName} ${req.user.lastName}`,
        permissions: req.user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create default admin user
router.post('/create-admin', async (req, res) => {
  try {
    // Delete existing admin if any
    await User.deleteMany({ role: 'super-admin' });

    const admin = new User({
      username: 'admin',
      email: 'admin@university.edu',
      password: 'admin123',
      role: 'super-admin',
      department: 'Administration',
      organization: 'University System',
      firstName: 'Super',
      lastName: 'Administrator'
    });
    
    await admin.save();
    
    res.json({
      success: true,
      message: 'Super admin created successfully',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;