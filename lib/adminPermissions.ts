import { db, AdminSession } from './database';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Discord permission bit flags
export const DiscordPermissions = {
  ADMINISTRATOR: 0x0000000000000008n,
  MANAGE_GUILD: 0x0000000000000020n,
  MANAGE_ROLES: 0x0000000010000000n,
} as const;

export type PermissionLevel = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'STAFF';

export interface DiscordRole {
  id: string;
  name: string;
  permissions: string;
  position: number;
}

export interface GuildMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  roles: string[];
  nick: string | null;
}

/**
 * Fetches all roles in the Discord guild using the bot token
 */
export async function getGuildRoles(): Promise<DiscordRole[]> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    throw new Error('Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN');
  }

  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
    headers: {
      'Authorization': `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guild roles: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches guild member data for a specific user
 */
export async function getGuildMember(userId: string): Promise<GuildMember | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    throw new Error('Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN');
  }

  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
    headers: {
      'Authorization': `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // User not in guild
    }
    throw new Error(`Failed to fetch guild member: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Checks if a Discord guild member is the server owner
 */
export async function isServerOwner(userId: string): Promise<boolean> {
  // Check if user is in the manual owner list
  const ownerIds = process.env.DISCORD_OWNER_IDS;
  if (ownerIds) {
    const ownerList = ownerIds.split(',').map(id => id.trim());
    if (ownerList.includes(userId)) {
      return true;
    }
  }

  // Also check the actual Discord server owner
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    throw new Error('Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN');
  }

  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
    headers: {
      'Authorization': `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guild info: ${response.statusText}`);
  }

  const guild = await response.json();
  return guild.owner_id === userId;
}

/**
 * Determines permission level based on Discord roles
 */
export async function determinePermissionLevel(
  userId: string,
  userRoles: string[]
): Promise<PermissionLevel> {
  // Check if user is server owner first
  const owner = await isServerOwner(userId);
  if (owner) {
    return 'OWNER';
  }

  // Get all guild roles to check permissions
  const guildRoles = await getGuildRoles();
  
  // Create a map of role IDs to their permissions
  const roleMap = new Map(guildRoles.map(role => [role.id, BigInt(role.permissions)]));

  // Check each of the user's roles for permissions
  let hasAdministrator = false;
  let hasManageGuild = false;
  let hasManageRoles = false;

  for (const roleId of userRoles) {
    const permissions = roleMap.get(roleId);
    if (!permissions) continue;

    // Check for Administrator permission (grants all permissions)
    if ((permissions & DiscordPermissions.ADMINISTRATOR) === DiscordPermissions.ADMINISTRATOR) {
      hasAdministrator = true;
      break;
    }

    // Check for Manage Server permission
    if ((permissions & DiscordPermissions.MANAGE_GUILD) === DiscordPermissions.MANAGE_GUILD) {
      hasManageGuild = true;
    }

    // Check for Manage Roles permission
    if ((permissions & DiscordPermissions.MANAGE_ROLES) === DiscordPermissions.MANAGE_ROLES) {
      hasManageRoles = true;
    }
  }

  // Determine permission level based on detected permissions
  if (hasAdministrator) {
    return 'ADMIN';
  } else if (hasManageGuild) {
    return 'ADMIN';
  } else if (hasManageRoles) {
    return 'MODERATOR';
  } else {
    return 'STAFF';
  }
}

/**
 * Validates if a user has access to the admin panel
 */
export async function validateAdminAccess(userId: string): Promise<{
  hasAccess: boolean;
  permissionLevel: PermissionLevel | null;
  member: GuildMember | null;
}> {
  // Check if user is in the guild
  const member = await getGuildMember(userId);
  
  if (!member) {
    return {
      hasAccess: false,
      permissionLevel: null,
      member: null,
    };
  }

  // Determine permission level
  const permissionLevel = await determinePermissionLevel(userId, member.roles);

  return {
    hasAccess: true,
    permissionLevel,
    member,
  };
}

/**
 * Checks if a user has sufficient permission for an action
 */
export function hasPermission(
  userLevel: PermissionLevel,
  requiredLevel: PermissionLevel
): boolean {
  const levels: Record<PermissionLevel, number> = {
    'STAFF': 1,
    'MODERATOR': 2,
    'ADMIN': 3,
    'OWNER': 4,
  };

  return levels[userLevel] >= levels[requiredLevel];
}

/**
 * Gets fresh permission level for a user (useful for real-time checks)
 */
export async function refreshUserPermissions(discordId: string): Promise<PermissionLevel | null> {
  const member = await getGuildMember(discordId);
  
  if (!member) {
    return null;
  }

  return await determinePermissionLevel(discordId, member.roles);
}
