import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import db, {
  getAllAvatarDecorations,
  getAllProfileEffects,
  getAllBannerDecorations,
  getAvatarDecorationByHash,
} from './database';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'decorations');
const AVATAR_DECORATIONS_DIR = path.join(ASSETS_DIR, 'avatar-decorations');
const PROFILE_EFFECTS_DIR = path.join(ASSETS_DIR, 'profile-effects');
const BANNERS_DIR = path.join(ASSETS_DIR, 'banners');
const THUMBNAILS_DIR = path.join(ASSETS_DIR, 'thumbnails');

// Size configurations
const SIZES = {
  AVATAR_DECORATION: { width: 160, height: 160 },
  AVATAR_DECORATION_THUMB: { width: 80, height: 80 },
  PROFILE_EFFECT: { width: 400, height: 400 },
  PROFILE_EFFECT_THUMB: { width: 200, height: 200 },
  BANNER: { width: 600, height: 240 },
  BANNER_THUMB: { width: 300, height: 120 },
};

/**
 * Ensures all required directories exist
 */
async function ensureDirectories(): Promise<void> {
  const dirs = [
    ASSETS_DIR,
    AVATAR_DECORATIONS_DIR,
    PROFILE_EFFECTS_DIR,
    BANNERS_DIR,
    THUMBNAILS_DIR,
    path.join(THUMBNAILS_DIR, 'avatar-decorations'),
    path.join(THUMBNAILS_DIR, 'profile-effects'),
    path.join(THUMBNAILS_DIR, 'banners'),
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Downloads an image from a URL with retry logic
 */
async function downloadImage(url: string, maxRetries = 3): Promise<Buffer | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Asset not found: ${url}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.error(`Download attempt ${attempt + 1}/${maxRetries} failed for ${url}:`, error.message);
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  return null;
}

/**
 * Optimizes an image and saves it in multiple formats
 */
async function optimizeAndSave(
  imageBuffer: Buffer,
  outputPath: string,
  thumbnailPath: string,
  size: { width: number; height: number },
  thumbnailSize: { width: number; height: number },
  isAnimated: boolean
): Promise<{ full: string; thumbnail: string } | null> {
  try {
    // For animated images (GIF), we keep them as-is but still create a static thumbnail
    if (isAnimated) {
      // Save original animated GIF
      await fs.writeFile(outputPath.replace('.webp', '.gif'), imageBuffer);
      
      // Create static thumbnail from first frame
      await sharp(imageBuffer, { animated: false })
        .resize(thumbnailSize.width, thumbnailSize.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 85 })
        .toFile(thumbnailPath);

      return {
        full: outputPath.replace('.webp', '.gif'),
        thumbnail: thumbnailPath,
      };
    }

    // For static images, optimize as WebP
    // Full size
    await sharp(imageBuffer)
      .resize(size.width, size.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 90 })
      .toFile(outputPath);

    // Thumbnail
    await sharp(imageBuffer)
      .resize(thumbnailSize.width, thumbnailSize.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 85 })
      .toFile(thumbnailPath);

    return {
      full: outputPath,
      thumbnail: thumbnailPath,
    };
  } catch (error: any) {
    console.error(`Failed to optimize image:`, error.message);
    return null;
  }
}

/**
 * Downloads and optimizes all avatar decorations
 */
