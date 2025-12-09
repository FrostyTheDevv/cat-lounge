import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserByUsername, 
  verifyPassword, 
  recordLoginAttempt, 
  getRecentFailedAttempts, 
  isAccountLocked,
  lockAccount,
  resetFailedAttempts
} from '@/lib/database-async';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { validateCSRFToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const csrfToken = formData.get('csrfToken') as string;

    // Get IP address for rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Get session ID for CSRF validation
    const sessionId = request.cookies.get('session_id')?.value;

    // CSRF validation
    if (!sessionId || !csrfToken || !validateCSRFToken(sessionId, csrfToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Sanitize username (prevent XSS)
    const sanitizedUsername = username.trim().replace(/[<>]/g, '');

    // Check rate limiting (max 5 failed attempts per IP in 15 minutes)
    const recentFailedAttempts = await getRecentFailedAttempts(ipAddress);
    if (recentFailedAttempts >= 5) {
      await recordLoginAttempt(ipAddress, sanitizedUsername, false);
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await getUserByUsername(sanitizedUsername);

    if (!user) {
      await recordLoginAttempt(ipAddress, sanitizedUsername, false);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (await isAccountLocked(sanitizedUsername)) {
      await recordLoginAttempt(ipAddress, sanitizedUsername, false);
      return NextResponse.json(
        { error: 'Account is temporarily locked due to multiple failed login attempts' },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      await recordLoginAttempt(ipAddress, sanitizedUsername, false);
      
      // Lock account after 5 failed attempts
      const userFailedAttempts = await getRecentFailedAttempts(ipAddress, 60);
      if (userFailedAttempts >= 4) {
        await lockAccount(sanitizedUsername, 30);
        return NextResponse.json(
          { error: 'Too many failed login attempts. Account locked for 30 minutes.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Successful login
    await recordLoginAttempt(ipAddress, sanitizedUsername, true);
    await resetFailedAttempts(sanitizedUsername);

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      pfp: user.pfp
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          pfp: user.pfp,
        },
        accessToken
      },
      { status: 200 }
    );

    // Set JWT tokens as httpOnly cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900, // 15 minutes
      path: '/'
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
