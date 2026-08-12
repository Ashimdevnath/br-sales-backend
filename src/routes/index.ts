import { Application } from 'express';
import authRoutes from './auth.routes';
import saleRoutes from './sale.routes';
import customerRoutes from './customer.routes';
import reportRoutes from './report.routes';
import waterRoutes from './water.routes';
import whatsappRoutes from './whatsapp.routes';

/**
 * Registers all API routes on the Express application.
 * Add new route groups here — keep index.ts clean.
 */
export function registerRoutes(app: Application): void {
  app.use('/api/auth', authRoutes);
  app.use('/api/sales', saleRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/water', waterRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
}