export async function downloadAvatarDecorations(): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  await ensureDirectories();
  
  const decorations = getAllAvatarDecorations(true); // Only active
  const stats = { success: 0, failed: 0, skipped: 0 };

  console.log(`Processing ${decorations.length} avatar decorations...`);

  for (const decoration of decorations) {
    // Skip if already downloaded
    if (decoration.local_path) {
      const fullPath = path.join(process.cwd(), 'public', decoration.local_path);
      try {
        await fs.access(fullPath);
        stats.skipped++;
        continue;
      } catch {
        // File doesn't exist, proceed with download
      }
    }

    console.log(`Downloading avatar decoration: ${decoration.asset_hash}`);

    if (!decoration.cdn_url) {
      stats.failed++;
      continue;
    }

    const imageBuffer = await downloadImage(decoration.cdn_url);
    if (!imageBuffer) {
      stats.failed++;
      continue;
    }

    const filename = `${decoration.asset_hash}.webp`;
    const outputPath = path.join(AVATAR_DECORATIONS_DIR, filename);
    const thumbnailPath = path.join(THUMBNAILS_DIR, 'avatar-decorations', filename);

    const result = await optimizeAndSave(
      imageBuffer,
      outputPath,
      thumbnailPath,
      SIZES.AVATAR_DECORATION,
      SIZES.AVATAR_DECORATION_THUMB,
      decoration.is_animated
    );

    if (result) {
      // Update database with local paths
      const relativePath = path.relative(
        path.join(process.cwd(), 'public'),
        result.full
      ).replace(/\\/g, '/');
      const relativeThumbnail = path.relative(
        path.join(process.cwd(), 'public'),
        result.thumbnail
      ).replace(/\\/g, '/');

      db.prepare(`
        UPDATE avatar_decorations 
        SET local_path = ?, thumbnail_url = ?
        WHERE asset_hash = ?
      `).run(relativePath, relativeThumbnail, decoration.asset_hash);

      stats.success++;
    } else {
      stats.failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return stats;
}

/**
 * Downloads and optimizes all banner decorations
 */
export async function downloadBannerDecorations(): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  await ensureDirectories();
  
  const banners = getAllBannerDecorations(true);
  const stats = { success: 0, failed: 0, skipped: 0 };

  console.log(`Processing ${banners.length} banner decorations...`);

  for (const banner of banners) {
    // Skip if already downloaded
    if (banner.local_path) {
      const fullPath = path.join(process.cwd(), 'public', banner.local_path);
      try {
        await fs.access(fullPath);
        stats.skipped++;
        continue;
      } catch {
        // File doesn't exist, proceed with download
      }
    }

    console.log(`Downloading banner: ${banner.banner_hash}`);

    if (!banner.cdn_url) {
      stats.failed++;
      continue;
    }

    const imageBuffer = await downloadImage(banner.cdn_url);
    if (!imageBuffer) {
      stats.failed++;
      continue;
    }

    const filename = `${banner.banner_hash}.webp`;
    const outputPath = path.join(BANNERS_DIR, filename);
    const thumbnailPath = path.join(THUMBNAILS_DIR, 'banners', filename);

    const result = await optimizeAndSave(
      imageBuffer,
      outputPath,
      thumbnailPath,
      SIZES.BANNER,
      SIZES.BANNER_THUMB,
      banner.is_animated
    );

    if (result) {
      const relativePath = path.relative(
        path.join(process.cwd(), 'public'),
        result.full
      ).replace(/\\/g, '/');
      const relativeThumbnail = path.relative(
        path.join(process.cwd(), 'public'),
        result.thumbnail
      ).replace(/\\/g, '/');

      db.prepare(`
        UPDATE banner_decorations 
        SET local_path = ?, thumbnail_url = ?
        WHERE banner_hash = ?
      `).run(relativePath, relativeThumbnail, banner.banner_hash);

      stats.success++;
    } else {
      stats.failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return stats;
}

/**
 * Downloads and optimizes all decoration assets
 */
export async function downloadAllDecorationAssets(): Promise<{
  avatarDecorations: { success: number; failed: number; skipped: number };
  banners: { success: number; failed: number; skipped: number };
}> {
  console.log('Starting decoration asset download and optimization...');

  const avatarStats = await downloadAvatarDecorations();
  console.log('Avatar decorations:', avatarStats);

  const bannerStats = await downloadBannerDecorations();
  console.log('Banners:', bannerStats);

  console.log('Asset download and optimization complete!');

  return {
    avatarDecorations: avatarStats,
    banners: bannerStats,
  };
}

/**
 * Cleans up old/unused decoration assets
 */
export async function cleanupUnusedAssets(): Promise<number> {
  await ensureDirectories();
  
  let deletedCount = 0;

  // Get all active decorations
  const activeAvatarDecorations = getAllAvatarDecorations(true);
  const activeBanners = getAllBannerDecorations(true);

  const activeAvatarHashes = new Set(activeAvatarDecorations.map(d => d.asset_hash));
  const activeBannerHashes = new Set(activeBanners.map(d => d.banner_hash));

  // Check avatar decoration files
  try {
    const avatarFiles = await fs.readdir(AVATAR_DECORATIONS_DIR);
    for (const file of avatarFiles) {
      const hash = path.parse(file).name;
      if (!activeAvatarHashes.has(hash)) {
        await fs.unlink(path.join(AVATAR_DECORATIONS_DIR, file));
        deletedCount++;
      }
    }
  } catch (error) {
    console.error('Error cleaning avatar decorations:', error);
  }

  // Check banner files
  try {
    const bannerFiles = await fs.readdir(BANNERS_DIR);
    for (const file of bannerFiles) {
      const hash = path.parse(file).name;
      if (!activeBannerHashes.has(hash)) {
        await fs.unlink(path.join(BANNERS_DIR, file));
        deletedCount++;
      }
    }
  } catch (error) {
    console.error('Error cleaning banners:', error);
  }

  console.log(`Cleaned up ${deletedCount} unused assets`);
  return deletedCount;
}
