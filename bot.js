const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env' });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const SYNC_API_URL = 'http://localhost:3000/api/discord/sync';

// Permissions that indicate staff roles (Administrator, Manage Server, Moderate Members, etc.)
const STAFF_PERMISSIONS = [
  'Administrator',
  'ManageGuild',
  'ManageChannels',
  'ManageRoles',
  'ModerateMembers',
  'KickMembers',
  'BanMembers',
  'ManageMessages',
];

// Map of role names to display roles
const ROLE_DISPLAY_NAMES = {
  'Owner': 'Server Owner',
  'Admin': 'Administrator',
  'Moderator': 'Moderator',
  'Helper': 'Helper',
  'Staff': 'Staff Member',
};

client.once('ready', async () => {
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  console.log(`📡 Monitoring guild: ${DISCORD_GUILD_ID}`);
  
  // Set custom status
  client.user.setPresence({
    activities: [{
      name: 'Detecting Staff',
      type: 3, // 3 = Watching
    }],
    status: 'online',
  });
  
  // Initial sync
  await syncAllStaff();
  
  // Sync every 5 minutes
  setInterval(syncAllStaff, 5 * 60 * 1000);
});

async function syncAllStaff() {
  try {
    console.log('\n🔄 Starting staff sync...');
    
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    if (!guild) {
      console.error('❌ Guild not found');
      return;
    }

    const members = await guild.members.fetch();
    let syncCount = 0;
    const currentStaffIds = new Set();

    for (const [memberId, member] of members) {
      // Skip bots
      if (member.user.bot) {
        console.log(`⏭️ Skipping bot: ${member.user.tag}`);
        continue;
      }

      // Check if member has any role with staff permissions
      const hasStaffPermissions = member.roles.cache.some(role => {
        return STAFF_PERMISSIONS.some(permission => 
          role.permissions.has(permission)
        );
      });

      if (hasStaffPermissions) {
        await syncStaffMember(member);
        currentStaffIds.add(member.user.id);
        syncCount++;
      }
    }

    // Remove staff members who no longer have permissions
    await removeNonStaffMembers(currentStaffIds);

    console.log(`✅ Synced ${syncCount} staff members`);
  } catch (error) {
    console.error('❌ Error syncing staff:', error);
  }
}

async function syncStaffMember(member) {
  try {
    // Fetch full user data with force refresh to get banner, decoration, etc.
    const fullUser = await member.user.fetch(true);
    
    // Discord removed discriminators, use @username or username#discriminator for legacy
    const discordTag = fullUser.discriminator && fullUser.discriminator !== '0' 
      ? `${fullUser.username}#${fullUser.discriminator}`
      : `@${fullUser.username}`;
    
    // Get SERVER-SPECIFIC avatar (not global) - ensure we always get a URL
    const avatarUrl = member.displayAvatarURL({ size: 512, extension: 'png', dynamic: false }) 
      || fullUser.displayAvatarURL({ size: 512, extension: 'png', dynamic: false });
    
    // Get server nickname or username
    const nickname = member.nickname || null;
    
    // Get server banner (if available) - MUST use full user data
    const bannerUrl = fullUser.banner 
      ? fullUser.bannerURL({ size: 1024, extension: 'png' })
      : null;
    
    // Get avatar decoration URL
    const avatarDecoration = fullUser.avatarDecorationData?.asset 
      ? `https://cdn.discordapp.com/avatar-decoration-presets/${fullUser.avatarDecorationData.asset}.png`
      : null;
    
    // Get bio from About Me
    const bio = fullUser.bio || null;
    
    // Validate required fields before sending
    if (!fullUser.id || !fullUser.username || !avatarUrl) {
      console.error(`❌ Missing critical data for ${fullUser.username}:`, {
        id: !!fullUser.id,
        username: !!fullUser.username,
        avatarUrl: !!avatarUrl
      });
      return;
    }
    
    // Get highest staff role
    let highestRole = 'Staff Member';
    for (const [roleName, displayName] of Object.entries(ROLE_DISPLAY_NAMES)) {
      const role = member.roles.cache.find(r => r.name === roleName);
      if (role) {
        highestRole = displayName;
        break;
      }
    }
    
    // Prepare payload
    const payload = {
      discord_id: fullUser.id,
      discord_tag: discordTag,
      name: fullUser.username,
      nickname: nickname,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      avatar_decoration: avatarDecoration,
      role: highestRole,
      bio: bio,
      is_bot: fullUser.bot,
    };

    // Debug log to see what we're sending
    console.log(`\n📋 Syncing ${fullUser.username}:`);
    console.log(`  Discord ID: ${payload.discord_id}`);
    console.log(`  Discord Tag: ${payload.discord_tag}`);
    console.log(`  Name: ${payload.name}`);
    console.log(`  Avatar URL: ${payload.avatar_url ? 'Present' : 'MISSING'}`);
    console.log(`  Nickname: ${nickname || 'None'}`);
    console.log(`  Banner: ${bannerUrl ? 'Yes' : 'None'}`);
    console.log(`  Decoration: ${avatarDecoration ? 'Yes' : 'None'}`);
    console.log(`  Bio: ${bio ? 'Yes' : 'None'}`);

    // Send to sync API
    const response = await fetch(SYNC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✓ Synced successfully\n`);
    } else {
      const error = await response.text();
      console.log(`✗ Failed to sync: ${error}\n`);
    }
  } catch (error) {
    console.error(`✗ Error syncing member:`, error);
  }
}

async function removeNonStaffMembers(currentStaffIds) {
  try {
    const response = await fetch(`${SYNC_API_URL}/remove-non-staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        current_staff_ids: Array.from(currentStaffIds)
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.removed > 0) {
        console.log(`🗑️ Removed ${result.removed} members who lost staff permissions`);
      }
    } else {
      const error = await response.text();
      console.error(`❌ Failed to remove non-staff: ${error}`);
    }
  } catch (error) {
    console.error('❌ Error removing non-staff:', error);
  }
}

// Handle member updates in real-time
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const oldHasStaffPerms = oldMember.roles.cache.some(role => {
    return STAFF_PERMISSIONS.some(permission => 
      role.permissions.has(permission)
    );
  });

  const newHasStaffPerms = newMember.roles.cache.some(role => {
    return STAFF_PERMISSIONS.some(permission => 
      role.permissions.has(permission)
    );
  });

  // Member gained staff permissions
  if (!oldHasStaffPerms && newHasStaffPerms) {
    console.log(`➕ Member promoted to staff: ${newMember.user.tag}`);
    await syncStaffMember(newMember);
  }
  // Member lost staff permissions
  else if (oldHasStaffPerms && !newHasStaffPerms) {
    console.log(`➖ Member demoted from staff: ${newMember.user.tag}`);
    await removeNonStaffMembers(new Set());
  }
  // Member still has staff permissions, update their data
  else if (newHasStaffPerms) {
    console.log(`🔄 Staff member updated: ${newMember.user.tag}`);
    await syncStaffMember(newMember);
  }
});

// Handle presence updates (for custom status changes)
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence?.member) return;

  const hasStaffPermissions = newPresence.member.roles.cache.some(role => {
    return STAFF_PERMISSIONS.some(permission => 
      role.permissions.has(permission)
    );
  });

  if (hasStaffPermissions) {
    console.log(`🔄 Presence updated: ${newPresence.user.tag}`);
    await syncStaffMember(newPresence.member);
  }
});

client.login(DISCORD_BOT_TOKEN);

console.log('🚀 Starting Discord bot...');
