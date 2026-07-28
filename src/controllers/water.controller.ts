import { Request, Response } from 'express';
import * as WaterService from '../services/water.service';

// ─── Settings ────────────────────────────────────────────────────────────────
export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await WaterService.getSettings();
    res.json(settings);
  } catch (err) {
    console.error('[WaterController] getSettings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const { unitPrice } = req.body;
    const settings = await WaterService.updateUnitPrice(Number(unitPrice));
    res.json(settings);
  } catch (err) {
    console.error('[WaterController] updateSettings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

// ─── Society ─────────────────────────────────────────────────────────────────
export async function listSocieties(req: Request, res: Response): Promise<void> {
  try {
    const societies = await WaterService.listSocieties();
    res.json(societies);
  } catch (err) {
    console.error('[WaterController] listSocieties error:', err);
    res.status(500).json({ error: 'Failed to fetch societies' });
  }
}

export async function createSociety(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Society name is required' });
      return;
    }
    const society = await WaterService.createSociety(name);
    res.status(201).json(society);
  } catch (err) {
    console.error('[WaterController] createSociety error:', err);
    res.status(500).json({ error: 'Failed to create society' });
  }
}

// ─── Room ────────────────────────────────────────────────────────────────────
export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    const { societyId, roomNumber } = req.body;
    if (!societyId || !roomNumber) {
      res.status(400).json({ error: 'societyId and roomNumber are required' });
      return;
    }
    const room = await WaterService.createRoom(societyId, roomNumber);
    res.status(201).json(room);
  } catch (err) {
    console.error('[WaterController] createRoom error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
}

// ─── Water Delivery ──────────────────────────────────────────────────────────
export async function addDelivery(req: Request, res: Response): Promise<void> {
  try {
    const { roomId, date, bottles } = req.body; // Actually represents amount now
    if (!roomId || !date || bottles === undefined) {
      res.status(400).json({ error: 'roomId, date, and bottles are required' });
      return;
    }
    const delivery = await WaterService.addDelivery(roomId, new Date(date), Number(bottles));
    res.status(201).json(delivery);
  } catch (err) {
    console.error('[WaterController] addDelivery error:', err);
    res.status(500).json({ error: 'Failed to add delivery' });
  }
}

export async function updateDelivery(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { bottles } = req.body;
    if (bottles === undefined) {
      res.status(400).json({ error: 'bottles (amount) is required' });
      return;
    }
    const delivery = await WaterService.updateDelivery(id as string, Number(bottles));
    res.status(200).json(delivery);
  } catch (err) {
    console.error('[WaterController] updateDelivery error:', err);
    res.status(500).json({ error: 'Failed to update delivery' });
  }
}

export async function addIndependentBottle(req: Request, res: Response): Promise<void> {
  try {
    const { date, bottles } = req.body;
    if (!date || bottles === undefined) {
      res.status(400).json({ error: 'date and bottles are required' });
      return;
    }
    const entry = await WaterService.addIndependentBottle(new Date(date), Number(bottles));
    res.status(201).json(entry);
  } catch (err) {
    console.error('[WaterController] addIndependentBottle error:', err);
    res.status(500).json({ error: 'Failed to add independent bottle entry' });
  }
}

export async function updateIndependentBottle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { bottles } = req.body;
    if (bottles === undefined) {
      res.status(400).json({ error: 'bottles is required' });
      return;
    }
    const entry = await WaterService.updateIndependentBottle(id as string, Number(bottles));
    res.status(200).json(entry);
  } catch (err) {
    console.error('[WaterController] updateIndependentBottle error:', err);
    res.status(500).json({ error: 'Failed to update independent bottle entry' });
  }
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: 'start and end dates are required' });
      return;
    }
    const stats = await WaterService.getDashboardStats(new Date(String(start)), new Date(String(end)));
    res.json(stats);
  } catch (err) {
    console.error('[WaterController] getDashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
