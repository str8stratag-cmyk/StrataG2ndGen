import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING,
  
  // Vonage (SMS + WhatsApp)
  vonage: {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY,
    fromNumber: process.env.VONAGE_FROM_NUMBER,
    fromWhatsApp: process.env.VONAGE_FROM_WHATSAPP || process.env.VONAGE_FROM_NUMBER,
  },
  
  // Gemini (Transcription + AI Analysis — FREE, replaces Groq)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20',
  },
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'stratag2ndgen-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Auth
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
};

// Validation
export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'VONAGE_API_KEY',
    'VONAGE_API_SECRET',
    'GEMINI_API_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
