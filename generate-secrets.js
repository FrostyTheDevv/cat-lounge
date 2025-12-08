// Generate secure secrets for JWT and CSRF
// Run: node generate-secrets.js

const crypto = require('crypto');

console.log('\n🔐 Generating Secure Secrets for Vercel\n');
console.log('========================================\n');

const generateSecret = () => crypto.randomBytes(64).toString('base64');

console.log('Copy these to your Vercel Environment Variables:\n');
console.log(`JWT_SECRET=${generateSecret()}\n`);
console.log(`JWT_REFRESH_SECRET=${generateSecret()}\n`);
console.log(`CSRF_SECRET=${generateSecret()}\n`);

console.log('✅ Secrets generated successfully!');
console.log('\n📋 Next Steps:');
console.log('   1. Copy each secret above');
console.log('   2. Go to Vercel Dashboard → Settings → Environment Variables');
console.log('   3. Add each variable with its generated value');
console.log('   4. Add your Discord credentials');
console.log('   5. Add Turso database credentials');
console.log('   6. Deploy!\n');
