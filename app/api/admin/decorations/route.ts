import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  getAllAvatarDecorations,
  getAllProfileEffects,
  getAllBannerDecorations,
  getAllProfileThemes,
  getRecentSyncLogs,
} from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const activeOnly = searchParams.get('active') !== 'false';
    const search = searchParams.get('search')?.toLowerCase() || '';
    const availability = searchParams.get('availability') || 'all'; // all, premium, free
    const sort = searchParams.get('sort') || 'recent'; // recent, name, popular

    let data: any = {};

    // Helper function to filter decorations
    const filterDecorations = (items: any[]) => {
      let filtered = items;

      // Search filter
      if (search) {
        filtered = filtered.filter(item => 
          (item.name?.toLowerCase().includes(search)) ||
          (item.description?.toLowerCase().includes(search)) ||
          (item.tags?.toLowerCase().includes(search))
        );
      }

      // Availability filter
      if (availability === 'premium') {
        filtered = filtered.filter(item => item.is_premium);
      } else if (availability === 'free') {
        filtered = filtered.filter(item => !item.is_premium);
      }

      // Sort
      if (sort === 'name') {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (sort === 'recent') {
        filtered.sort((a, b) => 
          new Date(b.last_seen || 0).getTime() - new Date(a.last_seen || 0).getTime()
        );
      }

      return filtered;
    };

    if (category === 'avatar' || category === 'all') {
      const avatarDecorations = getAllAvatarDecorations(activeOnly);
      data.avatarDecorations = filterDecorations(avatarDecorations);
    }

    if (category === 'effect' || category === 'all') {
      const profileEffects = getAllProfileEffects(activeOnly);
      data.profileEffects = filterDecorations(profileEffects);
    }

    if (category === 'banner' || category === 'all') {
      const bannerDecorations = getAllBannerDecorations(activeOnly);
      data.bannerDecorations = filterDecorations(bannerDecorations);
    }

    if (category === 'theme' || category === 'all') {
      const profileThemes = getAllProfileThemes(activeOnly);
      data.profileThemes = filterDecorations(profileThemes);
    }

    if (category === 'sync-logs') {
      const limit = parseInt(searchParams.get('limit') || '10');
      data.syncLogs = getRecentSyncLogs(limit);
    }

    // Add metadata
    data.metadata = {
      category,
      search,
      availability,
      sort,
      totalResults: Object.values(data).reduce((sum: number, arr: any) => 
        Array.isArray(arr) ? sum + arr.length : sum, 0
      ),
    };

    return NextResponse.json({
      success: true,
      data,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching decorations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch decorations' 
      },
      { status: 500 }
    );
  }
}
