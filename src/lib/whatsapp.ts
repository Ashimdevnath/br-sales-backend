import axios from 'axios';

interface SaleItemData {
  name: string;
  category: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
}

interface SaleData {
  saleNumber: string;
  customerName: string;
  customerPhone: string;
  items: SaleItemData[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  createdAt: Date | string;
  _overrideBody?: string; // optional: skip template and use this raw body
}

function formatCurrency(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

function buildBillMessage(sale: SaleData): string {
  const dateStr = new Date(sale.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const itemLines = sale.items
    .map(
      (i) =>
        `• ${i.name} (${i.size}, ${i.color}) × ${i.qty} = ${formatCurrency(i.qty * i.unitPrice)}`
    )
    .join('\n');

  const discountLine = sale.discount > 0 ? `\nDiscount: -${formatCurrency(sale.discount)}` : '';

  return (
    `*ClotheSales — Bill*\n` +
    `Sale #: ${sale.saleNumber}\n` +
    `Date: ${dateStr}\n\n` +
    `Dear ${sale.customerName},\n` +
    `Thank you for shopping with us!\n\n` +
    `*Items Purchased:*\n` +
    `${itemLines}\n\n` +
    `Subtotal: ${formatCurrency(sale.subtotal)}${discountLine}\n` +
    `*Total Paid: ${formatCurrency(sale.total)}*\n` +
    `Payment: ${sale.paymentMethod}\n\n` +
    `We hope to see you again! 🛍️`
  );
}

/**
 * Format phone number to WhatsApp format.
 * WhatsApp requires international format without '+': e.g. 919876543210
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove leading '+' if present
  return phone.replace(/^\+/, '');
}

/**
 * Send WhatsApp bill via Meta Cloud API
 */
export async function sendWhatsAppBill(
  sale: SaleData
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || 'v20.0';

  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const to = formatPhoneForWhatsApp(sale.customerPhone);
  const message = sale._overrideBody || buildBillMessage(sale);
  const apiUrl = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  try {
    console.log(`[WhatsApp] Calling API: POST ${apiUrl}`);
    console.log(`[WhatsApp] Recipient: ${to}`);
    
    await axios.post(
      apiUrl,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true };
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string };
    const detail = error.response?.data ?? error.message;
    console.error('[WhatsApp] API error:', JSON.stringify(detail, null, 2));
    
    // Properly stringify objects so they don't become "[object Object]"
    const errorString = typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
    return { success: false, error: errorString };
  }
}
