const http = require('http');

function testHealth() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health Status:', res.statusCode);
      console.log('Health Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Health Error:', e.message);
  });

  req.end();
}

testHealth();