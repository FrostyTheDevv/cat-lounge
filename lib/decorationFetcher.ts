import {
  upsertAvatarDecoration,
  upsertProfileEffect,
  upsertBannerDecoration,
  upsertProfileTheme,
  createSyncLog,
  updateSyncLog,
} from './database';

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const RATE_LIMIT_DELAY = 100; // ms between requests
const MAX_RETRIES = 3;

interface DiscordMember {
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
  };
  nick?: string | null;
  roles: string[];
}

interface DiscordUserProfile {
  user: {
    id: string;
    username: string;
    avatar: string | null;
    avatar_decoration_data?: {
      asset: string;
      sku_id: string;
      expires_at?: string | null;
    } | null;
    banner?: string | null;
    banner_color?: string | null;
    accent_color?: number | null;
  };
  user_profile?: {
    profile_effect?: {
      id: string;
      sku_id: string;
    } | null;
    theme_colors?: number[];
  };
  badges?: Array<{
    id: string;
    description: string;
    icon: string;
  }>;
}

/**
 * Delays execution for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches all members from a Discord guild with retry logic
 */
async function fetchGuildMembers(guildId: string, botToken: string): Promise<DiscordMember[]> {
  const members: DiscordMember[] = [];
  let after: string | undefined;
  let retries = 0;

  while (true) {
    try {
      const url = new URL(`${DISCORD_API_BASE}/guilds/${guildId}/members`);
      url.searchParams.set('limit', '1000');
      if (after) url.searchParams.set('after', after);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bot ${botToken}`,
        },
      });

      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = parseInt(response.headers.get('retry-after') || '1') * 1000;
        console.log(`Rate limited, waiting ${retryAfter}ms`);
        await delay(retryAfter);
        retries++;
        if (retries > MAX_RETRIES) {
          throw new Error('Max retries exceeded for rate limit');
        }
        continue;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch guild members: ${response.statusText}`);
      }

      const batch: DiscordMember[] = await response.json();
      
      if (batch.length === 0) {
        break; // No more members
      }

      members.push(...batch);
      
      if (batch.length < 1000) {
        break; // Last page
      }

      after = batch[batch.length - 1].user.id;
      await delay(RATE_LIMIT_DELAY); // Rate limit delay
      retries = 0; // Reset retries on success
    } catch (error) {
      console.error('Error fetching guild members:', error);
      throw error;
    }
  }

  return members;
}

/**
 * Fetches extended user profile data
 */
async function fetchUserProfile(
  userId: string,
  userToken: string,
  guildId?: string
): Promise<DiscordUserProfile | null> {
  try {
    const url = guildId
      ? `${DISCORD_API_BASE}/users/${userId}/profile?with_mutual_guilds=false&guild_id=${guildId}`
      : `${DISCORD_API_BASE}/users/${userId}/profile`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // User profile not accessible
      }
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    return null;
  }
}

/**
 * Extracts decorations from guild members
 */
export async function syncDecorationsFromGuild(): Promise<{
  avatarDecorations: number;
  profileEffects: number;
  banners: number;
  themes: number;
}> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    throw new Error('Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN');
  }

  const syncId = createSyncLog('guild_member_sync');
  
  try {
    console.log('Fetching guild members...');
    const members = await fetchGuildMembers(guildId, botToken);
    console.log(`Found ${members.length} members`);

    const stats = {
      avatarDecorations: 0,
      profileEffects: 0,
      banners: 0,
      themes: 0,
    };

    const uniqueAvatarDecorations = new Set<string>();
    const uniqueBanners = new Set<string>();

    // Process members for avatar decorations and banners
    for (const member of members) {
      const user = member.user;

      // Avatar decoration
      if (user.avatar_decoration_data) {
        const { asset, sku_id, expires_at } = user.avatar_decoration_data;
        
        if (!uniqueAvatarDecorations.has(asset)) {
          uniqueAvatarDecorations.add(asset);
          
          upsertAvatarDecoration({
            asset_hash: asset,
            sku_id: sku_id || null,
            name: null, // We don't have names from member data
            description: null,
            is_animated: asset.startsWith('a_'), // Discord animated assets start with a_
            is_premium: true, // Avatar decorations are premium
            category: null,
            tags: null,
            local_path: null,
            cdn_url: `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`,
            thumbnail_url: `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=96`,
            expires_at: expires_at || null,
          });
          
          stats.avatarDecorations++;
        }
      }

      // Banner
      if (user.banner) {
        if (!uniqueBanners.has(user.banner)) {
          uniqueBanners.add(user.banner);
          
          upsertBannerDecoration({
            banner_hash: user.banner,
            name: null,
            description: null,
            is_animated: user.banner.startsWith('a_'),
            is_premium: true,
            category: null,
            tags: null,
            local_path: null,
            cdn_url: `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner.startsWith('a_') ? 'gif' : 'png'}`,
            thumbnail_url: `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner.startsWith('a_') ? 'gif' : 'png'}?size=300`,
          });
          
          stats.banners++;
        }
      }

      // Profile theme colors
      if (user.banner_color || user.accent_color) {
        const primaryColor = user.banner_color || `#${(user.accent_color || 0).toString(16).padStart(6, '0')}`;
        const themeName = `color_${primaryColor.replace('#', '')}`;
        
        upsertProfileTheme({
          theme_name: themeName,
          primary_color: primaryColor,
          accent_color: null,
          theme_colors: null,
          is_premium: true,
          gradient_data: null,
        });
        
        stats.themes++;
      }
    }

    const totalFound = stats.avatarDecorations + stats.profileEffects + stats.banners + stats.themes;
    updateSyncLog(syncId as number, totalFound, totalFound, 0, 'completed');

    console.log('Sync completed:', stats);
    return stats;
  } catch (error: any) {
    updateSyncLog(syncId as number, 0, 0, 0, 'failed', error.message);
    throw error;
  }
}

/**
 * Fetches decoration data for specific SKUs (manual entry)
 */
export async function addDecorationBySku(
  skuId: string,
  type: 'avatar' | 'effect',
  name: string,
  description?: string
): Promise<void> {
  // This would require manual entry of SKU data
  // Discord doesn't provide a public API to list all available decorations
  // SKUs would need to be discovered through the Discord shop or datamining
  
  if (type === 'avatar') {
    // Avatar decorations would need asset hash
    // This is a placeholder for manual entry
    console.log(`Manual entry required for avatar decoration SKU: ${skuId}`);
  } else if (type === 'effect') {
    // Profile effects would need effect ID
    console.log(`Manual entry required for profile effect SKU: ${skuId}`);
  }
}

/**
 * Downloads decoration asset from Discord CDN
 */
export async function downloadDecorationAsset(
  url: string,
  savePath: string
): Promise<boolean> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download asset: ${response.statusText}`);
    }

    // In a real implementation, you would:
    // 1. Save the file to disk using fs
    // 2. Optimize the image (convert to WebP)
    // 3. Create thumbnails
    // 4. Update the database with local_path
    
    console.log(`Downloaded asset from ${url} to ${savePath}`);
    return true;
  } catch (error) {
    console.error(`Error downloading asset from ${url}:`, error);
    return false;
  }
}
