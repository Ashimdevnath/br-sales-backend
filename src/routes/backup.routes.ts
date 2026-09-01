import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as BackupController from '../controllers/backup.controller';

const router = Router();

// Protect the route so only authenticated users can download the backup
router.use(requireAuth);

/** Download full database backup as a SQL file */
router.get('/', BackupController.downloadDatabase);

export default router;
