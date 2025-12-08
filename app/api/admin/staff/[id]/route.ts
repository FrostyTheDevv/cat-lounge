import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { 
  updateStaffMember, 
  deleteStaffMember, 
  getStaffById, 
  isEditingLocked,
  logProfileChange 
} from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);

    // Check if editing is locked (only owner can bypass)
    if (isEditingLocked() && !auth.isOwner) {
      return NextResponse.json(
        { error: 'Editing is currently locked by the server owner' },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const {  
      custom_nickname, 
      custom_bio,
      custom_bio_emojis,
      custom_sections, 
      custom_role, 
      custom_avatar_url, 
      custom_banner_url,
      position_order 
    } = await request.json();

    // Get current staff data for change tracking
    const currentStaff = getStaffById(id);
    if (!currentStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Track changes for each field
    const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
    
    if (custom_nickname !== currentStaff.custom_nickname) {
      changes.push({
        field: 'custom_nickname',
        oldValue: currentStaff.custom_nickname,
        newValue: custom_nickname
      });
    }
    if (custom_bio !== currentStaff.custom_bio) {
      changes.push({
        field: 'custom_bio',
        oldValue: currentStaff.custom_bio,
        newValue: custom_bio
      });
    }
    if (custom_bio_emojis !== currentStaff.custom_bio_emojis) {
      changes.push({
        field: 'custom_bio_emojis',
        oldValue: currentStaff.custom_bio_emojis,
        newValue: custom_bio_emojis
      });
    }
    if (custom_sections !== currentStaff.custom_sections) {
      changes.push({
        field: 'custom_sections',
        oldValue: currentStaff.custom_sections,
        newValue: custom_sections
      });
    }
    if (custom_role !== currentStaff.custom_role) {
      changes.push({
        field: 'custom_role',
        oldValue: currentStaff.custom_role,
        newValue: custom_role
      });
    }
    if (custom_avatar_url !== currentStaff.custom_avatar_url) {
      changes.push({
        field: 'custom_avatar_url',
        oldValue: currentStaff.custom_avatar_url,
        newValue: custom_avatar_url
      });
    }
    if (custom_banner_url !== currentStaff.custom_banner_url) {
      changes.push({
        field: 'custom_banner_url',
        oldValue: currentStaff.custom_banner_url,
        newValue: custom_banner_url
      });
    }
    if (position_order !== currentStaff.position_order) {
      changes.push({
        field: 'position_order',
        oldValue: currentStaff.position_order,
        newValue: position_order
      });
    }

    // Update only custom override fields
    const database = await import('@/lib/database');
    
    console.log('Updating staff member:', {
      id,
      custom_nickname,
      custom_bio,
      custom_role,
      custom_avatar_url,
      custom_banner_url,
      position_order
    });

    const stmt = database.db.prepare(`
      UPDATE staff 
      SET 
        custom_nickname = ?,
        custom_bio = ?,
        custom_bio_emojis = ?,
        custom_sections = ?,
        custom_role = ?,
        custom_avatar_url = ?,
        custom_banner_url = ?,
        position_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(
      custom_nickname || null,
      custom_bio || null,
      custom_bio_emojis || null,
      custom_sections || null,
      custom_role || null,
      custom_avatar_url || null,
      custom_banner_url || null,
      position_order || 0,
      id
    );

    console.log('Update result:', result.changes, 'rows affected');

    // Log all changes
    changes.forEach(change => {
      logProfileChange(
        id,
        auth.session.discord_id,
        auth.session.discord_username,
        'update',
        change.field,
        change.oldValue,
        change.newValue
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);

    // Check if editing is locked (only owner can bypass)
    if (isEditingLocked() && !auth.isOwner) {
      return NextResponse.json(
        { error: 'Editing is currently locked by the server owner' },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    // Get staff data before deletion for logging
    const staff = getStaffById(id);
    if (staff) {
      logProfileChange(
        id,
        auth.session.discord_id,
        auth.session.discord_username,
        'delete',
        null,
        staff,
        null
      );
    }
    
    deleteStaffMember(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
