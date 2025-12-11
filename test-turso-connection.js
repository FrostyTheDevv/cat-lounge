require('dotenv').config();
const { createClient } = require('@libsql/client');

async function testConnection() {
  console.log('🔗 Testing Turso connection...');
  console.log('Database URL:', process.env.TURSO_DATABASE_URL);
  console.log('Auth Token:', process.env.TURSO_AUTH_TOKEN ? 'Present' : 'Missing');
  
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('\n📊 Testing query...');
    const result = await client.execute('SELECT COUNT(*) as count FROM staff');
    console.log('✅ Query successful!');
    console.log('Staff count:', result.rows[0].count);

    console.log('\n📋 Fetching all staff...');
    const allStaff = await client.execute('SELECT id, discord_id, name, discord_tag FROM staff');
    console.log('Staff members:', allStaff.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
