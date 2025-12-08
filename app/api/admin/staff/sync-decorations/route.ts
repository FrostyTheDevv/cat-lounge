import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminAuth } from '@/lib/adminAuth';
import { syncStaffMemberDecorations, syncAllStaffDecorations } from '@/lib/discordProfileSync';

/**
 * POST /api/admin/staff/sync-decorations
 * Syncs Discord profile decorations for staff members
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult) return authResult;

  try {
    const { discordId, staffId, syncAll } = await request.json();
    const auth = await getAdminAuth(request);

    if (!auth || !auth.session.access_token) {
      return NextResponse.json(
        { success: false, error: 'No access token available' },
        { status: 401 }
      );
    }

    const accessToken = auth.session.access_token;

    if (syncAll) {
      // Sync all staff members
      const stats = await syncAllStaffDecorations(accessToken);
      return NextResponse.json({
        success: true,
        message: 'All staff decorations synced',
        stats,
      });
    } else if (staffId && discordId) {
      // Sync single staff member
      const success = await syncStaffMemberDecorations(staffId, discordId, accessToken);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Staff decorations synced successfully',
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to sync staff decorations' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing staffId and discordId' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Discord sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/staff/sync-decorations
 * Get staff member's current decorations
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult) return authResult;

  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get('discordId');

  if (!discordId) {
    return NextResponse.json(
      { success: false, error: 'Missing discordId parameter' },
      { status: 400 }
    );
  }

  try {
    const { getStaffCurrentDecorations } = await import('@/lib/discordProfileSync');
    const decorations = getStaffCurrentDecorations(discordId);

    if (!decorations) {
      return NextResponse.json(
        { success: false, error: 'No decorations found for this staff member' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      decorations,
    });
  } catch (error: any) {
    console.error('Error fetching staff decorations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch decorations' },
      { status: 500 }
    );
  }
}
