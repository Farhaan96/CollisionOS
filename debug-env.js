#!/usr/bin/env node

/**
 * Debug Environment File
 * Check what's actually in the .env.local file
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging .env.local file\n');

const envLocalPath = path.join(__dirname, '.env.local');

// Check if file exists
if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file does not exist');
  return;
}

console.log('✅ .env.local file exists');

// Read the file content
try {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  console.log(`📄 File size: ${content.length} characters`);

  if (content.length === 0) {
    console.log('⚠️  File is empty');
    return;
  }

  console.log('\n📋 File contents:');
  console.log('='.repeat(50));
  console.log(content);
  console.log('='.repeat(50));

  // Check for specific variables
  const lines = content.split('\n');
  console.log(`\n📊 Found ${lines.length} lines`);

  const supabaseLines = lines.filter(
    line =>
      line.includes('SUPABASE') ||
      line.includes('DB_PROVIDER') ||
      line.includes('DATABASE_URL') ||
      line.includes('ATABASE_URL')
  );

  console.log(`\n🔍 Supabase-related lines (${supabaseLines.length}):`);
  supabaseLines.forEach((line, index) => {
    console.log(`   ${index + 1}. ${line.trim()}`);
  });

  // Check for empty values
  const emptyVars = lines.filter(
    line =>
      line.includes('=') &&
      line.split('=')[1] === '' &&
      (line.includes('SUPABASE') || line.includes('DB_PROVIDER'))
  );

  if (emptyVars.length > 0) {
    console.log(`\n⚠️  Variables with empty values (${emptyVars.length}):`);
    emptyVars.forEach(line => {
      console.log(`   - ${line.trim()}`);
    });
  }
} catch (error) {
  console.log('❌ Error reading file:', error.message);
}
