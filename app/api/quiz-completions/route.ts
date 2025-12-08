import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.QUIZ_API_KEY;

    if (!expectedKey) {
      console.error('QUIZ_API_KEY not configured in environment');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const providedKey = authHeader.substring(7); // Remove 'Bearer '
    if (providedKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get 'since' parameter (Unix timestamp)
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    
    if (!sinceParam) {
      return NextResponse.json(
        { error: 'Missing "since" parameter' },
        { status: 400 }
      );
    }

    const since = parseInt(sinceParam);
    if (isNaN(since)) {
      return NextResponse.json(
        { error: 'Invalid "since" parameter - must be Unix timestamp' },
        { status: 400 }
      );
    }

    // Convert Unix timestamp to ISO datetime string for SQLite
    const sinceDate = new Date(since * 1000).toISOString();

    // Query quiz results completed after the 'since' timestamp
    const completions = db.prepare(`
      SELECT 
        discord_user_id,
        discord_username,
        archetype_key,
        completed_at,
        score_breakdown
      FROM quiz_results
      WHERE completed_at > ?
      ORDER BY completed_at ASC
    `).all(sinceDate);

    console.log(`Quiz completions API: Found ${completions.length} completions since ${sinceDate}`);

    // Archetype display names for messages
    const archetypeNames: Record<string, string> = {
      'soft_cuddly': '🧸 Soft & Cuddly Cat',
      'chaos_goblin': '😈 Chaos Goblin Cat',
      'royal_fancy': '👑 Royal & Fancy Cat',
      'cool_alley': '😎 Cool Alley Cat',
      'wise_old': '🧙 Wise Old Cat',
      'adventurous_hunter': '🦁 Adventurous Hunter Cat'
    };

    return NextResponse.json({
      success: true,
      count: completions.length,
      completions: completions.map((c: any) => {
        const archetypeName = archetypeNames[c.archetype_key] || c.archetype_key;
        const completedUnix = Math.floor(new Date(c.completed_at).getTime() / 1000);
        
        // Parse score_breakdown to get total_score
        let totalScore = 0;
        try {
          const breakdown = typeof c.score_breakdown === 'string' 
            ? JSON.parse(c.score_breakdown) 
            : c.score_breakdown;
          totalScore = breakdown?.totalScore || 0;
        } catch (e) {
          totalScore = 0;
        }
        
        return {
          discord_user_id: c.discord_user_id,
          username: c.discord_username,
          archetype_key: c.archetype_key,
          archetype_name: archetypeName,
          completed_at: c.completed_at,
          completed_at_unix: completedUnix,
          total_score: totalScore,
          message: {
            title: '🎉 Quiz Completed!',
            description: `Thank you for completing the Cat Lounge Personality Quiz!\n\nYou are: **${archetypeName}**\nScore: ${totalScore}/100\n\n⚡ You've been granted a **1.5x XP boost** for this weekend!`,
            footer: `Quiz completed on`,
            timestamp: completedUnix
          }
        };
      })
    });

  } catch (error) {
    console.error('Error fetching quiz completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz completions' },
      { status: 500 }
    );
  }
}
