const http = require('http');

// Check if ports are available
function checkPort(port) {
  return new Promise(resolve => {
    const server = http.createServer();

    server.listen(port, () => {
      server.close();
      resolve(true); // Port is available
    });

    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

// Test API endpoints
function testAPI() {
  return new Promise(resolve => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/health',
        method: 'GET',
        timeout: 5000,
      },
      res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ success: true, status: res.statusCode, data });
        });
      }
    );

    req.on('error', () => {
      resolve({ success: false, error: 'API not responding' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'API timeout' });
    });

    req.end();
  });
}

// Test frontend
function testFrontend() {
  return new Promise(resolve => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        timeout: 5000,
      },
      res => {
        resolve({ success: true, status: res.statusCode });
      }
    );

    req.on('error', () => {
      resolve({ success: false, error: 'Frontend not responding' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Frontend timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Checking CollisionOS Port Configuration...\n');

  // Check port availability
  console.log('📋 Port Availability Check:');
  const port3000 = await checkPort(3000);
  const port3001 = await checkPort(3001);

  console.log(
    `   Port 3000 (Frontend): ${port3000 ? '✅ Available' : '❌ In Use'}`
  );
  console.log(
    `   Port 3001 (Backend):  ${port3001 ? '✅ Available' : '❌ In Use'}`
  );

  console.log('\n🌐 Service Status Check:');

  // Test if services are running
  const apiResult = await testAPI();
  const frontendResult = await testFrontend();

  console.log(
    `   Frontend (3000): ${frontendResult.success ? '✅ Running' : '❌ Not Running'}`
  );
  console.log(
    `   Backend (3001):  ${apiResult.success ? '✅ Running' : '❌ Not Running'}`
  );

  if (apiResult.success) {
    console.log(`   API Status: ${apiResult.status} - ${apiResult.data}`);
  }

  console.log('\n📊 Configuration Summary:');
  console.log('   Frontend URL: http://localhost:3000');
  console.log('   Backend URL:  http://localhost:3001');
  console.log('   Proxy:        http://localhost:3000 → http://localhost:3001');

  console.log('\n🚀 Next Steps:');
  if (!port3000 && !port3001) {
    console.log('   ✅ Both ports are available - ready to start!');
    console.log('   Run: npm run dev');
  } else if (!port3000) {
    console.log('   ⚠️  Port 3000 is in use - frontend may not start');
    console.log('   Check: netstat -ano | findstr :3000');
  } else if (!port3001) {
    console.log('   ⚠️  Port 3001 is in use - backend may not start');
    console.log('   Check: netstat -ano | findstr :3001');
  }

  if (!frontendResult.success || !apiResult.success) {
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Start the application: npm run dev');
    console.log('   2. Wait for both services to start');
    console.log('   3. Check browser console for errors');
    console.log('   4. Verify .env file configuration');
  }

  console.log('\n✨ Port configuration check complete!');
}

main().catch(console.error);
