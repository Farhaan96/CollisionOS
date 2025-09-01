#!/usr/bin/env node

/**
 * Fix .env.local file
 * Clean up encoding and formatting issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing .env.local file\n');

const envLocalPath = path.join(__dirname, '.env.local');

try {
  // Read the current content
  const content = fs.readFileSync(envLocalPath, 'utf8');
  console.log('📄 Original file size:', content.length, 'characters');

  // Clean up the content
  let cleanedContent = content
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Convert remaining CR to LF
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .join('\n');

  // Add missing newline at end
  if (!cleanedContent.endsWith('\n')) {
    cleanedContent += '\n';
  }

  console.log('📄 Cleaned file size:', cleanedContent.length, 'characters');

  // Write back the cleaned content
  fs.writeFileSync(envLocalPath, cleanedContent, 'utf8');
  console.log('✅ File cleaned and saved');

  // Show the cleaned content
  console.log('\n📋 Cleaned content:');
  console.log('='.repeat(50));
  console.log(cleanedContent);
  console.log('='.repeat(50));

  // Verify the variables are readable
  const lines = cleanedContent.split('\n');
  const supabaseVars = lines.filter(
    line =>
      line.startsWith('SUPABASE_') ||
      line.startsWith('DB_PROVIDER') ||
      line.startsWith('DATABASE_URL')
  );

  console.log(`\n🔍 Found ${supabaseVars.length} Supabase variables:`);
  supabaseVars.forEach((line, index) => {
    const [key, value] = line.split('=');
    const hasValue = value && value.length > 0;
    console.log(`   ${index + 1}. ${key}=${hasValue ? '✅ Set' : '❌ Empty'}`);
  });
} catch (error) {
  console.log('❌ Error fixing file:', error.message);
}
