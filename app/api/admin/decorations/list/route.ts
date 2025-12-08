import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    
    // Fetch avatar decorations
    const avatarDecorations = db.prepare(`
      SELECT 
        id,
        sku_id,
        name as asset_name,
        cdn_url as asset_url,
        thumbnail_url,
        description,
        is_animated
      FROM avatar_decorations 
      WHERE is_active = 1
      ORDER BY name
    `).all();
    
    // Fetch banner decorations
    const bannerDecorations = db.prepare(`
      SELECT 
        id,
        banner_hash as sku_id,
        name as asset_name,
        cdn_url as asset_url,
        thumbnail_url,
        is_animated
      FROM banner_decorations 
      WHERE is_active = 1
      ORDER BY name
    `).all();
    
    // Fetch profile effects
    const profileEffects = db.prepare(`
      SELECT 
        id,
        effect_id as sku_id,
        name as effect_name,
        cdn_url as asset_url,
        thumbnail_url,
        is_animated,
        description
      FROM profile_effects 
      WHERE is_active = 1
      ORDER BY name
    `).all();
    
    return NextResponse.json({
      avatarDecorations,
      bannerDecorations,
      profileEffects
    });
  } catch (error) {
    console.error('Error fetching decorations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decorations' },
      { status: 500 }
    );
  }
}
