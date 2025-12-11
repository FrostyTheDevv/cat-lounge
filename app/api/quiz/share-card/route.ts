import { NextRequest, NextResponse } from 'next/server';
import { getQuizResult } from '@/lib/database-async';
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
    const result = await getQuizResult(session.discordUserId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'No quiz result found' },
        { status: 404 }
      );
    }

    const archetype = CAT_ARCHETYPES.find(a => a.key === result.archetype_key);
    
    if (!archetype) {
      return NextResponse.json(
        { error: 'Invalid archetype' },
        { status: 404 }
      );
    }

    // Parse score breakdown
    const scoreBreakdown = JSON.parse(result.score_breakdown);
    const maxScore = Math.max(...Object.values(scoreBreakdown) as number[]);
    const userScore = scoreBreakdown[result.archetype_key];
    const percentage = maxScore > 0 ? ((userScore / maxScore) * 100).toFixed(1) : 0;

    // Generate SVG card
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#9b59b6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8e44ad;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Border -->
        <rect x="20" y="20" width="1160" height="590" fill="none" stroke="url(#accent)" stroke-width="4" rx="20"/>
        
        <!-- Title -->
        <text x="600" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">
          My Cat Personality
        </text>
        
        <!-- Archetype Name -->
        <text x="600" y="250" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#a78bfa" text-anchor="middle">
          ${archetype.name}
        </text>
        
        <!-- Emoji -->
        <text x="600" y="350" font-size="120" text-anchor="middle">
          ${archetype.emoji}
        </text>
        
        <!-- Score -->
        <text x="600" y="450" font-family="Arial, sans-serif" font-size="36" fill="#c4b5fd" text-anchor="middle">
          ${percentage}% Match • ${userScore} Points
        </text>
        
        <!-- Traits -->
        <text x="600" y="520" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)" text-anchor="middle">
          ${archetype.traits.slice(0, 3).join(' • ')}
        </text>
        
        <!-- Footer -->
        <text x="600" y="590" font-family="Arial, sans-serif" font-size="24" fill="rgba(167,139,250,0.8)" text-anchor="middle">
          🐱 Take the quiz at Cat Lounge!
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Share card generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate share card' },
      { status: 500 }
    );
  }
}
