import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/adminAuth';
import { setEditingLocked } from '@/lib/database';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireOwner(request);
    
    const body = await request.json();
    const { locked } = body;
    
    if (typeof locked !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid locked value' },
        { status: 400 }
      );
    }
    
    setEditingLocked(locked);
    
    return NextResponse.json({
      success: true,
      locked,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 401 }
    );
  }
}
