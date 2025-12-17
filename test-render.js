const https = require('https');

function testLogin() {
  const postData = JSON.stringify({
    username: 'student',
    password: 'student123'
  });

  const options = {
    hostname: 'universitybackend.onrender.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing student login on Render...');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(postData);
  req.end();
}

testLogin();