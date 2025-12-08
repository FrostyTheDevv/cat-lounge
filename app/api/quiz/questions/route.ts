import { NextRequest, NextResponse } from 'next/server';
import { QUIZ_QUESTIONS } from '@/lib/quizConfig';

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

    if (!session.inGuild) {
      return NextResponse.json(
        { error: 'Not in guild' },
        { status: 403 }
      );
    }

    // Strip weights from questions before sending to frontend
    const questionsWithoutWeights = QUIZ_QUESTIONS.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options.map(o => ({
        label: o.label,
      })),
    }));

    return NextResponse.json({
      questions: questionsWithoutWeights,
    });
  } catch (error) {
    console.error('Quiz questions error:', error);
    return NextResponse.json(
      { error: 'Failed to get questions' },
      { status: 500 }
    );
  }
}
