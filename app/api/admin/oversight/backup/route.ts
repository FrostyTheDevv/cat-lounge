import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/adminAuth';
import { getAllStaff } from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireOwner(request);
    
    const staff = getAllStaff();
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      staff,
    };
    
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="staff-backup-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 401 }
    );
  }
}
