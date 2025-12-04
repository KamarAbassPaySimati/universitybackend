const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super-admin', 'admin', 'faculty', 'student'], 
    required: true 
  },
  department: { type: String, required: true },
  organization: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  permissions: [{
    resource: String,
    actions: [String]
  }],
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);