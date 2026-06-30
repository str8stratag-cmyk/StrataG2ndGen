import express from 'express';
import { sendSMS, sendWhatsApp, sendDispatchAlert } from '../services/vonage.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/vonage/sms - Send SMS
router.post('/sms', async (req, res, next) => {
  try {
    const { to, text, from } = req.body;
    
    if (!to || !text) {
      return res.status(400).json({ success: false, error: 'to and text are required' });
    }

    const result = await sendSMS(to, text, from);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Vonage SMS error:', error.message);
    next(error);
  }
});

// POST /api/vonage/whatsapp - Send WhatsApp
router.post('/whatsapp', async (req, res, next) => {
  try {
    const { to, text, from } = req.body;
    
    if (!to || !text) {
      return res.status(400).json({ success: false, error: 'to and text are required' });
    }

    const result = await sendWhatsApp(to, text, from);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Vonage WhatsApp error:', error.message);
    next(error);
  }
});

// POST /api/vonage/dispatch - Send dispatch alert
router.post('/dispatch', async (req, res, next) => {
  try {
    const { to, driverName, incidentAddress, caseNumber, distance, eta, channel } = req.body;
    
    if (!to || !driverName || !incidentAddress || !caseNumber) {
      return res.status(400).json({ success: false, error: 'to, driverName, incidentAddress, and caseNumber are required' });
    }

    const result = await sendDispatchAlert(
      to, driverName, incidentAddress, caseNumber,
      distance || 3.0, eta || 8, channel || 'sms'
    );
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Vonage dispatch error:', error.message);
    next(error);
  }
});

// POST /api/vonage/status - Webhook for delivery status
router.post('/status', async (req, res) => {
  logger.info('Vonage delivery status webhook', { body: req.body });
  res.status(200).send('OK');
});

// POST /api/vonage/inbound - Webhook for incoming messages
router.post('/inbound', async (req, res) => {
  logger.info('Vonage inbound message webhook', { body: req.body });
  
  // Handle driver replies here
  const { from, text, messageId } = req.body;
  
  if (text) {
    logger.info('Driver reply received', { from, text: text.substring(0, 100) });
    // Could broadcast to dispatchers or update incident status
  }
  
  res.status(200).send('OK');
});

// GET /api/vonage/balance - Check account status
router.get('/balance', async (req, res, next) => {
  try {
    const { config } = await import('../config.js');
    
    if (!config.vonage.apiKey || !config.vonage.apiSecret) {
      return res.status(400).json({ success: false, error: 'Vonage credentials not configured' });
    }
    
    res.json({ success: true, status: 'configured', apiKey: config.vonage.apiKey.substring(0, 4) + '****' });
  } catch (error) {
    logger.error('Vonage balance check error:', error.message);
    next(error);
  }
});

export default router;
