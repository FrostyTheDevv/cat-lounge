import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminAuth } from '@/lib/adminAuth';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import db from '@/lib/database';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'decorations');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

/**
 * POST /api/admin/decorations/upload
 * Upload a custom decoration
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const decorationType = formData.get('decorationType') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const isPremium = formData.get('isPremium') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF, SVG' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const basename = path.basename(file.name, ext);
    const safeBasename = basename.replace(/[^a-z0-9_-]/gi, '_');
    const filename = `${safeBasename}_${timestamp}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    // Optimize image if not SVG or GIF
    let optimizedPath = filepath;
    const isAnimated = file.type === 'image/gif';
    
    if (!isAnimated && file.type !== 'image/svg+xml') {
      const optimizedFilename = `${safeBasename}_${timestamp}.webp`;
      optimizedPath = path.join(UPLOAD_DIR, optimizedFilename);
      
      await sharp(buffer)
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 90 })
        .toFile(optimizedPath);

      // Delete original if different
      if (optimizedPath !== filepath) {
        await fs.unlink(filepath);
      }
    }

    // Create thumbnail
    const thumbnailFilename = `${safeBasename}_${timestamp}_thumb.webp`;
    const thumbnailPath = path.join(UPLOAD_DIR, thumbnailFilename);

    if (file.type !== 'image/svg+xml') {
      await sharp(buffer)
        .resize(100, 100, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(thumbnailPath);
    }

    // Get relative paths
    const relativePath = path.relative(
      path.join(process.cwd(), 'public'),
      optimizedPath
    ).replace(/\\/g, '/');
    const relativeThumbnail = file.type !== 'image/svg+xml' 
      ? path.relative(path.join(process.cwd(), 'public'), thumbnailPath).replace(/\\/g, '/')
      : relativePath;

    // Generate unique hash for custom decoration
    const customHash = `custom_${timestamp}_${Math.random().toString(36).substring(7)}`;

    // Insert into appropriate table based on decoration type
    let insertedId: number;
    if (decorationType === 'avatar') {
      const result = db.prepare(`
        INSERT INTO avatar_decorations (
          asset_hash, name, description, is_animated, is_premium,
          category, tags, local_path, cdn_url, thumbnail_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customHash, name, description || null, isAnimated ? 1 : 0, isPremium ? 1 : 0,
        category || 'custom', tags || null, relativePath, null, relativeThumbnail
      );
      insertedId = result.lastInsertRowid as number;
    } else if (decorationType === 'banner') {
      const result = db.prepare(`
        INSERT INTO banner_decorations (
          banner_hash, name, description, is_animated, is_premium,
          category, tags, local_path, cdn_url, thumbnail_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customHash, name, description || null, isAnimated ? 1 : 0, isPremium ? 1 : 0,
        category || 'custom', tags || null, relativePath, null, relativeThumbnail
      );
      insertedId = result.lastInsertRowid as number;
    } else if (decorationType === 'effect') {
      const result = db.prepare(`
        INSERT INTO profile_effects (
          effect_id, name, description, is_animated, is_premium,
          category, tags, local_path, cdn_url, thumbnail_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customHash, name, description || null, isAnimated ? 1 : 0, isPremium ? 1 : 0,
        category || 'custom', tags || null, relativePath, null, relativeThumbnail
      );
      insertedId = result.lastInsertRowid as number;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid decoration type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Decoration uploaded successfully',
      decoration: {
        id: insertedId,
        hash: customHash,
        name,
        local_path: relativePath,
        thumbnail_url: relativeThumbnail,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
