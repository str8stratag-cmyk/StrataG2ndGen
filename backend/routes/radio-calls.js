import express from 'express';
import { query } from '../database.js';
import logger from '../utils/logger.js';
import { analyzeText } from '../services/gemini.js';
import { emitToDispatchers } from '../websocket.js';
import { io } from '../index.js';

const router = express.Router();

// GET /api/radio-calls - List all radio calls
router.get('/', async (req, res, next) => {
  try {
    const { is_signal4, agency, limit = 100, offset = 0 } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (is_signal4 !== undefined) {
      whereClause += ` AND is_signal4 = $${paramIndex}`;
      params.push(is_signal4 === 'true');
      paramIndex++;
    }
    if (agency) {
      whereClause += ` AND agency ILIKE $${paramIndex}`;
      params.push(`%${agency}%`);
      paramIndex++;
    }

    const result = await query(
      `SELECT rc.*, i.case_number as linked_incident_case 
       FROM radio_calls rc 
       LEFT JOIN incidents i ON rc.linked_incident_id = i.id
       ${whereClause} 
       ORDER BY rc.timestamp DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, count: result.rows.length, radio_calls: result.rows });
  } catch (error) {
    logger.error('Error fetching radio calls:', error.message);
    next(error);
  }
});

// POST /api/radio-calls - Log new radio transmission with Gemini 2.5 AI analysis
router.post('/', async (req, res, next) => {
  try {
    let { timestamp, agency, unit, transcript, audio_duration_seconds, is_signal4 = false, audio_url } = req.body;

    if (!transcript) {
      return res.status(400).json({ success: false, error: 'Transcript is required' });
    }

    // Clean transcription anomalies
    const cleanText = transcript.toLowerCase()
      .replace(/signal for/g, 'signal 4')
      .replace(/core bc/g, 'mvc')
      .replace(/core b c/g, 'mvc')
      .replace(/b c/g, 'mvc');

    // AI Analysis via Gemini 2.5 (FREE — replaces Groq)
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeText(cleanText);
    } catch (err) {
      logger.warn('Gemini analysis failed, using fallback', { error: err.message });
      // Fallback keyword matching
      const priorities = ['signal 4', 'signal four', '10-50', '10-45', '10-52', 'crash', 'mva', 'mvc', 'accident', 'injuries', 'fire', 'structure fire', 'entrapment', 'ejection'];
      const keywords = priorities.filter(kw => cleanText.includes(kw));
      aiAnalysis = {
        isEmergency: keywords.length > 0,
        incidentType: keywords.length > 0 ? 'Auto Accident' : 'Routine',
        severity: keywords.length > 0 ? 'CRITICAL' : 'MINOR',
        location: null,
        keywords,
        confidence: 0.6
      };
    }

    if (aiAnalysis.isEmergency) {
      is_signal4 = true;
    }

    const result = await query(
      `INSERT INTO radio_calls (timestamp, agency, unit, transcript, audio_duration_seconds, is_signal4, audio_url, ai_analysis, detected_keywords, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        timestamp || new Date(), 
        agency || 'HCSO', 
        unit || 'DISPATCH', 
        transcript, 
        audio_duration_seconds || 0, 
        is_signal4,
        audio_url || null,
        JSON.stringify(aiAnalysis),
        aiAnalysis.keywords || [],
        aiAnalysis.confidence || 0.6
      ]
    );

    const radioCall = result.rows[0];

    // Broadcast to all connected clients
    io.emit('radio-call-received', radioCall);

    // If emergency, also broadcast to dispatchers
    if (is_signal4) {
      emitToDispatchers(io, 'signal4-detected', {
        ...radioCall,
        aiAnalysis
      });
    }

    res.status(201).json({ success: true, radio_call: radioCall });
  } catch (error) {
    logger.error('Error creating radio call:', error.message);
    next(error);
  }
});

// POST /api/radio-calls/transcribe - Upload audio and transcribe with Gemini 2.5
router.post('/transcribe', async (req, res, next) => {
  try {
    const { audioBase64, mimeType = 'audio/wav', agency = 'HCSO', unit = 'DISPATCH' } = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'audioBase64 is required' });
    }

    const { transcribeAndAnalyze } = await import('../services/gemini.js');
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    const analysis = await transcribeAndAnalyze(audioBuffer, mimeType);
    
    // Store the result as a radio call
    const result = await query(
      `INSERT INTO radio_calls (timestamp, agency, unit, transcript, audio_duration_seconds, is_signal4, ai_analysis, detected_keywords, confidence, extracted_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        new Date(),
        agency,
        unit,
        analysis.transcript,
        0,
        analysis.isEmergency || false,
        JSON.stringify(analysis),
        analysis.keywords || [],
        analysis.confidence || 0.6,
        analysis.location || null
      ]
    );

    const radioCall = result.rows[0];
    io.emit('radio-call-received', radioCall);

    if (analysis.isEmergency) {
      emitToDispatchers(io, 'signal4-detected', { ...radioCall, aiAnalysis: analysis });
    }

    res.json({ success: true, analysis, radio_call: radioCall });
  } catch (error) {
    logger.error('Transcription error:', error.message);
    next(error);
  }
});

// GET /api/radio-calls/stats/summary - Radio call statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT COUNT(*) as total, 
             COUNT(*) FILTER (WHERE is_signal4 = true) as signal4,
             COUNT(*) FILTER (WHERE is_signal4 = false) as routine
      FROM radio_calls
    `);
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching radio call stats:', error.message);
    next(error);
  }
});

// GET /api/radio-calls/search - Full-text search
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const result = await query(
      `SELECT * FROM radio_calls WHERE transcript ILIKE $1 ORDER BY timestamp DESC`,
      [`%${q}%`]
    );
    res.json({ success: true, radio_calls: result.rows });
  } catch (error) {
    logger.error('Error searching radio calls:', error.message);
    next(error);
  }
});

export default router;
