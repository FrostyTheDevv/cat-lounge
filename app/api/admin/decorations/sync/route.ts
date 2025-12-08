import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/adminAuth';
import { syncDecorationsFromGuild } from '@/lib/decorationFetcher';

export async function POST(request: NextRequest) {
  const authResult = await requireOwner(request);
  if (authResult) return authResult; // Not owner

  try {
    const stats = await syncDecorationsFromGuild();

    return NextResponse.json({
      success: true,
      stats,
      message: 'Decoration sync completed successfully',
    });
  } catch (error: any) {
    console.error('Decoration sync failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to sync decorations' 
      },
      { status: 500 }
    );
  }
}
