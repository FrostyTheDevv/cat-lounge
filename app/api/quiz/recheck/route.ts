import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
const DISCORD_MEMBER_ROLE_ID = process.env.DISCORD_MEMBER_ROLE_ID!;

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('quiz_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    // Re-check member role via Discord API
    try {
      const memberResponse = await fetch(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${session.discordUserId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      if (memberResponse.ok) {
        const member = await memberResponse.json();
        const hasRole = Array.isArray(member.roles) && member.roles.includes(DISCORD_MEMBER_ROLE_ID);
        
        console.log('Recheck - User:', session.discordUserId);
        console.log('Recheck - Member roles:', member.roles);
        console.log('Recheck - Looking for role:', DISCORD_MEMBER_ROLE_ID);
        console.log('Recheck - Has member role:', hasRole);

        // Update session with new status
        session.inGuild = hasRole;

        const updatedCookie = serialize('quiz_session', JSON.stringify(session), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        });

        const response = NextResponse.json({
          inGuild: hasRole,
          user: {
            id: session.discordUserId,
            username: session.username,
            avatar: session.avatar,
          },
        });

        response.headers.set('Set-Cookie', updatedCookie);
        return response;
      } else {
        console.error('Recheck - Member fetch failed:', memberResponse.status);
        return NextResponse.json({
          inGuild: false,
        });
      }
    } catch (err) {
      console.error('Recheck - Failed to verify member role:', err);
      return NextResponse.json({
        inGuild: false,
      });
    }
  } catch (error) {
    console.error('Recheck error:', error);
    return NextResponse.json(
      { error: 'Failed to recheck status' },
      { status: 500 }
    );
  }
}
