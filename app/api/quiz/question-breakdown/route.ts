import { NextRequest, NextResponse } from 'next/server';
import { getQuestionBreakdown, getAnswerPatternsByUser, getQuizResultByDiscordId } from '@/lib/database';
import { QUIZ_QUESTIONS, CAT_ARCHETYPES } from '@/lib/quizConfig';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('quiz_session');
    let userAnswers = null;
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.value);
        const result = getQuizResultByDiscordId(session.discordUserId);
        if (result) {
          userAnswers = getAnswerPatternsByUser(session.discordUserId);
        }
      } catch (err) {
        // Ignore
      }
    }

    // Get breakdown for all questions
    const questionBreakdowns = QUIZ_QUESTIONS.map((question, index) => {
      const distribution = getQuestionBreakdown(question.id);
      const totalResponses = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
      
      // Find user's answer if available
      const userAnswer = userAnswers ? 
        userAnswers.find((a: any) => a.question_id === question.id) : null;
      
      // Calculate which archetype this question favors
      const archetypeInfluence: Record<string, number> = {};
      question.options.forEach((option, optIndex) => {
        const dist = distribution.find((d: any) => d.answerIndex === optIndex);
        if (dist && option.weights) {
          Object.entries(option.weights).forEach(([key, weight]) => {
            if (weight !== undefined) {
              archetypeInfluence[key] = (archetypeInfluence[key] || 0) + ((dist.count / totalResponses) * (weight as number));
            }
          });
        }
      });

      // Find dominant archetype for this question
      const dominantArchetype = Object.entries(archetypeInfluence)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

      return {
        questionId: question.id,
        questionNumber: index + 1,
        questionText: question.text,
        totalResponses,
        answerDistribution: distribution.map((d: any) => {
          const option = question.options[d.answerIndex];
          return {
            answerIndex: d.answerIndex,
            label: option?.label || '',
            count: d.count,
            percentage: d.percentage.toFixed(1),
            isUserChoice: userAnswer?.answer_index === d.answerIndex,
            archetypeWeights: option?.weights || {},
          };
        }),
        userAnswer: userAnswer ? {
          answerIndex: userAnswer.answer_index,
          label: question.options[userAnswer.answer_index]?.label,
          weights: JSON.parse(userAnswer.archetype_weights),
        } : null,
        questionInsights: {
          dominantArchetype: dominantArchetype ? {
            key: dominantArchetype[0],
            name: CAT_ARCHETYPES.find(a => a.key === dominantArchetype[0])?.name,
            influence: (dominantArchetype[1] as number).toFixed(2),
          } : null,
          consensusLevel: totalResponses > 0 ? 
            (Math.max(...distribution.map((d: any) => d.percentage)) / 100).toFixed(2) : 0,
          splitDecision: distribution.length > 0 && 
            Math.max(...distribution.map((d: any) => d.percentage)) < 40,
        },
      };
    });

    return NextResponse.json({
      questions: questionBreakdowns,
      totalQuestions: QUIZ_QUESTIONS.length,
      hasUserData: userAnswers !== null,
    });
  } catch (error) {
    console.error('Question breakdown fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question breakdown' },
      { status: 500 }
    );
  }
}
