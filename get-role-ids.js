// Helper script to get Discord role IDs for quiz system
// Run with: node get-role-ids.js

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ]
});

const QUIZ_ROLE_NAMES = [
  'Soft & Cuddly',
  'Chaos Goblin',
  'Royal & Fancy',
  'Cool Alley Cat',
  'Wise & Old',
  'Adventurous Hunter'
];

const ENV_VAR_MAP = {
  'Soft & Cuddly': 'QUIZ_ROLE_SOFT_CUDDLY',
  'Chaos Goblin': 'QUIZ_ROLE_CHAOS_GOBLIN',
  'Royal & Fancy': 'QUIZ_ROLE_ROYAL_FANCY',
  'Cool Alley Cat': 'QUIZ_ROLE_COOL_ALLEY',
  'Wise & Old': 'QUIZ_ROLE_WISE_OLD',
  'Adventurous Hunter': 'QUIZ_ROLE_ADVENTUROUS_HUNTER'
};

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}\n`);
  
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    console.log(`📡 Fetching roles from: ${guild.name}\n`);
    
    const roles = await guild.roles.fetch();
    
    console.log('🎭 Quiz Role IDs:\n');
    console.log('Copy these lines to your .env file:\n');
    
    let foundCount = 0;
    let missingCount = 0;
    
    QUIZ_ROLE_NAMES.forEach(roleName => {
      const role = roles.find(r => r.name === roleName);
      const envVar = ENV_VAR_MAP[roleName];
      
      if (role) {
        console.log(`${envVar}=${role.id}`);
        foundCount++;
      } else {
        console.log(`# ${envVar}= ❌ ROLE NOT FOUND: "${roleName}"`);
        missingCount++;
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Found: ${foundCount} roles`);
    if (missingCount > 0) {
      console.log(`❌ Missing: ${missingCount} roles`);
      console.log('\n⚠️  You need to create the missing roles in Discord first!');
      console.log('Role names must match exactly (including capitalization and spaces).\n');
    } else {
      console.log('🎉 All quiz roles found! Copy the lines above to your .env file.\n');
    }
    
    client.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    client.destroy();
    process.exit(1);
  }
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

console.log('🚀 Connecting to Discord...\n');
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Failed to login:', error.message);
  console.log('\n💡 Make sure DISCORD_BOT_TOKEN is set correctly in your .env file.');
  process.exit(1);
});
