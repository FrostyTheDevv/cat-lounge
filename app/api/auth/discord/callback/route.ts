import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
const DISCORD_MEMBER_ROLE_ID = process.env.DISCORD_MEMBER_ROLE_ID!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const savedState = request.cookies.get('discord_oauth_state')?.value;

  // CSRF protection
  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL('/quiz?error=invalid_state', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/quiz?error=no_code', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Fetch user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const user = await userResponse.json();

    // Fetch user's guilds
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const guilds = await guildsResponse.json();

    // Check if user is in the target guild
    let inGuild = guilds.some((guild: any) => guild.id === DISCORD_GUILD_ID);

    // If in guild, verify they have the member role
    if (inGuild) {
      try {
        const memberResponse = await fetch(
          `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${user.id}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
          }
        );

        if (memberResponse.ok) {
          const member = await memberResponse.json();
          // Discord returns roles as array of role IDs
          inGuild = Array.isArray(member.roles) && member.roles.includes(DISCORD_MEMBER_ROLE_ID);
          console.log('Member roles:', member.roles);
          console.log('Looking for role:', DISCORD_MEMBER_ROLE_ID);
          console.log('Has member role:', inGuild);
        } else {
          console.error('Member fetch failed:', memberResponse.status);
          inGuild = false;
        }
      } catch (err) {
        console.error('Failed to verify member role:', err);
        inGuild = false;
      }
    }

    // Store session data in cookie
    const sessionData = {
      discordUserId: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : '/noprofile.png',
      inGuild,
    };

    const sessionCookie = serialize('quiz_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    const response = NextResponse.redirect(new URL('/quiz', request.url));
    response.headers.set('Set-Cookie', sessionCookie);

    return response;
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(new URL('/quiz?error=auth_failed', request.url));
  }
}
