// Setup script to initialize Turso database schema
require('dotenv').config();
const { createClient } = require('@libsql/client');

async function setupTursoDatabase() {
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !dbAuthToken) {
    console.error('❌ Missing Turso credentials: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required');
    console.error('Make sure you have run: vercel env pull .env.development.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to Turso database...');
  const client = createClient({
    url: dbUrl,
    authToken: dbAuthToken,
  });

  try {
    console.log('📋 Creating tables...');

    // Users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT UNIQUE NOT NULL,
        discord_tag TEXT NOT NULL,
        avatar_url TEXT,
        refresh_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Quiz results table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT NOT NULL,
        archetype TEXT NOT NULL,
        answers TEXT NOT NULL,
        scores TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (discord_id) REFERENCES users(discord_id)
      )
    `);
    console.log('✅ Created quiz_results table');

    // Login attempts table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        success INTEGER DEFAULT 0
      )
    `);
    console.log('✅ Created login_attempts table');

    // Staff table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT UNIQUE,
        discord_tag TEXT NOT NULL,
        name TEXT NOT NULL,
        nickname TEXT,
        role TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        banner_url TEXT,
        avatar_decoration_asset TEXT,
        avatar_decoration_sku_id TEXT,
        custom_nickname TEXT,
        custom_bio TEXT,
        custom_bio_emojis TEXT,
        custom_sections TEXT,
        custom_role TEXT,
        custom_avatar_url TEXT,
        custom_banner_url TEXT,
        position_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created staff table');

    // Quiz answer patterns table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS quiz_answer_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        archetype TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created quiz_answer_patterns table');

    // Admin sessions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_token TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created admin_sessions table');

    // Profile change history table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS profile_change_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL,
        admin_username TEXT NOT NULL,
        change_type TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id)
      )
    `);
    console.log('✅ Created profile_change_history table');

    // System settings table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created system_settings table');

    // Avatar decorations table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS avatar_decorations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku_id TEXT UNIQUE NOT NULL,
        asset_hash TEXT NOT NULL,
        name TEXT,
        description TEXT,
        category TEXT,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created avatar_decorations table');

    // Profile effects table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS profile_effects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku_id TEXT UNIQUE NOT NULL,
        effect_id TEXT NOT NULL,
        name TEXT,
        description TEXT,
        thumbnail_preview_url TEXT,
        reduced_motion_url TEXT,
        category TEXT,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created profile_effects table');

    // Banner decorations table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS banner_decorations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku_id TEXT UNIQUE NOT NULL,
        asset_hash TEXT NOT NULL,
        name TEXT,
        description TEXT,
        category TEXT,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created banner_decorations table');

    // Profile themes table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS profile_themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        theme_id TEXT UNIQUE NOT NULL,
        name TEXT,
        description TEXT,
        colors TEXT,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created profile_themes table');

    // Decoration sync log table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS decoration_sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT NOT NULL,
        total_synced INTEGER DEFAULT 0,
        success INTEGER DEFAULT 1,
        error_message TEXT,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created decoration_sync_log table');

    // Staff decorations table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS staff_decorations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        decoration_id TEXT UNIQUE NOT NULL,
        decoration_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        original_url TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created staff_decorations table');

    // Staff decoration assignments table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS staff_decoration_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL,
        decoration_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assigned_by TEXT,
        FOREIGN KEY (staff_id) REFERENCES staff(id),
        FOREIGN KEY (decoration_id) REFERENCES staff_decorations(id)
      )
    `);
    console.log('✅ Created staff_decoration_assignments table');

    console.log('\n✨ Database schema setup complete!');
    console.log('🎉 Your Turso database is ready to use.');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupTursoDatabase();
