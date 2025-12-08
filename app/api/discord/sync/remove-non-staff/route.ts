import { NextRequest, NextResponse } from 'next/server';
import { removeNonStaffMembers, getAllStaff } from '@/lib/database-async';

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
    const allStaff = await getAllStaff();

    // Find staff to remove (those not in current_staff_ids)
    const toRemove = allStaff.filter((staff: any) => 
      !current_staff_ids.includes(staff.discord_id)
    );

    if (toRemove.length > 0) {
      console.log(`Removing ${toRemove.length} demoted staff members:`);
      
      for (const staff of toRemove) {
        console.log(`  - ${staff.name} (${staff.discord_id})`);
      }
      
      // Remove non-staff members
      await removeNonStaffMembers(current_staff_ids);
    }

    return NextResponse.json({ 
      success: true,
      removed: toRemove.length,
      members: toRemove.map((s: any) => s.name)
    });

  } catch (error) {
    console.error('Error removing non-staff:', error);
    return NextResponse.json(
      { error: 'Failed to remove non-staff members' },
      { status: 500 }
    );
  }
}
