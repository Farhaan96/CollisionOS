#!/usr/bin/env node

/**
 * Check Environment Variables
 * Helps debug environment variable configuration
 */

// Load environment variables from both .env and .env.local
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Environment Variables\n');

// Check for Supabase-related environment variables
const supabaseVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'DB_PROVIDER',
  'DATABASE_URL',
  'ATABASE_URL',
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ENABLE_SUPABASE',
];

console.log('📋 Supabase Environment Variables:');
supabaseVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Show first 20 characters of the value for security
    const displayValue =
      value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: Not set`);
  }
});

console.log('\n🔍 All Environment Variables (first 10):');
const allVars = Object.keys(process.env)
  .filter(
    key =>
      key.includes('SUPABASE') || key.includes('REACT') || key.includes('NEXT')
  )
  .slice(0, 10);

allVars.forEach(varName => {
  const value = process.env[varName];
  const displayValue =
    value.length > 30 ? value.substring(0, 30) + '...' : value;
  console.log(`   ${varName}: ${displayValue}`);
});

console.log(
  '\n💡 If you see Supabase variables above, they should work with the scripts.'
);
console.log(
  '💡 If not, make sure your .env.local file contains the correct variable names.'
);
