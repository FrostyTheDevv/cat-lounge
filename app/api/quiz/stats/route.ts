import { NextRequest, NextResponse } from 'next/server';
import { getQuizStatistics, getQuizResultByDiscordId, getUsersByArchetype } from '@/lib/database';
import { CAT_ARCHETYPES, QUIZ_QUESTIONS } from '@/lib/quizConfig';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('quiz_session');
    let userArchetype: string | null = null;
    let userScores: Record<string, number> | null = null;
    let userRankInArchetype: number | null = null;
    
    // If user is authenticated, get their archetype
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.value);
        const result = getQuizResultByDiscordId(session.discordUserId);
        if (result) {
          userArchetype = result.archetype_key;
          userScores = JSON.parse(result.score_breakdown);
          
          // Calculate user's rank within their archetype
          if (userArchetype && userScores) {
            const archetypeUsers = getUsersByArchetype(userArchetype);
            const userScore = userScores[userArchetype];
            const usersWithHigherScore = archetypeUsers.filter((u: any) => {
              const theirResult = getQuizResultByDiscordId(u.discord_user_id);
              if (!theirResult) return false;
              const theirScores = JSON.parse(theirResult.score_breakdown);
              return theirScores[userArchetype!] > userScore;
            });
            userRankInArchetype = usersWithHigherScore.length + 1;
          }
        }
      } catch (err) {
        // Ignore errors, just don't show user-specific stats
      }
    }

    // Get overall statistics
    const stats = getQuizStatistics();
    
    // Calculate percentages and add archetype details with member counts
    const archetypeStats = CAT_ARCHETYPES.map(archetype => {
      const count = stats.archetypeCounts[archetype.key] || 0;
      const percentage = stats.archetypePercentages[archetype.key] || 0;
      
      // Get top scorer for this archetype
      const archetypeUsers = getUsersByArchetype(archetype.key, 1);
      let topScorer = null;
      if (archetypeUsers.length > 0) {
        const topUser = archetypeUsers[0] as any;
        const topResult = getQuizResultByDiscordId(topUser.discord_user_id);
        if (topResult) {
          const topScores = JSON.parse(topResult.score_breakdown);
          topScorer = {
            username: topUser.discord_username,
            avatar: topUser.discord_avatar,
            score: topScores[archetype.key],
          };
        }
      }
      
      return {
        key: archetype.key,
        name: archetype.name,
        description: archetype.description,
        emoji: archetype.emoji,
        icon: archetype.icon,
        count,
        percentage: percentage.toFixed(1),
        isUserArchetype: archetype.key === userArchetype,
        topScorer,
      };
    }).sort((a, b) => b.count - a.count);

    const totalUsers = stats.uniqueUsers;

    // Calculate rarity tiers
    const avgCount = totalUsers / CAT_ARCHETYPES.length;
    const archetypeWithRarity = archetypeStats.map(stat => ({
      ...stat,
      rarity: stat.count < avgCount * 0.5 ? 'Very Rare' :
              stat.count < avgCount * 0.8 ? 'Rare' :
              stat.count < avgCount * 1.2 ? 'Common' :
              'Very Common',
    }));

    return NextResponse.json({
      totalUsers,
      totalQuizzes: stats.totalResults,
      archetypeStats: archetypeWithRarity,
      userArchetype,
      userScores,
      userRankInArchetype,
      recentCompletions: stats.recentCompletions,
      retakeRate: stats.retakeRate.toFixed(1),
      mostPopularArchetype: archetypeStats[0],
      rarestArchetype: archetypeStats[archetypeStats.length - 1],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
