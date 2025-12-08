// Quick script to check if database needs Turso migration
// Run: node check-database.js

const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'catlounge.db');
const hasSQLite = fs.existsSync(dbPath);

console.log('\n🔍 Database Configuration Check\n');
console.log('================================\n');

if (hasSQLite) {
  const stats = fs.statSync(dbPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ SQLite database found:');
  console.log(`   Path: ${dbPath}`);
  console.log(`   Size: ${sizeMB} MB`);
  console.log(`   Last modified: ${stats.mtime.toLocaleString()}\n`);
  
  console.log('📋 For Vercel Deployment:\n');
  console.log('   1. Install Turso CLI: npm install -g @turso/turso-cli');
  console.log('   2. Create Turso database: turso db create catlounge');
  console.log('   3. Migrate data (see VERCEL_DEPLOYMENT.md)');
  console.log('   4. Update lib/database.ts to use Turso client\n');
} else {
  console.log('⚠️  No SQLite database found.');
  console.log('   Either create one locally first or proceed with Turso setup.\n');
}

console.log('📦 Environment Variables Needed:\n');
const envExample = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
const requiredVars = envExample.match(/^[A-Z_]+=/gm);

if (requiredVars) {
  requiredVars.forEach(v => {
    const varName = v.replace('=', '');
    const hasEnv = process.env[varName];
    const status = hasEnv ? '✅' : '❌';
    console.log(`   ${status} ${varName}`);
  });
}

console.log('\n📚 Next Steps:\n');
console.log('   1. Read VERCEL_DEPLOYMENT.md for full guide');
console.log('   2. Set up Turso database (free tier)');
console.log('   3. Configure environment variables in Vercel');
console.log('   4. Deploy via GitHub or Vercel CLI');
console.log('   5. Update Discord bot to point to Vercel URL\n');
