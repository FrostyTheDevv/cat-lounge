import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is coming from our Discord bot
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.DISCORD_BOT_TOKEN;

    if (expectedToken && (!authHeader || authHeader !== `Bearer ${expectedToken}`)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { current_staff_ids } = body;

    if (!Array.isArray(current_staff_ids)) {
      return NextResponse.json(
        { error: 'current_staff_ids must be an array' },
        { status: 400 }
      );
    }

    // Get all staff members from database
    interface StaffRecord {
      id: number;
      discord_id: string;
      name: string;
    }
    
    const allStaff = db.prepare('SELECT id, discord_id, name FROM staff').all() as StaffRecord[];

    // Find staff to remove (those not in current_staff_ids)
    const toRemove = allStaff.filter((staff) => 
      !current_staff_ids.includes(staff.discord_id)
    );

    if (toRemove.length > 0) {
      console.log(`Removing ${toRemove.length} demoted staff members:`);
      
      const deleteStmt = db.prepare('DELETE FROM staff WHERE discord_id = ?');
      
      for (const staff of toRemove) {
        console.log(`  - ${staff.name} (${staff.discord_id})`);
        deleteStmt.run(staff.discord_id);
      }
    }

    return NextResponse.json({ 
      success: true,
      removed: toRemove.length,
      members: toRemove.map((s) => s.name)
    });

  } catch (error) {
    console.error('Error removing non-staff:', error);
    return NextResponse.json(
      { error: 'Failed to remove non-staff members' },
      { status: 500 }
    );
  }
}
