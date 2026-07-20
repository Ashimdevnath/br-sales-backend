import prisma from '../lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────
export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  totalSales: number;
  createdAt: string;
};

export type CustomerDetail = CustomerSummary & {
  totalSpent: number;
  sales: {
    id: string;
    saleNumber: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    itemCount: number;
  }[];
};

// ─── List / search customers ──────────────────────────────────────────────────
export async function listCustomers(search = ''): Promise<CustomerSummary[]> {
  const customers = await prisma.customer.findMany({
    where: search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    include: { _count: { select: { sales: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    totalSales: c._count.sales,
    createdAt: c.createdAt.toISOString(),
  }));
}

// ─── Get customer detail with purchase history ────────────────────────────────
export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) return null;

  const totalSpent = customer.sales
    .filter((s) => s.status === 'Confirmed')
    .reduce((sum, s) => sum + s.total, 0);

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    totalSales: customer.sales.length,
    totalSpent,
    createdAt: customer.createdAt.toISOString(),
    sales: customer.sales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      total: s.total,
      status: s.status,
      paymentMethod: s.paymentMethod,
      createdAt: s.createdAt.toISOString(),
      itemCount: s.items.length,
    })),
  };
}
