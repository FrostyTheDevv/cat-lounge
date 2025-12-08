import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminAuth } from '@/lib/adminAuth';
import {
  assignDecorationToStaff,
  removeDecorationAssignment,
  getStaffDecorationAssignments,
  getAllDecorationAssignments,
  logProfileChange,
} from '@/lib/database';

/**
 * POST /api/admin/decorations/assign
 * Assign a decoration to a staff member
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const { staffId, decorationType, decorationId, isOverride } = await request.json();
    
    if (!staffId || !decorationType || !decorationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = assignDecorationToStaff({
      staffId,
      decorationType,
      decorationId,
      assignedByDiscordId: auth.session.discord_id,
      assignedByUsername: auth.session.discord_username,
      isOverride: isOverride || false,
    });

    // Log the change
    logProfileChange(
      staffId,
      auth.session.discord_id,
      auth.session.discord_username,
      'decoration_assigned',
      `${decorationType}_decoration`,
      null,
      decorationId.toString()
    );

    return NextResponse.json({
      success: true,
      message: 'Decoration assigned successfully',
      assignmentId: result.lastInsertRowid,
    });
  } catch (error: any) {
    console.error('Error assigning decoration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign decoration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/decorations/assign?assignmentId=123
 * Remove a decoration assignment
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing assignmentId parameter' },
        { status: 400 }
      );
    }

    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    removeDecorationAssignment(parseInt(assignmentId));

    return NextResponse.json({
      success: true,
      message: 'Decoration assignment removed',
    });
  } catch (error: any) {
    console.error('Error removing decoration assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove assignment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/decorations/assign?staffId=123
 * Get decoration assignments for a staff member or all assignments
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    const assignments = staffId
      ? getStaffDecorationAssignments(parseInt(staffId))
      : getAllDecorationAssignments();

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error: any) {
    console.error('Error fetching decoration assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
