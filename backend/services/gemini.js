import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import logger from '../utils/logger.js';

let genAI = null;

function getGenAI() {
  if (genAI) return genAI;
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  genAI = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return genAI;
}

/**
 * Gemini 2.5 transcribes audio AND analyzes it in one call.
 * Replaces: Whisper + Groq pipeline (2 API calls → 1 API call)
 * Cost: FREE (Gemini 2.5 Flash has generous free tier)
 */
export async function transcribeAndAnalyze(audioBuffer, mimeType = 'audio/wav') {
  try {
    const ai = getGenAI();
    
    logger.info('🎙️ Gemini 2.5: Transcribing + analyzing audio', { size: audioBuffer.length });
    
    const response = await ai.models.generateContent({
      model: config.gemini.model,
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: `You are an emergency dispatch AI assistant analyzing police/fire radio transmissions.

Transcribe this audio and analyze it. Extract:
1. Full transcript text
2. Is this an emergency incident? (boolean)
3. Incident type (e.g., auto accident, fire, medical, etc.)
4. Severity (CRITICAL, MAJOR, MODERATE, MINOR)
5. Location mentioned (street address, intersection, or highway exit)
6. Unit numbers mentioned
7. Key keywords (signal codes, 10-codes, etc.)
8. Confidence score (0.0-1.0)

Respond ONLY in this JSON format:
{
  "transcript": "full text",
  "isEmergency": true/false,
  "incidentType": "Auto Accident",
  "severity": "CRITICAL",
  "location": "address or intersection",
  "unitNumbers": ["unit1"],
  "keywords": ["signal 4", "10-50"],
  "confidence": 0.95
}`
            },
            { inlineData: { data: audioBuffer.toString('base64'), mimeType } }
          ]
        }
      ]
    });
    
    const text = response.text || '{}';
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    
    logger.info('✅ Gemini 2.5 analysis complete', { 
      isEmergency: result.isEmergency, 
      severity: result.severity,
      location: result.location 
    });
    
    return result;
  } catch (error) {
    logger.error('❌ Gemini transcription+analysis failed', { error: error.message });
    throw error;
  }
}

/**
 * Analyze text transcript (for mic input or text fallback)
 */
export async function analyzeText(transcript) {
  try {
    const ai = getGenAI();
    
    logger.info('🧠 Gemini 2.5: Analyzing text transcript', { length: transcript.length });
    
    const response = await ai.models.generateContent({
      model: config.gemini.model,
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: `Analyze this emergency dispatch radio transcript and respond ONLY in JSON:

Transcript: "${transcript}"

{
  "isEmergency": true/false,
  "incidentType": "Auto Accident/Fire/Medical/etc",
  "severity": "CRITICAL/MAJOR/MODERATE/MINOR",
  "location": "address or intersection or null",
  "unitNumbers": ["unit1"],
  "keywords": ["signal 4", "10-50"],
  "confidence": 0.0-1.0
}`
            }
          ]
        }
      ]
    });
    
    const text = response.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (error) {
    logger.error('❌ Gemini text analysis failed', { error: error.message });
    // Fallback keyword matching
    return fallbackAnalysis(transcript);
  }
}

function fallbackAnalysis(transcript) {
  const text = transcript.toLowerCase();
  const priorities = ['signal 4', 'signal four', '10-50', '10-45', '10-52', 'crash', 'mva', 'mvc', 'accident', 'injuries', 'fire', 'structure fire', 'entrapment', 'ejection', 'pin-in'];
  const keywords = priorities.filter(kw => text.includes(kw));
  const isEmergency = keywords.length > 0;
  
  let severity = 'MINOR';
  if (text.includes('signal 4') || text.includes('10-50') || text.includes('injuries') || text.includes('fire') || text.includes('entrapment')) severity = 'CRITICAL';
  else if (text.includes('crash') || text.includes('mva') || text.includes('mvc') || text.includes('rollover')) severity = 'MAJOR';
  
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

export default { transcribeAndAnalyze, analyzeText };
