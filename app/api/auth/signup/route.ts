import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/database-async';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { validateCSRFToken } from '@/lib/csrf';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const pfpFile = formData.get('pfp') as File | null;
    const csrfToken = formData.get('csrfToken') as string;

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
    
    // Username validation
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      );
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      );
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    if (!/(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character (@$!%*?&)' },
        { status: 400 }
      );
    }

    // Handle profile picture upload to Vercel Blob Storage
    let pfpPath: string | null = null;
    
    if (pfpFile && pfpFile.size > 0) {
      try {
        // Validate file type
        if (!pfpFile.type.startsWith('image/')) {
          return NextResponse.json(
            { error: 'Profile picture must be an image file' },
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        if (pfpFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Profile picture must be less than 5MB' },
            { status: 400 }
          );
        }

        // Upload to Vercel Blob
        const filename = `profile-${Date.now()}-${sanitizedUsername}.${pfpFile.type.split('/')[1]}`;
        const blob = await put(filename, pfpFile, {
          access: 'public',
          addRandomSuffix: true,
        });
        
        pfpPath = blob.url;
      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
        // Continue with signup even if upload fails, use default image
        pfpPath = null;
      }
    }

    try {
      const userId = await createUser(sanitizedUsername, password, pfpPath || undefined);
      
      // Generate JWT tokens
      const tokenPayload = {
        userId: userId,
        username: sanitizedUsername,
        pfp: pfpPath
      };
      
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const response = NextResponse.json(
        { 
          success: true, 
          message: 'User created successfully',
          user: {
            id: userId,
            username: sanitizedUsername,
            pfp: pfpPath || '/noprofile.png'
          },
          accessToken
        },
        { status: 201 }
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
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
