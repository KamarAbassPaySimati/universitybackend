const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Test routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'University Management System API' });
});

app.get('/api/debug', (req, res) => {
  res.json({
    status: 'Debug Info',
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-mongo', (req, res) => {
  res.json({ 
    status: 'MongoDB test route working',
    message: 'This route is accessible'
  });
});

app.get('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', requestedPath: req.path });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
});