import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';

// ─── GET /api/auth/status ─────────────────────────────────────────────────────
export async function getStatus(_req: Request, res: Response): Promise<void> {
  try {
    const setupDone = await AuthService.hasActiveSession();
    res.json({ setupDone });
  } catch (err) {
    console.error('[AuthController] getStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── POST /api/auth/setup ─────────────────────────────────────────────────────
export async function setup(req: Request, res: Response): Promise<void> {
  try {
    const alreadyDone = await AuthService.hasActiveSession();
    if (alreadyDone) {
      res.status(409).json({
        error: 'A session already exists. Use /api/auth/reset to rotate the token.',
        setupDone: true,
      });
      return;
    }

    const label = (req.body?.label as string) || 'default';
    const result = await AuthService.createSession(label);
    res.status(201).json(result);
  } catch (err) {
    console.error('[AuthController] setup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── POST /api/auth/verify ────────────────────────────────────────────────────
export async function verify(req: Request, res: Response): Promise<void> {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    const result = await AuthService.verifyRawToken(token);
    if (result.valid) {
      res.json({ valid: true, label: result.label });
    } else {
      res.status(401).json({ valid: false, error: result.error });
    }
  } catch (err) {
    console.error('[AuthController] verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── POST /api/auth/reset ─────────────────────────────────────────────────────
export async function reset(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers['authorization'];
  const oldToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!oldToken) {
    res.status(401).json({ error: 'Old token required in Authorization header' });
    return;
  }

  try {
    const label = (req.body?.label as string) || 'default';
    const result = await AuthService.resetSession(oldToken, label);

    if (!result) {
      res.status(401).json({ error: 'Old token is invalid' });
      return;
    }

    res.json({ ...result, message: 'Token reset successfully. Store the new token securely.' });
  } catch (err) {
    console.error('[AuthController] reset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
