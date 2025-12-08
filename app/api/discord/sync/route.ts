import { NextRequest, NextResponse } from 'next/server';
import { updateStaffFromDiscord } from '@/lib/database';

// This endpoint receives Discord user data and syncs it to the database
export async function POST(request: NextRequest) {
  try {
    // Verify the request is coming from our Discord bot (simple secret key)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.DISCORD_BOT_TOKEN;

    if (expectedToken && (!authHeader || authHeader !== `Bearer ${expectedToken}`)) {
      console.error('Authorization failed:', { authHeader, hasToken: !!expectedToken });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received sync request:', JSON.stringify(body, null, 2));
    
    const { discord_id, discord_tag, name, nickname, avatar_url, banner_url, avatar_decoration, role, bio, is_bot } = body;

    if (!discord_id || !discord_tag || !name || !avatar_url) {
      console.error('Missing required fields:', { 
        discord_id: !!discord_id, 
        discord_tag: !!discord_tag, 
        name: !!name, 
        avatar_url: !!avatar_url,
        fullBody: body 
      });
      return NextResponse.json(
        { 
          error: 'discord_id, discord_tag, name, and avatar_url are required',
          missing: {
            discord_id: !discord_id,
            discord_tag: !discord_tag,
            name: !name,
            avatar_url: !avatar_url
          }
        },
        { status: 400 }
      );
    }

    // Reject bot accounts
    if (is_bot === true) {
      return NextResponse.json(
        { error: 'Bot accounts cannot be synced as staff' },
        { status: 400 }
      );
    }

    // Additional bot name check as safeguard
    const botNames = ['Chordy', 'Countr', 'MEE6', 'Dyno', 'ProBot', 'Carl-bot', 'Arcane', 'Mudae', 'Dank Memer', 'Pokétwo', 'Groovy', 'Rythm', 'Hydra', 'FredBoat', 'Auttaja', 'YAGPDB.xyz', 'Apollo', 'Lawliet', 'Vexera', 'Zandercraft', 'GiveawayBot', 'Birthday Bot', 'Ticket Tool', 'Helper.gg', 'Translator', 'UnbelievaBoat', 'Sesh', 'Statbot', 'Welcomer', 'Tatsumaki'];
    if (botNames.includes(name)) {
      return NextResponse.json(
        { error: 'Recognized bot account cannot be synced as staff' },
        { status: 400 }
      );
    }

    // Update staff member data from Discord
    updateStaffFromDiscord(discord_id, discord_tag, name, nickname, avatar_url, banner_url, avatar_decoration, role, bio);

    return NextResponse.json({ 
      success: true, 
      message: 'Staff data synced successfully' 
    });
  } catch (error) {
    console.error('Error syncing Discord data:', error);
    return NextResponse.json(
      { error: 'Failed to sync staff data' },
      { status: 500 }
    );
  }
}
