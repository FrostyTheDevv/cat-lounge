import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('quiz_session');
    
    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        inGuild: false,
      });
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Try to get user from auth system first
    let avatar = session.avatar;
    let username = session.username;
    
    // Check if user has a local account with custom avatar
    const localUser = getUserByUsername(session.username);
    if (localUser) {
      username = localUser.username;
      avatar = localUser.pfp || session.avatar;
    }

    return NextResponse.json({
      authenticated: true,
      inGuild: session.inGuild,
      user: {
        id: session.discordUserId,
        username: username,
        avatar: avatar,
      },
    });
  } catch (error) {
    console.error('Quiz status error:', error);
    return NextResponse.json(
      { error: 'Failed to get quiz status' },
      { status: 500 }
    );
  }
}
