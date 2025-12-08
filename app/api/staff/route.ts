import { NextRequest, NextResponse } from 'next/server';
import { getAllStaff } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const staff = getAllStaff();
    
    // Add cache headers for better performance
    return NextResponse.json(staff, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}
