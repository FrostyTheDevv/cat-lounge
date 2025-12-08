import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, generateSessionId } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  // Get or create session ID from cookie
  let sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  const csrfToken = generateCSRFToken(sessionId);
  
  const response = NextResponse.json({ csrfToken });
  
  // Set session ID cookie
  response.cookies.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
    path: '/'
  });
  
  return response;
}
