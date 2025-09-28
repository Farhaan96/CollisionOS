#!/usr/bin/env node
/**
 * Supabase Configuration Verification
 * Check environment setup without external dependencies
 */

const fs = require('fs');

console.log('🔍 Verifying Supabase Configuration\n');

// Load environment variables
const envVars = {};
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            envVars[key.trim()] = valueParts.join('=').trim();
        }
    });
    console.log('✅ Environment file loaded successfully');
} catch (e) {
    console.log('❌ Could not load .env file');
}

function verifyConfiguration() {
    console.log('\n📋 Environment Configuration Check');
    console.log('===================================');

    // Check server-side configuration
    const serverVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    // Check client-side configuration
    const clientVars = [
        'REACT_APP_SUPABASE_URL',
        'REACT_APP_SUPABASE_ANON_KEY'
    ];

    console.log('\n🖥️  Server Configuration:');
    let serverValid = true;
    serverVars.forEach(key => {
        const value = envVars[key] || process.env[key];
        if (value) {
            console.log(`   ✅ ${key}: ${value.substring(0, 20)}...${value.substring(value.length - 8)}`);
        } else {
            console.log(`   ❌ ${key}: Missing`);
            serverValid = false;
        }
    });

    console.log('\n🌐 Client Configuration:');
    let clientValid = true;
    clientVars.forEach(key => {
        const value = envVars[key] || process.env[key];
        if (value) {
            console.log(`   ✅ ${key}: ${value.substring(0, 20)}...${value.substring(value.length - 8)}`);
        } else {
            console.log(`   ❌ ${key}: Missing`);
            clientValid = false;
        }
    });

    // Validate URLs and keys format
    console.log('\n🔍 Configuration Validation:');

    const supabaseUrl = envVars.SUPABASE_URL;
    if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
        console.log('   ✅ Supabase URL format is valid');

        // Extract project reference
        const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
        console.log(`   📝 Project Reference: ${projectRef}`);
    } else {
        console.log('   ❌ Supabase URL format appears invalid');
    }

    const anonKey = envVars.SUPABASE_ANON_KEY;
    if (anonKey && anonKey.startsWith('eyJ')) {
        console.log('   ✅ Anon key format is valid (JWT)');
    } else {
        console.log('   ❌ Anon key format appears invalid');
    }

    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey && serviceKey.startsWith('eyJ')) {
        console.log('   ✅ Service role key format is valid (JWT)');
    } else {
        console.log('   ❌ Service role key format appears invalid');
    }

    return serverValid && clientValid;
}

function checkFileStructure() {
    console.log('\n📁 File Structure Check');
    console.log('========================');

    const requiredFiles = [
        'src/config/supabase-client.js',
        'supabase/functions/bms_ingest/index.ts',
        'supabase-migration/schema/20250928_01_collision_repair_schema.sql'
    ];

    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
        } else {
            console.log(`   ❌ ${file} - Missing`);
        }
    });
}

function generateConnectionTestScript() {
    console.log('\n🧪 Connection Test');
    console.log('==================');

    const supabaseUrl = envVars.SUPABASE_URL;
    const anonKey = envVars.SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
        console.log('   📝 Test commands to run in browser console:');
        console.log(`
// Test basic connection
fetch('${supabaseUrl}/rest/v1/', {
    headers: { 'apikey': '${anonKey.substring(0, 20)}...' }
}).then(r => console.log('Status:', r.status));

// Test BMS function (after deployment)
fetch('${supabaseUrl}/functions/v1/bms_ingest', {
    method: 'POST',
    headers: {
        'apikey': '${anonKey.substring(0, 20)}...',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ test: true })
}).then(r => r.json()).then(console.log);
        `);
    }
}

// Run verification
const isValid = verifyConfiguration();
checkFileStructure();
generateConnectionTestScript();

console.log('\n🎯 Summary');
console.log('==========');

if (isValid) {
    console.log('✅ Supabase configuration is valid and ready');
    console.log('📋 Next steps:');
    console.log('   1. Deploy schema files via Supabase Dashboard');
    console.log('   2. Deploy bms_ingest Edge Function');
    console.log('   3. Test BMS ingestion workflow');
} else {
    console.log('❌ Configuration issues found - please fix before proceeding');
}

console.log('\n🔗 Useful links:');
console.log(`   • Supabase Dashboard: ${envVars.SUPABASE_URL ? envVars.SUPABASE_URL.replace('/rest/v1', '') : 'Not configured'}`);
console.log('   • SQL Editor: Dashboard → SQL Editor');
console.log('   • Edge Functions: Dashboard → Edge Functions');