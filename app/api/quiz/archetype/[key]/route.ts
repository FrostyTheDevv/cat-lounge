import { NextRequest, NextResponse } from 'next/server';
import { getUsersByArchetype, getQuizResultByDiscordId, getAnswerPatternsByUser } from '@/lib/database';
import { CAT_ARCHETYPES } from '@/lib/quizConfig';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const params = await context.params;
    const archetypeKey = params.key;
    
    // Validate archetype key
    const archetype = CAT_ARCHETYPES.find(a => a.key === archetypeKey);
    
    if (!archetype) {
      return NextResponse.json(
        { error: 'Invalid archetype key' },
        { status: 400 }
      );
    }

    // Get all users with this archetype
    const users = getUsersByArchetype(archetypeKey);

    // Enhance user data with detailed scoring
    const enhancedUsers = users.map((user: any) => {
      const result = getQuizResultByDiscordId(user.discord_user_id);
      const scoreBreakdown = result ? JSON.parse(result.score_breakdown) : {};
      const answers = getAnswerPatternsByUser(user.discord_user_id);
      
      // Calculate score details
      const archetypeScore = scoreBreakdown[archetypeKey] || 0;
      const totalPossibleScore = Object.values(scoreBreakdown).reduce((sum: number, score) => sum + (score as number), 0);
      const scorePercentage = totalPossibleScore > 0 ? (archetypeScore / totalPossibleScore) * 100 : 0;
      
      // Get runner-up archetype
      const sortedScores = Object.entries(scoreBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .filter(([key]) => key !== archetypeKey);
      
      const runnerUp = sortedScores.length > 0 ? {
        key: sortedScores[0][0],
        name: CAT_ARCHETYPES.find(a => a.key === sortedScores[0][0])?.name,
        score: sortedScores[0][1],
      } : null;
      
      return {
        discordUserId: user.discord_user_id,
        username: user.discord_username,
        avatar: user.discord_avatar,
        completedAt: user.completed_at,
        scoring: {
          archetypeScore,
          totalScore: totalPossibleScore,
          scorePercentage: scorePercentage.toFixed(1),
          allScores: scoreBreakdown,
          runnerUp,
        },
        answeredQuestions: answers.length,
      };
    });

    // Sort by archetype score (highest first)
    enhancedUsers.sort((a, b) => b.scoring.archetypeScore - a.scoring.archetypeScore);

    // Add ranking
    const rankedUsers = enhancedUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    // Calculate archetype statistics
    const scores = enhancedUsers.map(u => u.scoring.archetypeScore);
    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    const maxScore = Math.max(...scores, 0);
    const minScore = Math.min(...scores, Infinity);

    return NextResponse.json({
      archetype: {
        key: archetype.key,
        name: archetype.name,
        description: archetype.description,
        traits: archetype.traits,
        emoji: archetype.emoji,
        icon: archetype.icon,
      },
      users: rankedUsers,
      totalCount: users.length,
      statistics: {
        averageScore: avgScore.toFixed(1),
        highestScore: maxScore,
        lowestScore: minScore === Infinity ? 0 : minScore,
        scoreRange: maxScore - (minScore === Infinity ? 0 : minScore),
      },
    });
  } catch (error) {
    console.error('Archetype users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archetype users' },
      { status: 500 }
    );
  }
}
