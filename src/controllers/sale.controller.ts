import { Request, Response } from 'express';
import * as SaleService from '../services/sale.service';

// ─── GET /api/sales ───────────────────────────────────────────────────────────
export async function listSales(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      status,
      paymentMethod,
      whatsappStatus,
      page,
      pageSize,
      dateFrom,
      dateTo,
    } = req.query as Record<string, string>;

    const result = await SaleService.listSales({
      search,
      status,
      paymentMethod,
      whatsappStatus,
      dateFrom,
      dateTo,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    res.json(result);
  } catch (err) {
    console.error('[SaleController] listSales error:', err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
}

// ─── GET /api/sales/:id ───────────────────────────────────────────────────────
export async function getSale(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const sale = await SaleService.getSaleById(id);

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json(sale);
  } catch (err) {
    console.error('[SaleController] getSale error:', err);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
}

// ─── POST /api/sales ──────────────────────────────────────────────────────────
export async function createSale(req: Request, res: Response): Promise<void> {
  try {
    const sale = await SaleService.createSale(req.body);
    res.status(201).json(sale);
  } catch (err) {
    console.error('[SaleController] createSale error:', err);
    res.status(500).json({ error: 'Failed to create sale' });
  }
}

// ─── PUT /api/sales/:id ───────────────────────────────────────────────────────
export async function updateSale(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const sale = await SaleService.updateSale(id, req.body);

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json(sale);
  } catch (err) {
    console.error('[SaleController] updateSale error:', err);
    res.status(500).json({ error: 'Failed to update sale' });
  }
}

// ─── DELETE /api/sales/:id ────────────────────────────────────────────────────
export async function deleteSale(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const deleted = await SaleService.deleteSale(id);

    if (!deleted) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('[SaleController] deleteSale error:', err);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
}

// ─── DELETE /api/sales (bulk) ─────────────────────────────────────────────────
export async function bulkDeleteSales(req: Request, res: Response): Promise<void> {
  try {
    const { ids } = req.body as { ids?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    const deleted = await SaleService.bulkDeleteSales(ids);
    res.json({ success: true, deleted });
  } catch (err) {
    console.error('[SaleController] bulkDeleteSales error:', err);
    res.status(500).json({ error: 'Failed to bulk delete sales' });
  }
}

// ─── POST /api/sales/:id/send-whatsapp ───────────────────────────────────────
export async function sendWhatsApp(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const queued = await SaleService.queueWhatsAppForSale(id);

    if (!queued) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json({
      success: true,
      message: 'WhatsApp bill queued for delivery',
      whatsappStatus: 'Pending',
    });
  } catch (err) {
    console.error('[SaleController] sendWhatsApp error:', err);
    res.status(500).json({ error: 'Failed to queue WhatsApp message' });
  }
}
