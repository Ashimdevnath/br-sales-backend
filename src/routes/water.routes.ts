import { Router } from 'express';
import * as WaterController from '../controllers/water.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Secure all routes
router.use(requireAuth);

// Settings
router.get('/settings', WaterController.getSettings);
router.post('/settings', WaterController.updateSettings);

// Society
router.get('/societies', WaterController.listSocieties);
router.post('/societies', WaterController.createSociety);
router.put('/societies/:id', WaterController.updateSociety);
router.delete('/societies/:id', WaterController.deleteSociety);

// Room
router.post('/rooms', WaterController.createRoom);
router.put('/rooms/:id', WaterController.updateRoom);
router.delete('/rooms/:id', WaterController.deleteRoom);

// Delivery
router.post('/deliveries', WaterController.addDelivery);
router.put('/deliveries/:id', WaterController.updateDelivery);
router.post('/independent-deliveries', WaterController.addIndependentBottle);
router.put('/independent-deliveries/:id', WaterController.updateIndependentBottle);
router.get('/dashboard', WaterController.getDashboard);

export default router;
