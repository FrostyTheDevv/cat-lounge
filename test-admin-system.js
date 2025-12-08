/**
 * Comprehensive Admin System Test
 * Tests all Phase 0-3 features
 */

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const db = new Database(path.join(process.cwd(), 'catlounge.db'));

console.log('\n========================================');
console.log(' 🎨 CAT LOUNGE ADMIN SYSTEM TEST');
console.log('========================================\n');

// Test 1: Server Owners
console.log('👑 SERVER OWNERS:');
const ownerIds = process.env.DISCORD_OWNER_IDS?.split(',') || [];
ownerIds.forEach(id => {
  const staff = db.prepare('SELECT name, discord_id, role FROM staff WHERE discord_id = ?').get(id.trim());
  if (staff) {
    console.log(`  ✅ ${staff.name} (${staff.discord_id})`);
  } else {
    console.log(`  ❌ Discord ID ${id.trim()} not found in staff`);
  }
});

// Test 2: All Staff Members
console.log('\n📋 ALL STAFF MEMBERS:');
const allStaff = db.prepare('SELECT id, name, discord_id, role FROM staff ORDER BY name').all();
console.log(`  Total: ${allStaff.length} staff members\n`);
allStaff.forEach(staff => {
  const isOwner = ownerIds.includes(staff.discord_id);
  console.log(`  ${isOwner ? '👑' : '👤'} ${staff.name.padEnd(30)} ${staff.discord_id}`);
});

// Test 3: Database Tables
console.log('\n📊 DATABASE TABLES:');
const tables = [
  'staff',
  'admin_sessions',
  'profile_change_history',
  'system_settings',
  'avatar_decorations',
  'profile_effects',
  'banner_decorations',
  'profile_themes',
  'decoration_sync_log',
  'staff_decorations',
  'staff_decoration_assignments'
];

tables.forEach(table => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`  ✅ ${table.padEnd(30)} ${count.count} rows`);
  } catch (error) {
    console.log(`  ❌ ${table.padEnd(30)} NOT FOUND`);
  }
});

// Test 4: Decoration Library Stats
console.log('\n🎨 DECORATION LIBRARY:');
try {
  const stats = {
    avatarDecorations: db.prepare('SELECT COUNT(*) as count FROM avatar_decorations').get().count,
    profileEffects: db.prepare('SELECT COUNT(*) as count FROM profile_effects').get().count,
    bannerDecorations: db.prepare('SELECT COUNT(*) as count FROM banner_decorations').get().count,
    profileThemes: db.prepare('SELECT COUNT(*) as count FROM profile_themes').get().count
  };
  console.log(`  Avatar Decorations: ${stats.avatarDecorations}`);
  console.log(`  Profile Effects: ${stats.profileEffects}`);
  console.log(`  Banner Decorations: ${stats.bannerDecorations}`);
  console.log(`  Profile Themes: ${stats.profileThemes}`);
  console.log(`  TOTAL: ${stats.avatarDecorations + stats.profileEffects + stats.bannerDecorations + stats.profileThemes}`);
} catch (error) {
  console.log('  ❌ Decoration tables not found');
}

// Test 5: Staff Decorations Sync Status
console.log('\n✨ STAFF DECORATIONS (Phase 2):');
try {
  const staffDecorations = db.prepare(`
    SELECT s.name, sd.has_nitro, sd.last_synced,
           sd.avatar_decoration_hash, sd.profile_effect_id, sd.banner_hash
    FROM staff s
    LEFT JOIN staff_decorations sd ON s.id = sd.staff_id
    ORDER BY s.name
  `).all();

  staffDecorations.forEach(staff => {
    const synced = staff.last_synced ? '✅' : '⏳';
    const nitro = staff.has_nitro ? '💎' : '  ';
    console.log(`  ${synced} ${nitro} ${staff.name.padEnd(30)} ${staff.last_synced || 'Not synced'}`);
  });
} catch (error) {
  console.log('  ❌ Staff decorations table not found');
}

// Test 6: Active Admin Sessions
console.log('\n🔐 ADMIN SESSIONS:');
try {
  const sessions = db.prepare(`
    SELECT discord_username, permission_level, 
           datetime(created_at) as created, 
           datetime(last_activity) as last_active,
           datetime(expires_at) as expires
    FROM admin_sessions
    WHERE expires_at > datetime('now')
    ORDER BY last_activity DESC
  `).all();

  if (sessions.length > 0) {
    sessions.forEach(session => {
      console.log(`  🔑 ${session.discord_username} (${session.permission_level})`);
      console.log(`     Last active: ${session.last_active}`);
      console.log(`     Expires: ${session.expires}`);
    });
  } else {
    console.log('  ℹ️  No active sessions (login at http://localhost:3000/admin/login)');
  }
} catch (error) {
  console.log('  ❌ Admin sessions table not found');
}

// Test 7: Recent Profile Changes
console.log('\n📝 RECENT PROFILE CHANGES:');
try {
  const changes = db.prepare(`
    SELECT s.name as staff_name, changed_by_username, change_type, 
           datetime(changed_at) as changed
    FROM profile_change_history pch
    JOIN staff s ON s.id = pch.staff_id
    ORDER BY changed_at DESC
    LIMIT 5
  `).all();

  if (changes.length > 0) {
    changes.forEach(change => {
      console.log(`  📌 ${change.staff_name}: ${change.change_type}`);
      console.log(`     By: ${change.changed_by_username} at ${change.changed}`);
    });
  } else {
    console.log('  ℹ️  No changes recorded yet');
  }
} catch (error) {
  console.log('  ❌ Profile change history not available');
}

console.log('\n========================================');
console.log(' 🚀 TESTING INSTRUCTIONS');
console.log('========================================\n');

console.log('✅ PHASE 0: Admin Authentication');
console.log('   URL: http://localhost:3000/admin/login');
console.log('   • Click "Login with Discord"');
console.log('   • You will be authenticated as OWNER\n');

console.log('✅ PHASE 1: Decoration Data Collection');
console.log('   • Already populated with Discord decorations');
console.log('   • Check database for decoration counts above\n');

console.log('✅ PHASE 2: Discord Integration');
console.log('   URL: http://localhost:3000/admin/dashboard');
console.log('   • View staff list');
console.log('   • Sync individual staff decorations');
console.log('   • API: POST /api/admin/staff/sync-decorations\n');

console.log('✅ PHASE 3: Decoration Manager');
console.log('   URL: http://localhost:3000/admin/decorations');
console.log('   • Browse decoration library with filters');
console.log('   • Assign decorations to staff (bulk selection)');
console.log('   • Upload custom decorations (5MB max)\n');

console.log('🔧 QUICK COMMANDS:\n');
console.log('   Start server:  npm run dev');
console.log('   Sync staff:    node bot.js');
console.log('   Check DB:      node check-db.js');
console.log('   This test:     node test-admin-system.js\n');

console.log('========================================\n');

db.close();
