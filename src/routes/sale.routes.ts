import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSaleSchema, updateSaleSchema } from '../validators/sale.validator';
import * as SaleController from '../controllers/sale.controller';

const router = Router();

// ─── All sale routes are protected ────────────────────────────────────────────
router.use(requireAuth);

/** List all sales (supports: search, status, paymentMethod, whatsappStatus, page, pageSize) */
router.get('/', SaleController.listSales);

/** Get a single sale by ID */
router.get('/:id', SaleController.getSale);

/** Create a new sale (auto-queues WhatsApp if status=Confirmed) */
router.post('/', validate(createSaleSchema), SaleController.createSale);

/** Update an existing sale */
router.put('/:id', validate(updateSaleSchema), SaleController.updateSale);

/** Bulk delete: body { ids: string[] } */
router.delete('/', SaleController.bulkDeleteSales);

/** Delete a single sale */
router.delete('/:id', SaleController.deleteSale);

/** Queue a WhatsApp bill for a specific sale */
router.post('/:id/send-whatsapp', SaleController.sendWhatsApp);

export default router;
