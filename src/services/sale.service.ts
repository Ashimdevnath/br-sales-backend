import prisma from '../lib/prisma';
import { whatsappQueue } from '../queues/whatsapp.queue';

// ─── Types ────────────────────────────────────────────────────────────────────
export type SaleShape = {
  id: string;
  saleNumber: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  items: {
    id: string;
    name: string;
    category: string;
    size: string;
    color: string;
    qty: number;
    unitPrice: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  whatsappStatus: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type FullSale = {
  id: string;
  saleNumber: string;
  customerId: string;
  customer: { id: string; name: string; phone: string };
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  whatsappStatus: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    name: string;
    category: string;
    size: string;
    color: string;
    qty: number;
    unitPrice: number;
  }[];
};

export type SaleItemInput = {
  name: string;
  category: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
};

export type CreateSaleInput = {
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  status: string;
  discount: number;
  notes?: string;
  items: SaleItemInput[];
};

export type UpdateSaleInput = Partial<CreateSaleInput>;

export type SaleFilters = {
  search?: string;
  status?: string;
  paymentMethod?: string;
  whatsappStatus?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

export type SalesListResult = {
  data: SaleShape[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Helper: shape a DB record for API response ───────────────────────────────
export function shapeSale(sale: FullSale): SaleShape {
  return {
    id: sale.id,
    saleNumber: sale.saleNumber,
    customerName: sale.customer.name,
    customerPhone: sale.customer.phone,
    customerId: sale.customerId,
    items: sale.items,
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    whatsappStatus: sale.whatsappStatus,
    notes: sale.notes || '',
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
  };
}

// ─── Helper: generate next sale number for current year ───────────────────────
export async function generateSaleNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.sale.count({
    where: { saleNumber: { startsWith: `CS-${year}-` } },
  });
  return `CS-${year}-${String(count + 1).padStart(3, '0')}`;
}

// ─── Queue a WhatsApp bill job ────────────────────────────────────────────────
async function queueWhatsAppBill(sale: FullSale): Promise<void> {
  await whatsappQueue.add('send-bill', {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    customerName: sale.customer.name,
    customerPhone: sale.customer.phone,
    items: sale.items,
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    createdAt: sale.createdAt.toISOString(),
  });
}

// ─── List sales with filters and pagination ───────────────────────────────────
export async function listSales(filters: SaleFilters): Promise<SalesListResult> {
  const { search = '', status, paymentMethod, whatsappStatus, dateFrom, dateTo, page = 1, pageSize = 50 } = filters;

  const pageNum = Math.max(1, page);
  const size = Math.min(500, Math.max(1, pageSize)); // allow up to 500 for history queries

  const where: Record<string, unknown> = {};
  if (status && status !== 'All') where.status = status;
  if (paymentMethod && paymentMethod !== 'All') where.paymentMethod = paymentMethod;
  if (whatsappStatus && whatsappStatus !== 'All') where.whatsappStatus = whatsappStatus;
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom + 'T00:00:00.000Z');
    if (dateTo) createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    where.createdAt = createdAt;
  }
  if (search.trim()) {
    where.OR = [
      { saleNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * size,
      take: size,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    data: sales.map(shapeSale),
    total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.max(1, Math.ceil(total / size)),
  };
}

// ─── Get a single sale by ID ──────────────────────────────────────────────────
export async function getSaleById(id: string): Promise<SaleShape | null> {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { customer: true, items: true },
  });
  return sale ? shapeSale(sale) : null;
}

// ─── Create a sale and optionally queue WhatsApp bill ─────────────────────────
export async function createSale(input: CreateSaleInput): Promise<SaleShape> {
  const { customerName, customerPhone, paymentMethod, status, discount, notes, items, createdAt } = input;

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const total = Math.max(0, subtotal - (discount || 0));

  // Upsert customer by phone number
  const customer = await prisma.customer.upsert({
    where: { phone: customerPhone },
    update: { name: customerName },
    create: { name: customerName, phone: customerPhone },
  });

  const saleNumber = await generateSaleNumber();

  const sale = await prisma.sale.create({
    data: {
      saleNumber,
      customerId: customer.id,
      subtotal,
      discount: discount || 0,
      total,
      paymentMethod,
      status,
      whatsappStatus: status === 'Confirmed' ? 'Pending' : 'Not Sent',
      notes: notes || '',
      createdAt: createdAt ? new Date(createdAt) : undefined,
      items: { create: items },
    },
    include: { customer: true, items: true },
  });

  // Auto-queue WhatsApp on Confirmed
  if (status === 'Confirmed') {
    await queueWhatsAppBill(sale);
    console.log(`[SaleService] WhatsApp job queued for ${sale.saleNumber}`);
  }

  return shapeSale(sale);
}

// ─── Update a sale ────────────────────────────────────────────────────────────
export async function updateSale(id: string, input: UpdateSaleInput): Promise<SaleShape | null> {
  const existing = await prisma.sale.findUnique({
    where: { id },
    include: { customer: true, items: true },
  });
  if (!existing) return null;

  const { customerName, customerPhone, paymentMethod, status, discount, notes, items } = input;

  // Upsert/update customer if phone or name changed
  let customerId = existing.customerId;
  if (customerPhone && customerPhone !== existing.customer.phone) {
    const c = await prisma.customer.upsert({
      where: { phone: customerPhone },
      update: { name: customerName || existing.customer.name },
      create: { name: customerName || existing.customer.name, phone: customerPhone },
    });
    customerId = c.id;
  } else if (customerName && customerName !== existing.customer.name) {
    await prisma.customer.update({
      where: { id: existing.customerId },
      data: { name: customerName },
    });
  }

  const updateData: Record<string, unknown> = {
    customerId,
    paymentMethod: paymentMethod ?? existing.paymentMethod,
    status: status ?? existing.status,
    discount: discount ?? existing.discount,
    notes: notes ?? existing.notes,
  };

  if (items && items.length > 0) {
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const disc = discount ?? existing.discount;
    updateData.subtotal = subtotal;
    updateData.total = Math.max(0, subtotal - disc);
    await prisma.saleItem.deleteMany({ where: { saleId: id } });
    updateData.items = { create: items };
  } else if (discount !== undefined) {
    updateData.total = Math.max(0, existing.subtotal - discount);
  }

  const sale = await prisma.sale.update({
    where: { id },
    data: updateData,
    include: { customer: true, items: true },
  });

  return shapeSale(sale);
}

// ─── Delete a single sale ─────────────────────────────────────────────────────
export async function deleteSale(id: string): Promise<boolean> {
  const existing = await prisma.sale.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.sale.delete({ where: { id } });
  return true;
}

// ─── Bulk delete sales ────────────────────────────────────────────────────────
export async function bulkDeleteSales(ids: string[]): Promise<number> {
  const result = await prisma.sale.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}

// ─── Queue a WhatsApp bill for an existing sale ───────────────────────────────
export async function queueWhatsAppForSale(id: string): Promise<boolean> {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { customer: true, items: true },
  });
  if (!sale) return false;

  await prisma.sale.update({ where: { id }, data: { whatsappStatus: 'Pending' } });
  await queueWhatsAppBill(sale);
  return true;
}
