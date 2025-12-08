import { NextRequest } from 'next/server';
import { 
  getAdminSessionByToken, 
  updateAdminSessionActivity, 
  deleteAdminSession,
  deleteExpiredAdminSessions,
  AdminSession 
} from './database';
import { refreshUserPermissions, hasPermission, PermissionLevel } from './adminPermissions';

export interface AdminAuthContext {
  session: AdminSession;
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

/**
 * Validates admin session from cookie and returns session data
 */
export async function getAdminAuth(request: NextRequest): Promise<AdminAuthContext | null> {
  const sessionToken = request.cookies.get('admin_session')?.value;

  if (!sessionToken) {
    return null;
  }

  // Clean up expired sessions periodically
  deleteExpiredAdminSessions();

  // Get session from database
  const session = getAdminSessionByToken(sessionToken);

  if (!session) {
    return null;
  }

  // Check if session is expired
  const expiresAt = new Date(session.expires_at);
  if (expiresAt < new Date()) {
    deleteAdminSession(sessionToken);
    return null;
  }

  // Refresh permissions from Discord (ensure user still has access)
  try {
    const currentPermissionLevel = await refreshUserPermissions(session.discord_id);
    
    if (!currentPermissionLevel) {
      // User is no longer in the guild
      deleteAdminSession(sessionToken);
      return null;
    }

    // If permission level changed, we should update it
    // For now, just use the stored level but log if it changed
    if (currentPermissionLevel !== session.permission_level) {
      console.log(`Permission level changed for ${session.discord_username}: ${session.permission_level} -> ${currentPermissionLevel}`);
      // In a production system, you'd update the session here
    }
  } catch (error) {
    console.error('Failed to refresh permissions:', error);
    // Continue with stored permissions if refresh fails
  }

  // Update last activity
  updateAdminSessionActivity(sessionToken);

  return {
    session,
    isOwner: session.permission_level === 'OWNER',
    isAdmin: session.permission_level === 'ADMIN' || session.permission_level === 'OWNER',
    isModerator: ['MODERATOR', 'ADMIN', 'OWNER'].includes(session.permission_level),
  };
}

/**
 * Checks if user is authenticated as admin
 */
export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const auth = await getAdminAuth(request);
  return auth !== null;
}

/**
 * Requires admin authentication, throws if not authenticated
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthContext> {
  const auth = await getAdminAuth(request);
  
  if (!auth) {
    throw new Error('Unauthorized: Admin authentication required');
  }

  return auth;
}

/**
 * Requires specific permission level
 */
export async function requirePermission(
  request: NextRequest,
  requiredLevel: PermissionLevel
): Promise<AdminAuthContext> {
  const auth = await requireAdmin(request);

  if (!hasPermission(auth.session.permission_level, requiredLevel)) {
    throw new Error(`Unauthorized: ${requiredLevel} permission required`);
  }

  return auth;
}

/**
 * Requires owner permission
 */
export async function requireOwner(request: NextRequest): Promise<AdminAuthContext> {
  return requirePermission(request, 'OWNER');
}
