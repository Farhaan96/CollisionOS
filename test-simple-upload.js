const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Test simple upload functionality
async function testSimpleUpload() {
  console.log('🧪 Testing Simple Photo Upload');
  console.log('==============================\n');

  try {
    // Step 1: Check if server is running
    console.log('1. 🔍 Checking server health...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('   ✅ Server is running:', healthResponse.data.status);

    // Step 2: Authenticate
    console.log('2. 🔐 Authenticating...');
    const authResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin@demoautobody.com',
      password: 'admin123'
    });
    const token = authResponse.data.data.accessToken;
    console.log('   ✅ Authentication successful');

    // Step 3: Test categories endpoint first
    console.log('3. 📋 Testing categories endpoint...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/attachments/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Categories working:', categoriesResponse.data.success);

    // Step 4: Create test image
    console.log('4. 🖼️ Creating test image...');
    const SAMPLE_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHIAQqnowAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(SAMPLE_PNG_BASE64, 'base64');
    const testImagePath = path.join(__dirname, 'simple-test.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('   ✅ Test image created');

    // Step 5: Test direct database creation (bypass associations)
    console.log('5. 💾 Testing direct Attachment creation...');
    try {
      const testAttachment = {
        shopId: 'test-shop-id',
        fileName: 'test.png',
        originalFileName: 'test.png', 
        filePath: 'test/path/test.png',
        fileType: 'image',
        mimeType: 'image/png',
        fileSize: testImageBuffer.length,
        category: 'other',
        uploadedBy: 'test-user-id',
        status: 'ready'
      };

      // This will tell us if the model itself works
      const { Attachment } = require('./server/database/models');
      const attachment = await Attachment.create(testAttachment);
      console.log('   ✅ Direct Attachment creation works:', attachment.id);
      
      // Clean up
      await attachment.destroy();
      console.log('   ✅ Attachment cleanup successful');
    } catch (error) {
      console.log('   ❌ Direct creation failed:', error.message);
      throw error;
    }

    console.log('\n🎉 SIMPLE TESTS PASSED!');
    console.log('The attachment model works independently.');
    console.log('The issue is likely in the upload service or route associations.');

  } catch (error) {
    console.error('\n❌ SIMPLE TEST FAILED:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  } finally {
    // Cleanup
    const testFile = path.join(__dirname, 'simple-test.png');
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}

testSimpleUpload();