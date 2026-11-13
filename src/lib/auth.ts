import crypto from 'node:crypto';
import { SessionUser } from './types';

export const SESSION_COOKIE_NAME = 'melatea_session';
const SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET || 'melatea-partner-center-hmac-secret-key-2026';

interface TokenPayload {
  user: SessionUser;
  exp: number;
}

/**
 * Create a signed HMAC-SHA256 session token for the authenticated user
 */
export function createSessionToken(user: SessionUser, ttlSeconds = 60 * 60 * 24 * 7): string {
  const payload: TokenPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 session token
 */
export function verifySessionToken(token?: string | null): SessionUser | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as TokenPayload;

    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (!decoded.user || !decoded.user.id || !decoded.user.role) {
      return null;
    }

    return decoded.user;
  } catch {
    return null;
  }
}

