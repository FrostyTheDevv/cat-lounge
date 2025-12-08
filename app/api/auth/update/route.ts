import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';
import { validateCSRFToken } from '@/lib/csrf';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { writeFile } from 'fs/promises';

const db = new Database('catlounge.db');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const currentUsername = formData.get('currentUsername') as string;
    const newUsername = formData.get('newUsername') as string;
    const currentPassword = formData.get('currentPassword') as string | null;
    const newPassword = formData.get('newPassword') as string | null;
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

    // Verify JWT token
    const accessToken = request.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify the user is updating their own profile
    if (tokenPayload.username !== currentUsername) {
      return NextResponse.json(
        { error: 'Unauthorized to update this profile' },
        { status: 403 }
      );
    }

    if (!currentUsername || !newUsername) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get current user
    const user = getUserByUsername(currentUsername);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      const isValidPassword = verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        return NextResponse.json(
          { error: 'Password must contain uppercase, lowercase, and numbers' },
          { status: 400 }
        );
      }
    }

    let pfpPath = user.pfp;

    // Handle profile picture upload
    if (pfpFile) {
      const bytes = await pfpFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `${Date.now()}-${pfpFile.name}`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
      
      await writeFile(filepath, buffer);
      pfpPath = `/uploads/${filename}`;
    }

    // Update user in database
    try {
      if (newPassword) {
        const hashedPassword = bcrypt.hashSync(newPassword, 12);
        db.prepare(
          'UPDATE users SET username = ?, password = ?, pfp = ? WHERE username = ?'
        ).run(newUsername, hashedPassword, pfpPath, currentUsername);
      } else {
        db.prepare(
          'UPDATE users SET username = ?, pfp = ? WHERE username = ?'
        ).run(newUsername, pfpPath, currentUsername);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Profile updated successfully',
          user: {
            username: newUsername,
            pfp: pfpPath
          }
        },
        { status: 200 }
      );
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
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
