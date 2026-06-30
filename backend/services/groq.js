import Groq from 'groq-sdk';
import { config } from '../config.js';
import logger from '../utils/logger.js';

let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  groqClient = new Groq({ apiKey: config.groq.apiKey });
  return groqClient;
}

export async function analyzeTranscript(transcript, options = {}) {
  try {
    const client = getGroqClient();
    
    const prompt = `You are an emergency dispatch AI assistant analyzing police/fire radio transmissions.

Analyze the following radio transmission and extract:
1. Is this an emergency incident? (boolean)
2. What type of incident? (e.g., auto accident, fire, medical, etc.)
3. Severity level (CRITICAL, MAJOR, MODERATE, MINOR)
4. Location mentioned (street address or intersection)
5. Any unit numbers mentioned
6. Key keywords detected (signal codes, 10-codes, etc.)

Transcript: "${transcript}"

Respond in JSON format only:
{
  "isEmergency": boolean,
  "incidentType": "string",
  "severity": "CRITICAL|MAJOR|MODERATE|MINOR",
  "location": "string or null",
  "unitNumbers": ["string"],
  "keywords": ["string"],
  "confidence": 0.0-1.0
}`;

    logger.info('🧠 Analyzing transcript with Groq', { transcriptLength: transcript.length });
    
    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [
        { role: 'system', content: 'You are a precise emergency dispatch AI. Always respond in valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    logger.info('✅ Groq analysis complete', { incidentType: result.incidentType, severity: result.severity });
    
    return result;
  } catch (error) {
    logger.error('❌ Groq analysis failed', { error: error.message });
    // Fallback analysis
    return fallbackAnalysis(transcript);
  }
}

function fallbackAnalysis(transcript) {
  const text = transcript.toLowerCase();
  const priorities = ['signal 4', '10-50', '10-45', '10-52', 'crash', 'mva', 'mvc', 'accident', 'injuries', 'fire', 'structure fire', 'shooting', 'stabbing', ' cardiac'];
  const keywords = priorities.filter(kw => text.includes(kw));
  
  const isEmergency = keywords.length > 0;
  let severity = 'MINOR';
  if (text.includes('signal 4') || text.includes('10-50') || text.includes('injuries') || text.includes('fire')) severity = 'CRITICAL';
  else if (text.includes('crash') || text.includes('mva') || text.includes('mvc')) severity = 'MAJOR';
  
  return {
    isEmergency,
    incidentType: isEmergency ? 'Auto Accident' : 'Routine Traffic',
    severity,
    location: null,
    unitNumbers: [],
    keywords,
    confidence: 0.6
  };
}

export async function generateDispatchMessage(incidentType, address, caseNumber, driverName) {
  try {
    const client = getGroqClient();
    
    const prompt = `Generate a brief, professional SMS dispatch message for a tow truck driver.
Incident: ${incidentType}
Location: ${address}
Case: ${caseNumber}
Driver: ${driverName}

Keep it under 160 characters. Use professional but urgent tone.`;

    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    logger.error('Groq message generation failed', { error: error.message });
    return `🚨 DISPATCH: ${incidentType} at ${address}. Case ${caseNumber}. Respond ASAP.`;
  }
}

export default { analyzeTranscript, generateDispatchMessage };
