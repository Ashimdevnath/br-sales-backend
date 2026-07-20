import { Request, Response } from 'express';
import * as ReportService from '../services/report.service';

// ─── GET /api/reports/summary ─────────────────────────────────────────────────
export async function getSummary(_req: Request, res: Response): Promise<void> {
  try {
    const summary = await ReportService.getReportSummary();
    res.json(summary);
  } catch (err) {
    console.error('[ReportController] getSummary error:', err);
    res.status(500).json({ error: 'Failed to fetch report summary' });
  }
}

// ─── GET /api/reports/daily ───────────────────────────────────────────────────
export async function getDailyReport(req: Request, res: Response): Promise<void> {
  try {
    const days = Math.min(90, Math.max(7, parseInt((req.query.days as string) || '30')));
    const data = await ReportService.getDailyReport(days);
    res.json(data);
  } catch (err) {
    console.error('[ReportController] getDailyReport error:', err);
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
}

// ─── GET /api/reports/by-payment ─────────────────────────────────────────────
export async function getPaymentBreakdown(_req: Request, res: Response): Promise<void> {
  try {
    const data = await ReportService.getPaymentBreakdown();
    res.json(data);
  } catch (err) {
    console.error('[ReportController] getPaymentBreakdown error:', err);
    res.status(500).json({ error: 'Failed to fetch payment breakdown' });
  }
}

// ─── POST /api/reports/send-daily ────────────────────────────────────────────
export async function sendDailyReport(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body as ReportService.DailyReportPayload;
    if (!payload.recipientPhone || !payload.dateKey) {
      res.status(400).json({ error: 'recipientPhone and dateKey are required' });
      return;
    }
    const result = await ReportService.sendDailyReport(payload);
    if (result.success) {
      res.json({ success: true, message: 'Daily report sent via WhatsApp' });
    } else {
      res.status(502).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('[ReportController] sendDailyReport error:', err);
    res.status(500).json({ error: 'Failed to send daily report' });
  }
}
