import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

// ─── No auth required on auth routes ─────────────────────────────────────────

/** Check whether the one-time setup has been completed */
router.get('/status', AuthController.getStatus);

/** One-time session setup — generates and stores a hashed token */
router.post('/setup', AuthController.setup);

/** Verify a raw token without performing any action */
router.post('/verify', AuthController.verify);

/** Rotate the session token (old token required in Authorization header) */
router.post('/reset', AuthController.reset);

export default router;
