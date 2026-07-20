import { Request, Response } from 'express';
import * as CustomerService from '../services/customer.service';

// ─── GET /api/customers ───────────────────────────────────────────────────────
export async function listCustomers(req: Request, res: Response): Promise<void> {
  try {
    const search = String(req.query.search || '');
    const customers = await CustomerService.listCustomers(search);
    res.json(customers);
  } catch (err) {
    console.error('[CustomerController] listCustomers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

// ─── GET /api/customers/:id ───────────────────────────────────────────────────
export async function getCustomer(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const customer = await CustomerService.getCustomerById(id);

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (err) {
    console.error('[CustomerController] getCustomer error:', err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
}
