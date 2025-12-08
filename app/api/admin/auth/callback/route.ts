import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

/**
 * GET /api/admin/auth/callback
 * Handles Discord OAuth callback redirect
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Get base URL automatically from request
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  if (error) {
    // Redirect to login with error
    return NextResponse.redirect(
      `${baseUrl}/admin/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/admin/login?error=no_code`
    );
  }

  // Exchange code for session by calling our auth endpoint
  try {
    const authResponse = await fetch(`${baseUrl}/api/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return NextResponse.redirect(
        `${baseUrl}/admin/login?error=${encodeURIComponent(errorData.error || 'auth_failed')}`
      );
    }

    const data = await authResponse.json();
    const sessionCookie = authResponse.headers.get('set-cookie');

    // Create redirect response
    const response = NextResponse.redirect(
      `${baseUrl}/admin/dashboard`
    );

    // Forward the session cookie
    if (sessionCookie) {
      response.headers.set('set-cookie', sessionCookie);
    }

    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      `${baseUrl}/admin/login?error=internal_error`
    );
  }
}
