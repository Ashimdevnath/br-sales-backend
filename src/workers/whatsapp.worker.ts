import { Worker } from 'bullmq';
import { redisConnection, WhatsAppJobData } from '../queues/whatsapp.queue';
import { sendWhatsAppBill } from '../lib/whatsapp';
import prisma from '../lib/prisma';

/**
 * BullMQ Worker — processes WhatsApp bill jobs.
 * On success: updates sale.whatsappStatus = 'Sent'
 * On failure after all retries: updates sale.whatsappStatus = 'Failed'
 */
export function startWhatsAppWorker() {
  const worker = new Worker<WhatsAppJobData>(
    'whatsapp-bills',
    async (job) => {
      const data = job.data;
      console.log(`[Worker] Processing WhatsApp bill for ${data.saleNumber} → ${data.customerPhone}`);

      const result = await sendWhatsAppBill({
        saleNumber: data.saleNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        paymentMethod: data.paymentMethod,
        createdAt: data.createdAt,
      });

      if (!result.success) {
        throw new Error(result.error || 'WhatsApp send failed');
      }

      // Update status to Sent
      await prisma.sale.update({
        where: { id: data.saleId },
        data: { whatsappStatus: 'Sent' },
      });

      console.log(`[Worker] ✓ WhatsApp bill sent for ${data.saleNumber}`);
    },
    {
      connection: redisConnection,
      concurrency: 3,
    }
  );

  // On permanent failure (all retries exhausted)
  worker.on('failed', async (job, err) => {
    if (!job) return;
    const attemptsLeft = (job.opts.attempts ?? 1) - (job.attemptsMade);
    if (attemptsLeft <= 0) {
      console.error(`[Worker] ✗ Permanently failed for sale ${job.data.saleId}:`, err.message);
      await prisma.sale.update({
        where: { id: job.data.saleId },
        data: { whatsappStatus: 'Failed' },
      }).catch(console.error);
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error:', err);
  });

  console.log('[Worker] WhatsApp worker started');
  return worker;
}
