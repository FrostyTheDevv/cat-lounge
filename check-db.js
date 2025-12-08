const Database = require('better-sqlite3');
const db = new Database('catlounge.db');

console.log('\n=== Staff with Decorations/Banners ===');
const withFeatures = db.prepare('SELECT name, nickname, banner_url, avatar_decoration FROM staff WHERE avatar_decoration IS NOT NULL OR banner_url IS NOT NULL').all();
console.log(JSON.stringify(withFeatures, null, 2));

console.log('\n=== All Staff Names ===');
const allStaff = db.prepare('SELECT name, nickname FROM staff').all();
console.log(JSON.stringify(allStaff, null, 2));

db.close();
