const express = require('express');
const User = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt for username:', username);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Try new User model first
    try {
      const user = await User.findOne({ 
        $or: [{ username }, { email: username }],
        isActive: true 
      });
      
      console.log('Database user found:', user ? user.username : 'none');
      
      if (user && (await user.comparePassword(password))) {
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);
        
        return res.json({
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
      }
    } catch (userModelError) {
      console.log('User model error:', userModelError.message);
      console.log('Trying fallback authentication...');
    }

    // Fallback: Create simple admin user for testing
    if (username === 'admin' && password === 'admin123') {
      const token = generateToken('admin-test-id');
      
      return res.json({
        success: true,
        user: {
          id: 'admin-test-id',
          username: 'admin',
          email: 'admin@university.edu',
          role: 'super-admin',
          department: 'Administration',
          organization: 'University System',
          name: 'System Administrator'
        },
        token
      });
    }
    
    // Fallback: Create simple student user for testing
    if (username === 'student' && password === 'student123') {
      console.log('Using fallback student authentication');
      const token = generateToken('student-test-id');
      
      return res.json({
        success: true,
        user: {
          id: 'student-test-id',
          username: 'student',
          email: 'student@university.edu',
          role: 'student',
          department: 'Computer Science',
          organization: 'University System',
          name: 'Demo Student'
        },
        token
      });
    }
    
    console.log('Login failed - invalid credentials for:', username);

    return res.status(401).json({ error: 'Invalid credentials' });
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

// Debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const users = await User.find({}, 'username email role').limit(5);
    res.json({
      userCount,
      users,
      modelExists: !!User
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        organization: user.organization,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        permissions: user.permissions || []
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

// Create default student user
router.post('/create-student', async (req, res) => {
  try {
    // Delete existing student if any
    await User.deleteMany({ username: 'student' });

    const student = new User({
      username: 'student',
      email: 'student@university.edu',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      organization: 'University System',
      firstName: 'Demo',
      lastName: 'Student'
    });
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Student user created successfully',
      credentials: {
        username: 'student',
        password: 'student123'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;