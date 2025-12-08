import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/adminAuth';
import { isEditingLocked, getAllStaff, getAllProfileChanges } from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireOwner(request);
    
    const staff = getAllStaff();
    const recentChanges = getAllProfileChanges(10);
    
    return NextResponse.json({
      editingLocked: isEditingLocked(),
      totalStaff: staff.length,
      recentChanges: recentChanges.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 401 }
    );
  }
}
