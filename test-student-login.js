const axios = require('axios');

const BASE_URL = 'http://localhost:8080'; // Change if your server runs on different port

async function testStudentLogin() {
  console.log('🧪 Testing Student Login...\n');
  
  try {
    // Test 1: Check server health
    console.log('1. Checking server health...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running:', healthResponse.data);
    
    // Test 2: Check MongoDB connection
    console.log('\n2. Checking MongoDB connection...');
    const mongoResponse = await axios.get(`${BASE_URL}/api/test-mongo`);
    console.log('📊 MongoDB status:', mongoResponse.data);
    
    // Test 3: Try student login
    console.log('\n3. Testing student login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'student',
      password: 'student123'
    });
    console.log('✅ Student login successful:', loginResponse.data);
    
    // Test 4: Test token validation
    console.log('\n4. Testing token validation...');
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token validation successful:', meResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Start it with: npm start');
    }
  }
}

// Also test creating a student user in database
async function createStudentUser() {
  console.log('\n🔧 Creating student user in database...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/create-student`);
    console.log('✅ Student user created:', response.data);
  } catch (error) {
    console.error('❌ Error creating student:', error.response?.data || error.message);
  }
}

// Run tests
testStudentLogin().then(() => {
  console.log('\n🔧 Attempting to create student user...');
  return createStudentUser();
});