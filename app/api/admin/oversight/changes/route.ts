import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/adminAuth';
import { getAllProfileChanges } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);
    
    const changes = getAllProfileChanges(100);
    
    return NextResponse.json(changes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 401 }
    );
  }
}
