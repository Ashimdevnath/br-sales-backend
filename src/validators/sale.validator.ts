import { z } from 'zod';

export const saleItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  size: z.string().min(1, 'Size is required'),
  color: z.string().default(''),
  qty: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1, 'Quantity must be at least 1')),
  unitPrice: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().min(0, 'Unit price must be >= 0')),
});

export const createSaleSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z
    .string()
    .regex(/^\+?[0-9]{10,13}$/, 'Enter a valid phone number (10-13 digits)'),
  paymentMethod: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']),
  status: z.enum(['Confirmed', 'Draft', 'Cancelled']),
  discount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().min(0))
    .default(0),
  notes: z.string().optional().default(''),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  createdAt: z.string().optional(),
});

export const updateSaleSchema = createSaleSchema.partial();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
