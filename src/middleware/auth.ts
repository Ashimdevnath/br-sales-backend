import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { verifyToken } from '../lib/session';

/**
 * Session-based auth middleware.
 * Expects: Authorization: Bearer <raw_token>
 *
 * Validates the raw token against the stored bcrypt hash in the AppSession table.
 * Updates lastUsedAt on successful validation.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) {
    res.status(401).json({ error: 'Empty token' });
    return;
  }

  try {
    // Fetch all active sessions (should normally be just 1)
    const sessions = await prisma.appSession.findMany({
      where: { isActive: true },
    });

    if (sessions.length === 0) {
      res.status(401).json({
        error: 'No active session found. Please complete the setup at /api/auth/setup',
      });
      return;
    }

    // Verify against each stored hash
    let matched: typeof sessions[0] | null = null;
    for (const session of sessions) {
      const ok = await verifyToken(rawToken, session.tokenHash);
      if (ok) {
        matched = session;
        break;
      }
    }

    if (!matched) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Update lastUsedAt (fire and forget)
    prisma.appSession
      .update({ where: { id: matched.id }, data: { lastUsedAt: new Date() } })
      .catch(console.error);

    next();
  } catch (err) {
    console.error('[Auth] Error during token verification:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}
