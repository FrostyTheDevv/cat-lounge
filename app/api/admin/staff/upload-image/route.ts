import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(req);

    const formData = await req.formData();
    const file = formData.get('image') as File;
    const type = formData.get('type') as string; // 'avatar' or 'banner'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['avatar', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "avatar" or "banner"' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Supported formats: PNG, JPEG, WebP, GIF' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 });
    }

    // Generate unique filename
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.name) || '.png';
    const filename = `${type}-${hash}${ext}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'staff');
    await mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image based on type
    let processedImage = sharp(buffer);

    if (type === 'avatar') {
      // Avatar: resize to 256x256, convert to WebP
      processedImage = processedImage
        .resize(256, 256, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 90 });
      
      // Update filename extension to .webp
      const webpFilename = filename.replace(ext, '.webp');
      const webpFilepath = path.join(uploadDir, webpFilename);
      
      await processedImage.toFile(webpFilepath);
      
      return NextResponse.json({
        success: true,
        url: `/uploads/staff/${webpFilename}`,
        type: 'avatar'
      });
    } else {
      // Banner: resize to 1024x576 (16:9), convert to WebP
      processedImage = processedImage
        .resize(1024, 576, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 90 });
      
      // Update filename extension to .webp
      const webpFilename = filename.replace(ext, '.webp');
      const webpFilepath = path.join(uploadDir, webpFilename);
      
      await processedImage.toFile(webpFilepath);
      
      return NextResponse.json({
        success: true,
        url: `/uploads/staff/${webpFilename}`,
        type: 'banner'
      });
    }
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image',
      details: error.message 
    }, { status: 500 });
  }
}
