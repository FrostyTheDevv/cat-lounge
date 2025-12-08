import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/adminAuth';
import { cleanupUnusedAssets } from '@/lib/assetOptimizer';

export async function POST(request: NextRequest) {
  const authResult = await requireOwner(request);
  if (authResult) return authResult; // Not owner

  try {
    const deletedCount = await cleanupUnusedAssets();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} unused assets`,
    });
  } catch (error: any) {
    console.error('Asset cleanup failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to cleanup assets' 
      },
      { status: 500 }
    );
  }
}
