import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/adminAuth';
import { downloadAllDecorationAssets } from '@/lib/assetOptimizer';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireOwner(request);
    const stats = await downloadAllDecorationAssets();

    return NextResponse.json({
      success: true,
      stats,
      message: 'Asset download and optimization completed',
    });
  } catch (error: any) {
    console.error('Asset download failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to download assets' 
      },
      { status: 500 }
    );
  }
}
