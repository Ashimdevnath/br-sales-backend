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

export async function updateSociety(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Society name is required' });
      return;
    }
    const society = await WaterService.updateSociety(id, name);
    res.status(200).json(society);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'A society with this name already exists' });
      return;
    }
    console.error('[WaterController] updateSociety error:', err);
    res.status(500).json({ error: 'Failed to update society' });
  }
}

export async function deleteSociety(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await WaterService.deleteSociety(id);
    res.status(200).json({ message: 'Society deleted successfully' });
  } catch (err) {
    console.error('[WaterController] deleteSociety error:', err);
    res.status(500).json({ error: 'Failed to delete society' });
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
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'This room number already exists for the selected society.' });
      return;
    }
    console.error('[WaterController] createRoom error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
}

export async function updateRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { roomNumber } = req.body;
    if (!roomNumber) {
      res.status(400).json({ error: 'Room number is required' });
      return;
    }
    const room = await WaterService.updateRoom(id, roomNumber);
    res.status(200).json(room);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'This room number already exists for the society.' });
      return;
    }
    console.error('[WaterController] updateRoom error:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
}

export async function deleteRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await WaterService.deleteRoom(id);
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error('[WaterController] deleteRoom error:', err);
    res.status(500).json({ error: 'Failed to delete room' });
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
    const { date, round1 = 0, round2 = 0, round3 = 0, round4 = 0, round5 = 0 } = req.body;
    if (!date) {
      res.status(400).json({ error: 'date is required' });
      return;
    }
    const entry = await WaterService.addIndependentBottle(date, Number(round1), Number(round2), Number(round3), Number(round4), Number(round5));
    res.status(201).json(entry);
  } catch (err) {
    console.error('[WaterController] addIndependentBottle error:', err);
    res.status(500).json({ error: 'Failed to add independent bottle entry' });
  }
}

export async function updateIndependentBottle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { round1 = 0, round2 = 0, round3 = 0, round4 = 0, round5 = 0 } = req.body;
    const entry = await WaterService.updateIndependentBottle(id as string, Number(round1), Number(round2), Number(round3), Number(round4), Number(round5));
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
