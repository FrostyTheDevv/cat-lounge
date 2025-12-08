import { NextRequest, NextResponse } from 'next/server';
import { findSimilarUsers, getQuizResultByDiscordId, getAnswerPatternsByUser } from '@/lib/database';
import { CAT_ARCHETYPES } from '@/lib/quizConfig';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('quiz_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Get user's quiz result
    const result = getQuizResultByDiscordId(session.discordUserId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'No quiz result found' },
        { status: 404 }
      );
    }

    // Get URL params for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Get user's answers
    const userAnswers = getAnswerPatternsByUser(session.discordUserId);

    // Find similar users (get more for pagination)
    const allSimilarUsers = findSimilarUsers(session.discordUserId, 100);
    const similarUsers = allSimilarUsers.slice(offset, offset + limit);

    // Enhance similar users with detailed comparison
    const enhancedUsers = similarUsers.map(user => {
      const theirResult = getQuizResultByDiscordId(user.discord_user_id);
      const theirAnswers = getAnswerPatternsByUser(user.discord_user_id);
      const theirScores = theirResult ? JSON.parse(theirResult.score_breakdown) : {};
      
      // Find matching and differing questions
      const matchingQuestions: number[] = [];
      const differingQuestions: number[] = [];
      
      userAnswers.forEach((userAnswer: any) => {
        const theirAnswer = theirAnswers.find((a: any) => a.question_id === userAnswer.question_id);
        if (theirAnswer) {
          if (userAnswer.answer_index === theirAnswer.answer_index) {
            matchingQuestions.push(userAnswer.question_id);
          } else {
            differingQuestions.push(userAnswer.question_id);
          }
        }
      });

      return {
        discordUserId: user.discord_user_id,
        username: user.discord_username,
        avatar: user.discord_avatar,
        archetype: {
          key: user.archetype_key,
          name: CAT_ARCHETYPES.find(a => a.key === user.archetype_key)?.name,
        },
        similarity: user.similarity,
        matchingAnswers: matchingQuestions.length,
        totalQuestions: userAnswers.length,
        matchingQuestionIds: matchingQuestions,
        differingQuestionIds: differingQuestions,
        scoreComparison: {
          theirScores,
          scoreDifferences: Object.keys(theirScores).reduce((acc: any, key) => {
            const userScore = JSON.parse(result.score_breakdown)[key] || 0;
            const theirScore = theirScores[key] || 0;
            acc[key] = {
              user: userScore,
              them: theirScore,
              difference: Math.abs(userScore - theirScore),
            };
            return acc;
          }, {}),
        },
      };
    });

    return NextResponse.json({
      userArchetype: result.archetype_key,
      userScores: JSON.parse(result.score_breakdown),
      similarUsers: enhancedUsers,
      perfectMatches: enhancedUsers.filter(u => u.similarity === 100),
      sameArchetype: enhancedUsers.filter(u => u.archetype.key === result.archetype_key),
      pagination: {
        page,
        limit,
        total: allSimilarUsers.length,
        totalPages: Math.ceil(allSimilarUsers.length / limit),
        hasMore: offset + limit < allSimilarUsers.length,
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=180, stale-while-revalidate=360',
      },
    });
  } catch (error) {
    console.error('Similar users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar users' },
      { status: 500 }
    );
  }
}
