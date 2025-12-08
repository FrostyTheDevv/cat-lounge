// Setup validation script - checks if all components are ready
// Run with: node validate-setup.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Cat Lounge Quiz System - Setup Validation\n');
console.log('=' .repeat(60) + '\n');

let errors = 0;
let warnings = 0;

// Check environment variables
console.log('📋 Checking Environment Variables...\n');

const requiredEnvVars = {
  'JWT_SECRET': { required: true, description: 'JWT secret for auth' },
  'JWT_REFRESH_SECRET': { required: true, description: 'JWT refresh token secret' },
  'CSRF_SECRET': { required: true, description: 'CSRF token secret' },
  'ADMIN_USERNAME': { required: true, description: 'Admin panel username' },
  'ADMIN_PASSWORD': { required: true, description: 'Admin panel password' },
  'DISCORD_BOT_TOKEN': { required: true, description: 'Discord bot token' },
  'DISCORD_GUILD_ID': { required: true, description: 'Discord server ID' },
  'DISCORD_CLIENT_ID': { required: true, description: 'OAuth2 client ID' },
  'DISCORD_CLIENT_SECRET': { required: true, description: 'OAuth2 client secret' },
  'DISCORD_REDIRECT_URI': { required: true, description: 'OAuth2 redirect URI' },
  'DISCORD_MEMBER_ROLE_ID': { required: true, description: 'Member role ID' },
};

const optionalEnvVars = {
  'QUIZ_ROLE_SOFT_CUDDLY': 'Soft & Cuddly role ID',
  'QUIZ_ROLE_CHAOS_GOBLIN': 'Chaos Goblin role ID',
  'QUIZ_ROLE_ROYAL_FANCY': 'Royal & Fancy role ID',
  'QUIZ_ROLE_COOL_ALLEY': 'Cool Alley Cat role ID',
  'QUIZ_ROLE_WISE_OLD': 'Wise & Old role ID',
  'QUIZ_ROLE_ADVENTUROUS_HUNTER': 'Adventurous Hunter role ID',
};

// Insecure default values to check against
const insecureDefaults = {
  'JWT_SECRET': ['your-secret-key', 'change-this', 'secret', 'test'],
  'JWT_REFRESH_SECRET': ['your-refresh-secret', 'change-this', 'secret', 'test'],
  'CSRF_SECRET': ['csrf-secret', 'change-this', 'secret', 'test'],
  'ADMIN_PASSWORD': ['admin', 'password', '123456', 'catlounge', 'CatLounge2025'],
};

Object.entries(requiredEnvVars).forEach(([key, config]) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`  ❌ ${key} - MISSING (${config.description})`);
    errors++;
  } else {
    // Check for insecure defaults
    const lowerValue = value.toLowerCase();
    const defaults = insecureDefaults[key] || [];
    const isInsecure = defaults.some(def => lowerValue.includes(def.toLowerCase()));
    
    if (isInsecure) {
      console.log(`  ⚠️  ${key} - INSECURE DEFAULT VALUE DETECTED! (${config.description})`);
      errors++;
    } else if (key === 'ADMIN_PASSWORD' && value.length < 8) {
      console.log(`  ⚠️  ${key} - TOO SHORT (minimum 8 characters recommended)`);
      warnings++;
    } else {
      console.log(`  ✅ ${key} - Set`);
    }
  }
});

console.log('\n📋 Checking Optional Variables (Quiz Roles)...\n');

let rolesConfigured = 0;
Object.entries(optionalEnvVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`  ⚠️  ${key} - Not set (${description})`);
    warnings++;
  } else {
    console.log(`  ✅ ${key} - Set`);
    rolesConfigured++;
  }
});

if (rolesConfigured === 0) {
  console.log('\n  ⚠️  No quiz roles configured yet. Role assignment will be skipped.');
  console.log('  Run get-role-ids.js to get your Discord role IDs.\n');
}

// Check required files
console.log('\n📁 Checking Required Files...\n');

const requiredFiles = [
  'lib/database.ts',
  'lib/quizConfig.ts',
  'app/api/auth/discord/route.ts',
  'app/api/auth/discord/callback/route.ts',
  'app/api/quiz/status/route.ts',
  'app/api/quiz/questions/route.ts',
  'app/api/quiz/submit/route.ts',
  'app/api/discord/sync/route.ts',
  'app/quiz/page.tsx',
  'app/quiz/page.module.css',
  'discord-bot.js',
  'get-role-ids.js',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors++;
  }
});

// Check database
console.log('\n💾 Checking Database...\n');

const dbPath = path.join(__dirname, 'catlounge.db');
if (fs.existsSync(dbPath)) {
  console.log(`  ✅ Database file exists (${dbPath})`);
  
  // Check database size
  const stats = fs.statSync(dbPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`  📊 Database size: ${sizeKB} KB`);
} else {
  console.log(`  ⚠️  Database file not found - will be created on first run`);
  warnings++;
}

// Check node_modules
console.log('\n📦 Checking Dependencies...\n');

const criticalPackages = [
  'discord.js',
  'node-fetch',
  'better-sqlite3',
  'next',
  'react',
];

const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  criticalPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`  ✅ ${pkg}`);
    } else {
      console.log(`  ❌ ${pkg} - MISSING (run npm install)`);
      errors++;
    }
  });
} else {
  console.log(`  ❌ node_modules not found - run npm install`);
  errors++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Validation Summary:\n');

if (errors === 0 && warnings === 0) {
  console.log('  🎉 Perfect! Everything is configured correctly!\n');
  console.log('  Next steps:');
  console.log('    1. Start the Discord bot: node discord-bot.js');
  console.log('    2. Start the dev server: npm run dev');
  console.log('    3. Navigate to http://localhost:3000/quiz\n');
} else if (errors === 0) {
  console.log(`  ⚠️  Setup is functional but has ${warnings} warning(s).\n`);
  
  if (rolesConfigured === 0) {
    console.log('  Quiz roles not configured:');
    console.log('    1. Create 6 roles in your Discord server');
    console.log('    2. Run: node get-role-ids.js');
    console.log('    3. Copy role IDs to .env file');
    console.log('    4. Restart the application\n');
    console.log('  Without roles, users can still take the quiz but won\'t');
    console.log('  receive Discord roles. Results will still be saved.\n');
  }
  
  console.log('  The system is ready to use!\n');
} else {
  console.log(`  ❌ Found ${errors} error(s) and ${warnings} warning(s).\n`);
  console.log('  Please fix the errors above before proceeding.\n');
}

console.log('=' .repeat(60) + '\n');

process.exit(errors > 0 ? 1 : 0);
