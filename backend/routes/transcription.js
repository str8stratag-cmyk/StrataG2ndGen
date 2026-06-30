import express from 'express';
import { transcribeAndAnalyze } from '../services/gemini.js';
import { query } from '../database.js';
import logger from '../utils/logger.js';
import { io } from '../index.js';
import { emitToDispatchers } from '../websocket.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/transcription/audio - Upload audio and transcribe with Gemini 2.5
// Designed for: V8s audio interface + BM800 mic → designated device → base64 upload
router.post('/audio', async (req, res, next) => {
  try {
    const { audioBase64, mimeType = 'audio/wav', agency = 'HCSO', unit = 'DISPATCH' } = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'audioBase64 is required' });
    }
    
    logger.info('🎙️ Processing live audio from V8s/BM800', { size: audioBase64.length, mimeType });
    
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const analysis = await transcribeAndAnalyze(audioBuffer, mimeType);
    
    // Store in database
    const result = await query(
      `INSERT INTO radio_calls (id, timestamp, agency, unit, transcript, is_signal4, ai_analysis, detected_keywords, confidence, extracted_location, created_at)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
      [
        uuidv4(),
        agency,
        unit,
        analysis.transcript,
        analysis.isEmergency || false,
        JSON.stringify(analysis),
        analysis.keywords || [],
        analysis.confidence || 0.6,
        analysis.location || null
      ]
    );
    
    const radioCall = result.rows[0];
    
    // Broadcast to all clients
    io.emit('radio-call-received', radioCall);
    
    if (analysis.isEmergency) {
      emitToDispatchers(io, 'signal4-detected', {
        ...radioCall,
        aiAnalysis: analysis
      });
      
      // 🚀 AUTO-CREATE INCIDENT for Signal 4
      // Extract location and create incident automatically
      if (analysis.location) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(analysis.location + ', Tampa, FL')}&format=json&limit=1`);
          const geoData = await geoRes.json();
          const lat = geoData[0]?.lat ? parseFloat(geoData[0].lat) : 27.9506;
          const lng = geoData[0]?.lon ? parseFloat(geoData[0].lon) : -82.4572;
          const address = geoData[0]?.display_name || analysis.location;
          
          const incidentRes = await query(
            `INSERT INTO incidents (id, case_number, signal_code, description, location_address, location_lat, location_lng, severity, status, raw_transcript_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UNASSIGNED', $9, NOW()) RETURNING *`,
            [uuidv4(), `INC-${Date.now()}`, 'Signal 4 / 10-50', analysis.transcript, address, lat, lng, analysis.severity || 'CRITICAL', radioCall.id]
          );
          
          const incident = incidentRes.rows[0];
          io.emit('incident-created', incident);
          emitToDispatchers(io, 'incident-created', incident);
          logger.info('🚨 Auto-created incident from Signal 4', { caseNumber: incident.case_number, location: address });
        } catch (geoErr) {
          logger.warn('Could not geocode location, incident created without coordinates', { error: geoErr.message });
        }
      }
    }
    
    res.json({
      success: true,
      transcription: analysis,
      radio_call: radioCall
    });
  } catch (error) {
    logger.error('Transcription endpoint error:', error.message);
    next(error);
  }
});

// POST /api/transcription/analyze-text - Analyze text transcript with Gemini 2.5
router.post('/analyze-text', async (req, res, next) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ success: false, error: 'transcript is required' });
    }
    
    const { analyzeText } = await import('../services/gemini.js');
    const analysis = await analyzeText(transcript);
    
    res.json({ success: true, analysis });
  } catch (error) {
    logger.error('Text analysis error:', error.message);
    next(error);
  }
});

export default router;
