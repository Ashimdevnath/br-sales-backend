import prisma from '../lib/prisma';
import { Society, Room, WaterDelivery, WaterSettings } from '@prisma/client';

// ─── Settings ────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<WaterSettings> {
  let settings = await prisma.waterSettings.findFirst();
  if (!settings) {
    settings = await prisma.waterSettings.create({
      data: { unitPrice: 0 }
    });
  }
  return settings;
}

export async function updateUnitPrice(unitPrice: number): Promise<WaterSettings> {
  const settings = await getSettings();
  return prisma.waterSettings.update({
    where: { id: settings.id },
    data: { unitPrice }
  });
}

// ─── Society ─────────────────────────────────────────────────────────────────
export async function listSocieties() {
  return prisma.society.findMany({
    include: { rooms: true },
    orderBy: { createdAt: 'asc' }
  });
}

export async function createSociety(name: string) {
  return prisma.society.create({
    data: { name }
  });
}

// ─── Room ────────────────────────────────────────────────────────────────────
export async function createRoom(societyId: string, roomNumber: string) {
  return prisma.room.create({
    data: { societyId, roomNumber }
  });
}

export async function getRoomsBySociety(societyId: string) {
  return prisma.room.findMany({
    where: { societyId },
    orderBy: { roomNumber: 'asc' }
  });
}

// ─── Water Delivery ──────────────────────────────────────────────────────────
export async function addDelivery(roomId: string, date: Date, bottles: number) {
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  return prisma.waterDelivery.create({
    data: { roomId, date: normalizedDate, bottles }
  });
}

export async function updateDelivery(id: string, bottles: number) {
  return prisma.waterDelivery.update({
    where: { id },
    data: { bottles }
  });
}

// ─── Independent Bottle Delivery ──────────────────────────────────────────────
export async function addIndependentBottle(date: Date, bottles: number) {
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  return prisma.independentBottleEntry.create({
    data: { date: normalizedDate, bottles }
  });
}

export async function updateIndependentBottle(id: string, bottles: number) {
  return prisma.independentBottleEntry.update({
    where: { id },
    data: { bottles }
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export async function getDashboardStats(startDate: Date, endDate: Date) {
  const settings = await getSettings();
  
  // 1. Society Deliveries (Amount based)
  const societyDeliveries = await prisma.waterDelivery.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      room: {
        include: {
          society: true
        }
      }
    },
    orderBy: { date: 'asc' }
  });

  let totalSocietyAmount = 0;
  for (const delivery of societyDeliveries) {
    totalSocietyAmount += delivery.bottles; // currently 'bottles' field represents amount here
  }

  // 2. Independent Bottle Entries
  const independentDeliveries = await prisma.independentBottleEntry.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  let totalIndependentBottles = 0;
  for (const entry of independentDeliveries) {
    totalIndependentBottles += entry.bottles;
  }

  const estimatedRevenue = totalIndependentBottles * settings.unitPrice;

  return {
    societyStats: {
      totalAmount: totalSocietyAmount,
      deliveries: societyDeliveries
    },
    independentStats: {
      totalBottles: totalIndependentBottles,
      estimatedRevenue,
      deliveries: independentDeliveries
    },
    unitPrice: settings.unitPrice
  };
}
