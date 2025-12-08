import {
  upsertStaffDecoration,
  getStaffDecorationByDiscordId,
  getAllStaff,
} from './database';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

interface DiscordUserProfile {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    avatar_decoration_data?: {
      asset: string;
      sku_id: string;
      expires_at?: string | null;
    } | null;
    banner?: string | null;
    banner_color?: string | null;
    accent_color?: number | null;
    premium_type?: number;
  };
  user_profile?: {
    bio?: string;
    pronouns?: string;
    profile_effect?: {
      id: string;
      sku_id: string;
    } | null;
    theme_colors?: number[];
    popout_animation_particle_type?: string | null;
    emoji?: string | null;
  };
  badges?: Array<{
    id: string;
    description: string;
    icon: string;
    link?: string;
  }>;
  guild_member_profile?: {
    bio?: string;
    pronouns?: string;
    banner?: string | null;
    accent_color?: number | null;
    theme_colors?: number[];
  };
  premium_since?: string | null;
  premium_type?: number;
  premium_guild_since?: string | null;
}

/**
 * Fetch full Discord user profile with decorations
 */
export async function fetchDiscordUserProfile(
  userId: string,
  accessToken: string,
  guildId?: string
): Promise<DiscordUserProfile | null> {
  try {
    const url = guildId
      ? `${DISCORD_API_BASE}/users/${userId}/profile?with_mutual_guilds=false&with_mutual_friends_count=false&guild_id=${guildId}`
      : `${DISCORD_API_BASE}/users/${userId}/profile?with_mutual_guilds=false&with_mutual_friends_count=false`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Profile not found for user ${userId}`);
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error fetching profile for user ${userId}:`, error.message);
    return null;
  }
}

/**
 * Sync a single staff member's decorations from Discord
 */
export async function syncStaffMemberDecorations(
  staffId: number,
  discordId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    const profile = await fetchDiscordUserProfile(discordId, accessToken, guildId);

    if (!profile) {
      return false;
    }

    const user = profile.user;
    const userProfile = profile.user_profile || {};
    const guildMemberProfile = profile.guild_member_profile || {};

    // Determine Nitro status
    const hasNitro = (user.premium_type && user.premium_type > 0) || false;

    // Prepare theme colors
    let themeColors: string | null = null;
    if (userProfile.theme_colors && userProfile.theme_colors.length > 0) {
      themeColors = JSON.stringify(
        userProfile.theme_colors.map(color => `#${color.toString(16).padStart(6, '0')}`)
      );
    }

    // Prepare badges
    let badgesJson: string | null = null;
    if (profile.badges && profile.badges.length > 0) {
      badgesJson = JSON.stringify(
        profile.badges.map(badge => ({
          id: badge.id,
          description: badge.description,
          icon: badge.icon,
        }))
      );
    }

    // Upsert staff decoration data
    upsertStaffDecoration({
      staffId,
      discordId,
      avatarDecorationHash: user.avatar_decoration_data?.asset || null,
      profileEffectId: userProfile.profile_effect?.id || null,
      bannerHash: user.banner || null,
      bannerColor: user.banner_color || null,
      accentColor: user.accent_color ? `#${user.accent_color.toString(16).padStart(6, '0')}` : null,
      themeColors,
      badges: badgesJson,
      hasNitro,
    });

    return true;
  } catch (error: any) {
    console.error(`Failed to sync decorations for staff ${staffId}:`, error.message);
    return false;
  }
}

/**
 * Sync all staff members' decorations from Discord
 * Requires a user access token with proper scopes
 */
export async function syncAllStaffDecorations(
  accessToken: string | null
): Promise<{ success: number; failed: number }> {
  if (!accessToken) {
    console.error('No access token provided for decoration sync');
    return { success: 0, failed: 0 };
  }

  const staff = getAllStaff();
  const stats = { success: 0, failed: 0 };

  console.log(`Syncing decorations for ${staff.length} staff members...`);

  for (const member of staff) {
    // Skip if discord_id is null
    if (!member.discord_id) {
      stats.failed++;
      continue;
    }

    const success = await syncStaffMemberDecorations(
      member.id,
      member.discord_id,
      accessToken
    );

    if (success) {
      stats.success++;
    } else {
      stats.failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`Decoration sync complete: ${stats.success} success, ${stats.failed} failed`);
  return stats;
}

/**
 * Get staff member's current decorations from database
 */
export function getStaffCurrentDecorations(discordId: string) {
  const decorations = getStaffDecorationByDiscordId(discordId);
  
  if (!decorations) {
    return null;
  }

  return {
    avatarDecoration: decorations.avatar_decoration_hash,
    profileEffect: decorations.profile_effect_id,
    banner: decorations.banner_hash,
    bannerColor: decorations.banner_color,
    accentColor: decorations.accent_color,
    themeColors: decorations.theme_colors ? JSON.parse(decorations.theme_colors) : null,
    badges: decorations.badges ? JSON.parse(decorations.badges) : null,
    hasNitro: decorations.has_nitro,
    lastSynced: decorations.last_synced,
  };
}

/**
 * Check if staff member has access to premium decorations
 */
export function hasNitroAccess(discordId: string): boolean {
  const decorations = getStaffDecorationByDiscordId(discordId);
  return decorations?.has_nitro || false;
}
