import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Generate a cryptographically secure random token
 * Returns a 48-character hex string
 */
export function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Hash a raw token for secure storage
 */
export async function hashToken(rawToken: string): Promise<string> {
  return bcrypt.hash(rawToken, SALT_ROUNDS);
}

/**
 * Compare a raw token against a stored hash
 */
export async function verifyToken(rawToken: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rawToken, hash);
}
