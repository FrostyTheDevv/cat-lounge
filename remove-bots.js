const Database = require('better-sqlite3');
const db = new Database('catlounge.db');

// List of known bot names to remove
const KNOWN_BOTS = [
  'Chordy',
  'Countr',
  'MEE6',
  'Dyno',
  'ProBot',
  'Carl-bot',
  'Arcane',
  'Mudae',
  'Dank Memer',
  'Pokétwo',
  'Groovy',
  'Rythm',
  'Hydra',
  'FredBoat',
  'Auttaja',
  'YAGPDB.xyz',
  'Apollo',
  'Lawliet',
  'Vexera',
  'Zandercraft',
  'GiveawayBot',
  'Birthday Bot',
  'Ticket Tool',
  'Helper.gg',
  'Translator',
  'UnbelievaBoat',
  'Sesh',
  'Statbot',
  'Welcomer',
  'Tatsumaki'
];

console.log('🔍 Checking for bots in staff database...\n');

// Check current staff
const allStaff = db.prepare('SELECT id, name, discord_tag FROM staff').all();
console.log(`Total staff members: ${allStaff.length}`);

// Find and remove bots
let removedCount = 0;
const deleteStmt = db.prepare('DELETE FROM staff WHERE name = ?');

for (const botName of KNOWN_BOTS) {
  const found = allStaff.find(s => s.name === botName);
  if (found) {
    console.log(`🤖 Found bot: ${found.name} (${found.discord_tag})`);
    const result = deleteStmt.run(botName);
    if (result.changes > 0) {
      console.log(`   ✅ Removed ${found.name}`);
      removedCount++;
    }
  }
}

if (removedCount === 0) {
  console.log('\n✨ No bots found in staff database');
} else {
  console.log(`\n✅ Removed ${removedCount} bot(s) from staff database`);
}

// Show updated staff list
const updatedStaff = db.prepare('SELECT name, discord_tag, role FROM staff ORDER BY position_order').all();
console.log('\n📋 Updated staff list:');
console.log(JSON.stringify(updatedStaff, null, 2));

db.close();
