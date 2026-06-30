import { Vonage } from '@vonage/server-sdk';
import { config } from '../config.js';
import logger from '../utils/logger.js';

let vonageClient = null;

function getVonageClient() {
  if (vonageClient) return vonageClient;
  
  if (!config.vonage.apiKey || !config.vonage.apiSecret) {
    throw new Error('Vonage API credentials not configured');
  }
  
  vonageClient = new Vonage({
    apiKey: config.vonage.apiKey,
    apiSecret: config.vonage.apiSecret,
  });
  
  return vonageClient;
}

export async function sendSMS(to, text, from = null) {
  try {
    const client = getVonageClient();
    const fromNumber = from || config.vonage.fromNumber;
    
    if (!fromNumber) {
      throw new Error('VONAGE_FROM_NUMBER not configured');
    }
    
    // Clean phone number
    let cleanTo = to.replace(/\D/g, '');
    if (!cleanTo.startsWith('1') && cleanTo.length === 10) {
      cleanTo = '1' + cleanTo;
    }
    
    logger.info('📡 Sending SMS via Vonage', { to: cleanTo, from: fromNumber });
    
    const response = await client.sms.send({
      to: cleanTo,
      from: fromNumber,
      text: text,
    });
    
    const result = response.messages[0];
    
    logger.info('✅ SMS sent', { 
      to: cleanTo, 
      messageId: result.messageId, 
      status: result.status 
    });
    
    return {
      success: true,
      messageId: result.messageId,
      status: result.status,
      to: cleanTo,
      remainingBalance: result.remainingBalance,
    };
  } catch (error) {
    logger.error('❌ SMS send failed', { error: error.message, to });
    throw error;
  }
}

export async function sendWhatsApp(to, text, from = null) {
  try {
    const client = getVonageClient();
    const fromNumber = from || config.vonage.fromWhatsApp;
    
    if (!fromNumber) {
      throw new Error('VONAGE_FROM_WHATSAPP not configured');
    }
    
    // WhatsApp numbers must be formatted with country code
    let cleanTo = to.replace(/\D/g, '');
    if (!cleanTo.startsWith('1') && cleanTo.length === 10) {
      cleanTo = '1' + cleanTo;
    }
    const whatsappTo = `whatsapp:${cleanTo}`;
    const whatsappFrom = `whatsapp:${fromNumber}`;
    
    logger.info('📡 Sending WhatsApp via Vonage', { to: whatsappTo, from: whatsappFrom });
    
    // Vonage Messages API for WhatsApp
    const response = await client.messages.send({
      to: whatsappTo,
      from: whatsappFrom,
      text: text,
      channel: 'whatsapp',
    });
    
    logger.info('✅ WhatsApp sent', { to: whatsappTo, messageId: response.message_uuid });
    
    return {
      success: true,
      messageId: response.message_uuid,
      to: whatsappTo,
    };
  } catch (error) {
    logger.error('❌ WhatsApp send failed', { error: error.message, to });
    throw error;
  }
}

export async function sendDispatchAlert(to, driverName, incidentAddress, caseNumber, distance, eta, channel = 'sms') {
  const message = `🚨 RANGECAST CAD DISPATCH 🚨\nIncident: ${caseNumber}\nLocation: ${incidentAddress}\nDistance: ${distance.toFixed(1)} mi (${eta}m ETA)\nReply CONFIRM to acknowledge.`;
  
  if (channel === 'whatsapp') {
    return sendWhatsApp(to, message);
  }
  return sendSMS(to, message);
}

export default { sendSMS, sendWhatsApp, sendDispatchAlert };
