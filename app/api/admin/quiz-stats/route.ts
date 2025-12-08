import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllQuizResults, 
  getQuizStatistics,
  getCompletionTrends,
  getQuestionDifficulty,
  getArchetypeTrends,
  getMostPopularAnswers
} from '@/lib/database';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    requireAdmin(request);

    const stats = getQuizStatistics();
    const recentResults = getAllQuizResults(50); // Get last 50 results
    
    // Advanced analytics
    const completionTrends = getCompletionTrends(30); // Last 30 days
    const questionDifficulty = getQuestionDifficulty();
    const archetypeTrends = getArchetypeTrends(30); // Last 30 days
    const popularAnswers = getMostPopularAnswers(10);

    return NextResponse.json({
      stats,
      recentResults,
      analytics: {
        completionTrends,
        questionDifficulty,
        archetypeTrends,
        popularAnswers
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Quiz stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz statistics' },
      { status: 500 }
    );
  }
}
