const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  username: 'admin@demoautobody.com',
  password: 'admin123'
};

// Sample test image data (1x1 PNG)
const SAMPLE_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHIAQqnowAAAABJRU5ErkJggg==';

async function testPhotoUploadSystem() {
  console.log('🧪 Testing Photo Upload System');
  console.log('================================\n');

  try {
    // Step 1: Authenticate
    console.log('1. 🔐 Authenticating...');
    const authResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    const token = authResponse.data.data.accessToken;
    
    if (!token) {
      throw new Error('Authentication failed - no token received');
    }
    console.log('   ✅ Authentication successful\n');

    // Step 2: Create test image file
    console.log('2. 🖼️ Creating test image...');
    const testImageBuffer = Buffer.from(SAMPLE_PNG_BASE64, 'base64');
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('   ✅ Test image created\n');

    // Step 3: Get supported categories
    console.log('3. 📋 Getting supported categories...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/api/attachments/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Categories:', categoriesResponse.data.data.map(c => c.value).join(', '), '\n');

    // Step 4: Test single file upload
    console.log('4. 📤 Testing single file upload...');
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testImagePath));
    formData.append('category', 'damage_assessment');
    formData.append('title', 'Test Damage Photo');
    formData.append('description', 'Test upload from automated test');
    formData.append('vehiclePart', 'Front Bumper');
    formData.append('damageType', 'Scratch');
    formData.append('location', 'Test Location');
    // Don't set foreign keys for the test

    const uploadResponse = await axios.post(`${API_BASE_URL}/api/attachments/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });

    if (!uploadResponse.data.success) {
      throw new Error('Upload failed: ' + JSON.stringify(uploadResponse.data));
    }

    const uploadedFile = uploadResponse.data.data;
    console.log('   ✅ Upload successful:', {
      id: uploadedFile.attachment.id,
      filename: uploadedFile.file.filename,
      size: uploadedFile.file.size,
      dimensions: uploadedFile.file.dimensions
    });
    console.log();

    // Step 5: Test file retrieval
    console.log('5. 📥 Testing file retrieval...');
    const fileResponse = await axios.get(`${API_BASE_URL}/api/attachments/file/${uploadedFile.attachment.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    if (fileResponse.status !== 200) {
      throw new Error('File retrieval failed');
    }
    console.log('   ✅ File retrieved successfully, size:', fileResponse.data.length, 'bytes\n');

    // Step 6: Test thumbnail retrieval
    console.log('6. 🖼️ Testing thumbnail retrieval...');
    const thumbnailResponse = await axios.get(`${API_BASE_URL}/api/attachments/file/${uploadedFile.attachment.id}?thumbnail=true`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    if (thumbnailResponse.status !== 200) {
      console.log('   ⚠️ Thumbnail retrieval failed (this is expected if thumbnail generation failed)');
    } else {
      console.log('   ✅ Thumbnail retrieved successfully, size:', thumbnailResponse.data.length, 'bytes\n');
    }

    // Step 7: Test bulk upload
    console.log('7. 📤 Testing bulk upload...');
    const bulkFormData = new FormData();
    
    // Create multiple test files
    for (let i = 1; i <= 3; i++) {
      const testPath = path.join(__dirname, `test-image-${i}.png`);
      fs.writeFileSync(testPath, testImageBuffer);
      bulkFormData.append('files', fs.createReadStream(testPath));
    }
    
    bulkFormData.append('category', 'before_damage');
    bulkFormData.append('bulkDescription', 'Bulk test upload');

    const bulkUploadResponse = await axios.post(`${API_BASE_URL}/api/attachments/bulk-upload`, bulkFormData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...bulkFormData.getHeaders()
      }
    });

    if (!bulkUploadResponse.data.success) {
      throw new Error('Bulk upload failed: ' + JSON.stringify(bulkUploadResponse.data));
    }

    console.log('   ✅ Bulk upload successful:', bulkUploadResponse.data.data.summary);
    console.log();

    // Step 8: Test attachment deletion
    console.log('8. 🗑️ Testing attachment deletion...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/api/attachments/${uploadedFile.attachment.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!deleteResponse.data.success) {
      throw new Error('Delete failed: ' + JSON.stringify(deleteResponse.data));
    }
    console.log('   ✅ Attachment deleted successfully\n');

    // Clean up test files
    console.log('9. 🧹 Cleaning up test files...');
    [testImagePath, ...Array.from({length: 3}, (_, i) => path.join(__dirname, `test-image-${i+1}.png`))].forEach(file => {
      try {
        fs.unlinkSync(file);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    console.log('   ✅ Cleanup completed\n');

    console.log('🎉 ALL TESTS PASSED!');
    console.log('================================');
    console.log('✅ Authentication');
    console.log('✅ Category retrieval');
    console.log('✅ Single file upload');
    console.log('✅ File retrieval');
    console.log('✅ Thumbnail handling');
    console.log('✅ Bulk upload');
    console.log('✅ File deletion');
    console.log('✅ Cleanup');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    
    if (error.request) {
      console.error('Request failed - server may not be running');
    }
    
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testPhotoUploadSystem().catch(console.error);
}

module.exports = { testPhotoUploadSystem };