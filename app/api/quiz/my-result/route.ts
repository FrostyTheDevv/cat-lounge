import { NextRequest, NextResponse } from 'next/server';
import { getQuizResultByDiscordId } from '../../../../lib/database';
import { CAT_ARCHETYPES } from '../../../../lib/quizConfig';

export async function GET(request: NextRequest) {
  try {
    // Get quiz session
    const sessionCookie = request.cookies.get('quiz_session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Fetch user's quiz result
    const result = getQuizResultByDiscordId(session.discordUserId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'No result found' },
        { status: 404 }
      );
    }

    // Parse stored data
    const scoreBreakdown = JSON.parse(result.score_breakdown);
    
    // Get full archetype data
    const archetype = CAT_ARCHETYPES.find((a: any) => a.key === result.archetype_key);
    
    return NextResponse.json({
      result: {
        archetype: archetype || {
          key: result.archetype_key,
          name: result.archetype_name,
          description: '',
          traits: [],
          emoji: '🐱',
        },
        scores: scoreBreakdown,
        completedAt: result.completed_at,
      },
    });
  } catch (error) {
    console.error('Fetch result error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
}
