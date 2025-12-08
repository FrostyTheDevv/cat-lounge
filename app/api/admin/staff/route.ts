import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createStaffMember } from '@/lib/database';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireAdmin(request);

    const { name, discord_tag, role, bio, avatar_url, discord_id, position_order } = await request.json();

    if (!name || !discord_tag || !role) {
      return NextResponse.json(
        { error: 'Name, discord_tag, and role are required' },
        { status: 400 }
      );
    }

    const result = createStaffMember(
      name,
      discord_tag,
      role,
      bio,
      avatar_url,
      discord_id,
      position_order
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
