const http = require('http');

// Health check for Docker containers
const options = {
  host: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error('Health check failed:', error.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timeout');
  request.abort();
  process.exit(1);
});

request.end();