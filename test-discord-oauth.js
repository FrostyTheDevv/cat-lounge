require('dotenv').config();

console.log('🔍 Discord OAuth Configuration Check\n');

console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? 'Set ✓' : 'Missing ✗');
console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? 'Set ✓' : 'Missing ✗');
console.log('DISCORD_REDIRECT_URI:', process.env.DISCORD_REDIRECT_URI || 'Missing ✗');
console.log('DISCORD_GUILD_ID:', process.env.DISCORD_GUILD_ID ? 'Set ✓' : 'Missing ✗');
console.log('DISCORD_MEMBER_ROLE_ID:', process.env.DISCORD_MEMBER_ROLE_ID ? 'Set ✓' : 'Missing ✗');
console.log('DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? 'Set ✓' : 'Missing ✗');

console.log('\n📋 OAuth Flow URLs:');
console.log('Initiate:', `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/discord`);
console.log('Callback:', process.env.DISCORD_REDIRECT_URI);

console.log('\n⚠️  Make sure these redirect URIs are added to your Discord App:');
console.log('1. http://localhost:3000/api/auth/discord/callback');
console.log('2. https://catlounge.vercel.app/api/auth/discord/callback');
console.log('\nAdd them at: https://discord.com/developers/applications/' + (process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID') + '/oauth2/general');
