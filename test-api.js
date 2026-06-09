const http = require('http');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('\n========== REGISTRATION TEST ==========');
    const registerData = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      gender: 'male',
      dateOfBirth: '1990-01-15'
    };
    
    const registerResponse = await makeRequest('POST', '/api/auth/register', registerData);
    console.log('Register Status:', registerResponse.status);
    console.log('Register Response:', registerResponse.data);

    console.log('\n========== LOGIN TEST ==========');
    const loginData = {
      email: 'testuser@example.com',
      password: 'password123'
    };
    
    const loginResponse = await makeRequest('POST', '/api/auth/login', loginData);
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginResponse.data);
    
    const loginResponseObj = JSON.parse(loginResponse.data);
    const token = loginResponseObj.data?.token;
    
    if (token) {
      console.log('\n✅ TOKEN GENERATED:', token);
      
      console.log('\n========== PROFILE TEST (with token) ==========');
      const profileOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/profile',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const profileResponse = await new Promise((resolve, reject) => {
        const req = http.request(profileOptions, (res) => {
          let responseData = '';
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              data: responseData
            });
          });
        });
        req.on('error', reject);
        req.end();
      });

      console.log('Profile Status:', profileResponse.status);
      console.log('Profile Response:', profileResponse.data);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
