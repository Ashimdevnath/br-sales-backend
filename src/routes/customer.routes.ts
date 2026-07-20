import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as CustomerController from '../controllers/customer.controller';

const router = Router();

// ─── All customer routes are protected ────────────────────────────────────────
router.use(requireAuth);

/** List customers (supports: search query param) */
router.get('/', CustomerController.listCustomers);

/** Get a customer by ID including full purchase history */
router.get('/:id', CustomerController.getCustomer);

export default router;
