#!/usr/bin/env node

/**
 * Thoroughly fix .env.local file
 * Remove all encoding issues and recreate the file properly
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Thoroughly fixing .env.local file\n');

const envLocalPath = path.join(__dirname, '.env.local');

try {
  // Read the current content
  const content = fs.readFileSync(envLocalPath, 'utf8');
  console.log('📄 Original file size:', content.length, 'characters');

  // Extract the actual values using regex
  const urlMatch = content.match(/SUPABASE_URL=([^\r\n]+)/);
  const anonKeyMatch = content.match(/SUPABASE_ANON_KEY=([^\r\n]+)/);
  const jwtSecretMatch = content.match(/SUPABASE_JWT_SECRET=([^\r\n]+)/);
  const dbProviderMatch = content.match(/DB_PROVIDER=([^\r\n]+)/);
  const databaseUrlMatch = content.match(/DATABASE_URL=([^\r\n]+)/);

  // Create clean content
  const cleanContent = [
    `SUPABASE_URL=${urlMatch ? urlMatch[1] : ''}`,
    `SUPABASE_ANON_KEY=${anonKeyMatch ? anonKeyMatch[1] : ''}`,
    `SUPABASE_JWT_SECRET=${jwtSecretMatch ? jwtSecretMatch[1] : ''}`,
    `DB_PROVIDER=${dbProviderMatch ? dbProviderMatch[1] : ''}`,
    `DATABASE_URL=${databaseUrlMatch ? databaseUrlMatch[1] : ''}`,
    '',
  ].join('\n');

  console.log('📄 Clean content size:', cleanContent.length, 'characters');

  // Write the clean content
  fs.writeFileSync(envLocalPath, cleanContent, 'utf8');
  console.log('✅ File recreated with clean content');

  // Show the cleaned content
  console.log('\n📋 Clean content:');
  console.log('='.repeat(50));
  console.log(cleanContent);
  console.log('='.repeat(50));

  // Verify the variables
  const lines = cleanContent.split('\n');
  const supabaseVars = lines.filter(
    line =>
      line.startsWith('SUPABASE_') ||
      line.startsWith('DB_PROVIDER') ||
      line.startsWith('DATABASE_URL')
  );

  console.log(`\n🔍 Found ${supabaseVars.length} variables:`);
  supabaseVars.forEach((line, index) => {
    const [key, value] = line.split('=');
    const hasValue = value && value.length > 0;
    console.log(`   ${index + 1}. ${key}=${hasValue ? '✅ Set' : '❌ Empty'}`);
  });
} catch (error) {
  console.log('❌ Error fixing file:', error.message);
}
