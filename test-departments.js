const https = require('https');

function testDepartments() {
  const options = {
    hostname: 'universitybackend.onrender.com',
    port: 443,
    path: '/api/faculty/departments',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('Testing departments endpoint...');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Departments Data:', JSON.parse(data));
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.end();
}

testDepartments();