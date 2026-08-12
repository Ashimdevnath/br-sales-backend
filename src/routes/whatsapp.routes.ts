import { Router } from 'express';

const router = Router();

// Your secret verify token. You will enter this exactly in the Meta Dashboard.
const VERIFY_TOKEN = 'my_secret_token_123';

/**
 * GET /api/whatsapp/webhook
 * Used by Meta to verify your webhook URL.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verified by Meta!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * POST /api/whatsapp/webhook
 * Used by Meta to send you message status updates (Delivered, Read, etc.)
 */
router.post('/webhook', (req, res) => {
  console.log('[WhatsApp Webhook] Received update:', JSON.stringify(req.body, null, 2));
  
  // Always return 200 OK so Meta knows you received it
  res.sendStatus(200);
});

export default router;
