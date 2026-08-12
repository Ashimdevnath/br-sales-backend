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
    where: { deletedAt: null },
    include: { 
      rooms: {
        where: { deletedAt: null }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
}

export async function createSociety(name: string) {
  const existing = await prisma.society.findUnique({
    where: { name }
  });

  if (existing) {
    if (existing.deletedAt) {
      // Restore soft-deleted society
      return prisma.society.update({
        where: { id: existing.id },
        data: { deletedAt: null }
      });
    }
    throw new Error(`Society '${name}' already exists`);
  }

  return prisma.society.create({
    data: { name }
  });
}

export async function updateSociety(id: string, name: string) {
  return prisma.society.update({
    where: { id },
    data: { name }
  });
}

export async function deleteSociety(id: string) {
  return prisma.society.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}

// ─── Room ────────────────────────────────────────────────────────────────────
export async function createRoom(societyId: string, roomNumber: string) {
  const existing = await prisma.room.findFirst({
    where: { societyId, roomNumber }
  });

  if (existing) {
    if (existing.deletedAt) {
      // Restore soft-deleted room
      return prisma.room.update({
        where: { id: existing.id },
        data: { deletedAt: null }
      });
    }
    throw new Error(`Room '${roomNumber}' already exists`);
  }

  return prisma.room.create({
    data: { societyId, roomNumber }
  });
}

export async function updateRoom(id: string, roomNumber: string) {
  return prisma.room.update({
    where: { id },
    data: { roomNumber }
  });
}

export async function deleteRoom(id: string) {
  return prisma.room.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}

export async function getRoomsBySociety(societyId: string) {
  return prisma.room.findMany({
    where: { societyId, deletedAt: null },
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

export async function updateDelivery(id: string, bottles: number, date?: Date) {
  return prisma.waterDelivery.update({
    where: { id },
    data: { 
      bottles,
      ...(date && { date })
    }
  });
}

// ─── Independent Bottle Delivery ──────────────────────────────────────────────
export async function addIndependentBottle(date: string, round1: number, round2: number, round3: number, round4: number, round5: number) {
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);
  const bottles = round1 + round2 + round3 + round4 + round5;

  return prisma.independentBottleEntry.create({
    data: { date: normalizedDate, round1, round2, round3, round4, round5, bottles }
  });
}

export async function updateIndependentBottle(id: string, round1: number, round2: number, round3: number, round4: number, round5: number) {
  const bottles = round1 + round2 + round3 + round4 + round5;
  return prisma.independentBottleEntry.update({
    where: { id },
    data: { round1, round2, round3, round4, round5, bottles }
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
