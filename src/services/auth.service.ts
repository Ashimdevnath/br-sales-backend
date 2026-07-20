import prisma from '../lib/prisma';
import { generateToken, hashToken, verifyToken } from '../lib/session';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SetupResult {
  token: string;
  label: string;
  message: string;
}

export interface VerifyResult {
  valid: boolean;
  label?: string;
  error?: string;
}

// ─── Check if any active session exists ──────────────────────────────────────
export async function hasActiveSession(): Promise<boolean> {
  const count = await prisma.appSession.count({ where: { isActive: true } });
  return count > 0;
}

// ─── Create the first (one-time) session ──────────────────────────────────────
export async function createSession(label: string): Promise<SetupResult> {
  const rawToken = generateToken();
  const tokenHash = await hashToken(rawToken);

  await prisma.appSession.create({
    data: { tokenHash, label },
  });

  return {
    token: rawToken,
    label,
    message:
      'Session created successfully. Store this token securely — it cannot be shown again.',
  };
}

// ─── Verify a raw token against all active sessions ──────────────────────────
export async function verifyRawToken(rawToken: string): Promise<VerifyResult> {
  const sessions = await prisma.appSession.findMany({ where: { isActive: true } });

  for (const session of sessions) {
    const ok = await verifyToken(rawToken, session.tokenHash);
    if (ok) {
      // Update lastUsedAt (fire and forget)
      prisma.appSession
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
        .catch(console.error);

      return { valid: true, label: session.label };
    }
  }

  return { valid: false, error: 'Invalid token' };
}

// ─── Reset: deactivate all sessions, create a new one ────────────────────────
export async function resetSession(oldRawToken: string, label: string): Promise<SetupResult | null> {
  // Verify old token first
  const { valid } = await verifyRawToken(oldRawToken);
  if (!valid) return null;

  // Deactivate all
  await prisma.appSession.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  return createSession(label);
}
