import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ─── Redis connection ─────────────────────────────────────────────────────────
export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // required by BullMQ
});

// ─── WhatsApp Queue ───────────────────────────────────────────────────────────
export interface WhatsAppJobData {
  saleId: string;
  saleNumber: string;
  customerName: string;
  customerPhone: string;
  items: {
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
  createdAt: string;
}

export const whatsappQueue = new Queue<WhatsAppJobData>('whatsapp-bills', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 25s, 125s
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
