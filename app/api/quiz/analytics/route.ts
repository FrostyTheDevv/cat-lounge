import { NextRequest, NextResponse } from 'next/server';
import { 
  getQuizResultByDiscordId, 
  getAnswerPatternsByUser,
  getQuestionBreakdown,
  getAnswerDistribution,
  getCommunityAverageScores
} from '@/lib/database';
import { QUIZ_QUESTIONS, CAT_ARCHETYPES } from '@/lib/quizConfig';

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

    // Get user's answer patterns
    const userAnswers: any[] = getAnswerPatternsByUser(session.discordUserId);
    
    // Parse score breakdown
    const scoreBreakdown = JSON.parse(result.score_breakdown);
    
    // Get community averages for comparison
    const communityAverages = getCommunityAverageScores();
    
    // Calculate detailed analytics
    const analytics = {
      // User's archetype
      archetype: CAT_ARCHETYPES.find(a => a.key === result.archetype_key),
      
      // Score breakdown with percentages
      scores: Object.entries(scoreBreakdown).map(([key, score]) => {
        const archetype = CAT_ARCHETYPES.find(a => a.key === key);
        const maxScore = Math.max(...Object.values(scoreBreakdown) as number[]);
        const communityAvg = communityAverages[key];
        return {
          key,
          name: archetype?.name || key,
          score: score as number,
          percentage: maxScore > 0 ? ((score as number) / maxScore) * 100 : 0,
          isWinner: key === result.archetype_key,
          communityAverage: communityAvg?.averageScore || 0,
          communityPercentage: communityAvg?.averagePercentage || 0,
        };
      }).sort((a, b) => b.score - a.score),
      
      // Question-by-question breakdown
      questionBreakdown: await Promise.all(
        QUIZ_QUESTIONS.map(async (question, index) => {
          const userAnswer = userAnswers.find((a: any) => a.question_id === question.id) as any;
          const distribution = getQuestionBreakdown(question.id);
          
          return {
            questionId: question.id,
            questionText: question.text,
            userAnswerIndex: userAnswer?.answer_index ?? null,
            userAnswerLabel: userAnswer && userAnswer.answer_index !== undefined ? question.options[userAnswer.answer_index]?.label : null,
            answerDistribution: distribution.map((d: any) => ({
              answerIndex: d.answerIndex,
              label: question.options[d.answerIndex]?.label,
              count: d.count,
              percentage: d.percentage,
              isUserChoice: userAnswer?.answer_index === d.answerIndex,
            })),
            impactOnResult: userAnswer?.archetype_weights ? JSON.parse(userAnswer.archetype_weights) : {},
          };
        })
      ),
      
      // Overall statistics
      completedAt: result.completed_at,
      totalQuestions: QUIZ_QUESTIONS.length,
    };

    return NextResponse.json({ analytics }, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
