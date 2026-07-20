import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ReportController from '../controllers/report.controller';

const router = Router();

// ─── All report routes are protected ─────────────────────────────────────────
router.use(requireAuth);

/** Overall summary: today revenue, total records, pending WhatsApp, avg order */
router.get('/summary', ReportController.getSummary);

/** Daily revenue grouped by date (supports: days query param, default 30, max 90) */
router.get('/daily', ReportController.getDailyReport);

/** Revenue grouped by payment method */
router.get('/by-payment', ReportController.getPaymentBreakdown);

/** Send a daily report via WhatsApp to a recipient */
router.post('/send-daily', ReportController.sendDailyReport);

export default router;
