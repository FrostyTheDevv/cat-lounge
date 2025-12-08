import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { 
  createAdminSession, 
  getAdminSessionByDiscordId,
  deleteAdminSession 
} from '@/lib/database';
import { validateAdminAccess } from '@/lib/adminPermissions';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * POST /api/admin/auth
 * Discord OAuth callback handler for admin login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code required' },
        { status: 400 }
      );
    }

    // Get base URL automatically from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Exchange code for access token
    const tokenResponse = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/admin/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Discord token exchange failed:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Discord' },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user info from Discord
    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 401 }
      );
    }

    const user = await userResponse.json();
    const { id: discordId, username, avatar } = user;

    // Validate admin access and get permission level
    const accessValidation = await validateAdminAccess(discordId);

    if (!accessValidation.hasAccess || !accessValidation.permissionLevel) {
      return NextResponse.json(
        { error: 'You do not have permission to access the admin panel' },
        { status: 403 }
      );
    }

    // Delete any existing session for this user
    const existingSession = getAdminSessionByDiscordId(discordId);
    if (existingSession) {
      deleteAdminSession(existingSession.session_token);
    }

    // Create new admin session
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    createAdminSession(
      discordId,
      username,
      avatar,
      access_token,
      refresh_token,
      accessValidation.permissionLevel,
      accessValidation.member?.roles || [],
      sessionToken,
      expiresAt
    );

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      permissionLevel: accessValidation.permissionLevel,
      username,
      avatar,
    });

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auth
 * Returns Discord OAuth URL for admin login
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Discord client ID not configured' },
      { status: 500 }
    );
  }

  // Get base URL automatically from request
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/admin/auth/callback`;

  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify guilds');

  return NextResponse.json({
    authUrl: authUrl.toString(),
  });
}

/**
 * DELETE /api/admin/auth
 * Logout endpoint - deletes admin session
 */
export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value;

  if (sessionToken) {
    deleteAdminSession(sessionToken);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');

  return response;
}
