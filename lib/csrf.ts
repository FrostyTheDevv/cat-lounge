import { randomBytes } from 'crypto';

if (!process.env.CSRF_SECRET) {
  throw new Error('CSRF_SECRET environment variable is required');
}

const CSRF_SECRET = process.env.CSRF_SECRET;

// Store CSRF tokens in memory (in production, use Redis or database)
const tokenStore = new Map<string, { token: string; expires: number }>();

export const generateCSRFToken = (sessionId: string): string => {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  
  tokenStore.set(sessionId, { token, expires });
  
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  return token;
};

export const validateCSRFToken = (sessionId: string, token: string): boolean => {
  const stored = tokenStore.get(sessionId);
  
  if (!stored) return false;
  if (stored.expires < Date.now()) {
    tokenStore.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
};

export const deleteCSRFToken = (sessionId: string): void => {
  tokenStore.delete(sessionId);
};

const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [sessionId, data] of tokenStore.entries()) {
    if (data.expires < now) {
      tokenStore.delete(sessionId);
    }
  }
};

// Generate a session ID for CSRF
export const generateSessionId = (): string => {
  return randomBytes(32).toString('hex');
};
