const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const users = await db.collection('users')
      .find({}, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    
    res.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { username, email, full_name, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    
    const newUser = {
      username,
      email,
      password_hash: hashedPassword,
      full_name,
      role,
      status: 'active',
      created_at: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    const { password_hash, ...userResponse } = newUser;
    
    res.status(201).json({ ...userResponse, _id: result.insertedId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    const { full_name, role, status } = req.body;
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          full_name, 
          role, 
          status,
          updated_at: new Date()
        } 
      },
      { returnDocument: 'after', projection: { password_hash: 0 } }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    
    const result = await db.collection('users').findOneAndDelete(
      { _id: new mongoose.Types.ObjectId(id) }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reports data
router.get('/reports/:type', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { type } = req.params;
    let result;
    
    switch (type) {
      case 'enrollment':
        result = await db.collection('studentrecords').aggregate([
          {
            $addFields: {
              department: { $arrayElemAt: [{ $split: ['$courseCode', ' '] }, 0] }
            }
          },
          {
            $group: {
              _id: '$department',
              total_students: { $addToSet: '$registrationNumber' },
              active_students: { $addToSet: '$registrationNumber' }
            }
          },
          {
            $project: {
              department: '$_id',
              total_students: { $size: '$total_students' },
              active_students: { $size: '$active_students' }
            }
          },
          { $sort: { department: 1 } }
        ]).toArray();
        break;
        
      case 'academic':
        result = await db.collection('studentrecords').aggregate([
          {
            $addFields: {
              department: { $arrayElemAt: [{ $split: ['$courseCode', ' '] }, 0] },
              gpa: {
                $cond: {
                  if: { $gte: ['$finalGrade', 80] }, then: 4.0,
                  else: {
                    $cond: {
                      if: { $gte: ['$finalGrade', 70] }, then: 3.0,
                      else: {
                        $cond: {
                          if: { $gte: ['$finalGrade', 60] }, then: 2.0,
                          else: 1.0
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: '$department',
              avg_gpa: { $avg: '$gpa' },
              distinction_count: {
                $sum: {
                  $cond: [{ $gte: ['$finalGrade', 80] }, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              department: '$_id',
              avg_gpa: { $round: ['$avg_gpa', 2] },
              distinction_count: 1
            }
          },
          { $sort: { department: 1 } }
        ]).toArray();
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Reports fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;