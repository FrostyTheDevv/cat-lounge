/**
 * Discord Decoration Research & API Documentation
 * 
 * This file documents Discord's decoration system and available API endpoints
 * for fetching avatar decorations, profile effects, and other customization data.
 * 
 * NOTE: Discord's decoration API is not publicly documented. This implementation
 * uses a combination of:
 * 1. Discord Gateway events (USER_UPDATE)
 * 2. Discord REST API user endpoints
 * 3. Discord CDN for decoration assets
 */

// ==================================================
// DISCORD DECORATION TYPES
// ==================================================

/**
 * Avatar Decorations
 * - Applied as an overlay on user avatars
 * - Can be animated or static
 * - Available through Nitro or special events
 * - Accessible via user profile data
 */
export interface AvatarDecoration {
  asset: string;          // Hash of the decoration asset
  sku_id: string;         // SKU identifier for the decoration
  expires_at?: string;    // Expiration date for limited-time decorations
}

/**
 * Profile Effects
 * - Animated effects displayed on user profiles
 * - Include particles, glows, and other visual effects
 * - Premium feature (Nitro)
 */
export interface ProfileEffect {
  id: string;
  sku_id: string;
  type: number;
  asset: string;
  title: string;
  description: string;
}

/**
 * Banner Data
 * - Custom banner images for profiles
 * - Available through Nitro
 * - Can be animated (GIF/APNG)
 */
export interface UserBanner {
  banner: string | null;         // Banner hash
  banner_color: string | null;   // Hex color code
  accent_color: number | null;   // Decimal color code
}

/**
 * Profile Theme Colors
 * - Custom theme colors for profiles
 * - Primary and accent colors
 */
export interface ProfileTheme {
  theme_colors?: number[];  // Array of color integers
}

// ==================================================
// DISCORD API ENDPOINTS
// ==================================================

/**
 * User Profile Endpoint
 * GET /users/{user.id}
 * Returns basic user data including avatar decoration
 */
export const DISCORD_USER_ENDPOINT = 'https://discord.com/api/v10/users';

/**
 * Current User Endpoint
 * GET /users/@me
 * Returns authenticated user's full profile with decorations
 */
export const DISCORD_CURRENT_USER = 'https://discord.com/api/v10/users/@me';

/**
 * Guild Member Endpoint
 * GET /guilds/{guild.id}/members/{user.id}
 * Returns member data including roles and nickname
 */
export const DISCORD_GUILD_MEMBER = (guildId: string, userId: string) =>
  `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`;

/**
 * User Profile Extended
 * GET /users/{user.id}/profile
 * Returns extended profile data including:
 * - Avatar decoration
 * - Profile effect
 * - Banner
 * - Theme colors
 * - Bio
 * - Badges
 * 
 * Note: This endpoint requires authentication with guilds scope
 */
export const DISCORD_USER_PROFILE = (userId: string, guildId?: string) => {
  const base = `https://discord.com/api/v10/users/${userId}/profile`;
  return guildId ? `${base}?with_mutual_guilds=false&guild_id=${guildId}` : base;
};

/**
 * Discord CDN for Assets
 * Avatar Decorations: https://cdn.discordapp.com/avatar-decoration-presets/{asset}.png
 * Banners: https://cdn.discordapp.com/banners/{user_id}/{banner_hash}.{ext}
 * Avatars: https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.{ext}
 */
export const DISCORD_CDN = {
  avatarDecoration: (asset: string) =>
    `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`,
  
  avatarDecorationAnimated: (asset: string) =>
    `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=240&passthrough=true`,
  
  banner: (userId: string, hash: string, animated: boolean = false) =>
    `https://cdn.discordapp.com/banners/${userId}/${hash}.${animated ? 'gif' : 'png'}?size=600`,
  
  avatar: (userId: string, hash: string, animated: boolean = false) =>
    `https://cdn.discordapp.com/avatars/${userId}/${hash}.${animated ? 'gif' : 'png'}?size=256`,
  
  defaultAvatar: (discriminator: number) =>
    `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`,
};

// ==================================================
// DISCORD DECORATION COLLECTION STRATEGY
// ==================================================

/**
 * Since Discord doesn't provide a public API to list ALL decorations,
 * we need to collect them from multiple sources:
 * 
 * 1. GUILD MEMBER SCRAPING
 *    - Fetch all guild members using bot token
 *    - Extract avatar_decoration_data from each member
 *    - Store unique decorations in database
 * 
 * 2. USER PROFILE FETCHING
 *    - For each member, fetch extended profile using /users/{id}/profile
 *    - Extract profile_effect_id, banner, theme_colors
 *    - Store unique profile effects and themes
 * 
 * 3. DISCORD NITRO SHOP (Manual)
 *    - Monitor Discord's shop for new decorations
 *    - Add new SKUs manually when they appear
 * 
 * 4. PERIODIC SYNCING
 *    - Weekly automated sync to check for new decorations
 *    - Compare with existing database and add new items
 *    - Mark deprecated decorations as inactive
 */

// ==================================================
// IMPLEMENTATION NOTES
// ==================================================

/**
 * RATE LIMITING:
 * - Discord API has strict rate limits
 * - Global: 50 requests per second
 * - Per-route: Varies by endpoint
 * - Must implement exponential backoff
 * - Cache responses aggressively
 * 
 * AUTHENTICATION:
 * - Bot token required for guild member list
 * - OAuth token required for user profile endpoint
 * - Different scopes provide different data access
 * 
 * DATA PRIVACY:
 * - Only store decoration metadata, not user data
 * - Don't store who owns what decorations
 * - Focus on cataloging available decorations
 * 
 * ASSET STORAGE:
 * - Download decoration assets to local storage
 * - Optimize images (convert to WebP)
 * - Create multiple sizes for responsive loading
 * - Implement CDN caching strategy
 */

export const RATE_LIMIT_DELAY = 100; // ms between requests
export const MAX_RETRIES = 3;
export const BACKOFF_MULTIPLIER = 2;
