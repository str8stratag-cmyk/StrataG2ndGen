import express from 'express';
import { query } from '../database.js';
import logger from '../utils/logger.js';
import { sendDispatchAlert } from '../services/vonage.js';
import { emitToDispatchers, emitToIncidentRoom } from '../websocket.js';
import { io } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/incidents - List all incidents
router.get('/', async (req, res, next) => {
  try {
    const { status, severity, limit = 100, offset = 0 } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (severity) {
      whereClause += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    const result = await query(
      `SELECT i.*, d.name as driver_name, d.callsign as driver_callsign, d.phone as driver_phone
       FROM incidents i
       LEFT JOIN drivers d ON i.assigned_driver_id = d.id
       ${whereClause} 
       ORDER BY i.created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, count: result.rows.length, incidents: result.rows });
  } catch (error) {
    logger.error('Error fetching incidents:', error.message);
    next(error);
  }
});

// GET /api/incidents/:id - Get single incident
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT i.*, d.name as driver_name, d.callsign as driver_callsign, d.phone as driver_phone,
              d.current_location_lat as driver_lat, d.current_location_lng as driver_lng
       FROM incidents i
       LEFT JOIN drivers d ON i.assigned_driver_id = d.id
       WHERE i.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    res.json({ success: true, incident: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching incident:', error.message);
    next(error);
  }
});

// POST /api/incidents - Create new incident
router.post('/', async (req, res, next) => {
  try {
    const {
      case_number, signal_code, description, location_address, location_lat, location_lng,
      vehicles_involved = 2, injuries_reported = false, hazmat_or_blocking = false,
      severity = 'MAJOR', status = 'UNASSIGNED', raw_transcript_id
    } = req.body;

    const id = uuidv4();
    const result = await query(
      `INSERT INTO incidents (id, case_number, signal_code, description, location_address, location_lat, location_lng,
        vehicles_involved, injuries_reported, hazmat_or_blocking, severity, status, raw_transcript_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [id, case_number || `INC-${Date.now()}`, signal_code, description, location_address, location_lat, location_lng,
       vehicles_involved, injuries_reported, hazmat_or_blocking, severity, status, raw_transcript_id]
    );

    const incident = result.rows[0];
    io.emit('incident-created', incident);
    emitToDispatchers(io, 'incident-created', incident);
    
    res.status(201).json({ success: true, incident });
  } catch (error) {
    logger.error('Error creating incident:', error.message);
    next(error);
  }
});

// PATCH /api/incidents/:id/status - Update incident status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await query(
      `UPDATE incidents SET status = $1, updated_at = NOW() ${notes ? ', notes = array_append(notes, $3)' : ''}
       WHERE id = $2 RETURNING *`,
      notes ? [status, id, notes] : [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const incident = result.rows[0];
    io.emit('incident-updated', incident);
    emitToIncidentRoom(io, id, 'incident-updated', incident);

    res.json({ success: true, incident });
  } catch (error) {
    logger.error('Error updating incident status:', error.message);
    next(error);
  }
});

// POST /api/incidents/:id/dispatch - Dispatch incident to driver
router.post('/:id/dispatch', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    // Get incident and driver
    const incidentResult = await query('SELECT * FROM incidents WHERE id = $1', [id]);
    const driverResult = await query('SELECT * FROM drivers WHERE id = $1', [driver_id]);

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const incident = incidentResult.rows[0];
    const driver = driverResult.rows[0];

    // Calculate distance and ETA
    const distance = calculateDistance(
      driver.current_location_lat, driver.current_location_lng,
      incident.location_lat, incident.location_lng
    );
    const etaMinutes = Math.round((distance / 25) * 60); // Assume 25 mph avg

    // Update incident
    const updateResult = await query(
      `UPDATE incidents SET status = 'DISPATCHED', assigned_driver_id = $1, dispatched_at = NOW(), 
       distance_miles = $2, eta_minutes = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [driver_id, distance, etaMinutes, id]
    );

    // Update driver status
    await query(
      `UPDATE drivers SET status = 'EN_ROUTE', active_incident_id = $1, updated_at = NOW() WHERE id = $2`,
      [id, driver_id]
    );

    const updatedIncident = updateResult.rows[0];

    // Send SMS via Vonage
    try {
      await sendDispatchAlert(
        driver.phone,
        driver.name,
        incident.location_address,
        incident.case_number,
        distance,
        etaMinutes
      );
    } catch (err) {
      logger.warn('SMS dispatch failed', { error: err.message, driver: driver.id });
    }

    io.emit('incident-dispatched', updatedIncident);
    emitToDispatchers(io, 'incident-dispatched', updatedIncident);
    emitToIncidentRoom(io, id, 'incident-dispatched', updatedIncident);

    res.json({ success: true, incident: updatedIncident });
  } catch (error) {
    logger.error('Error dispatching incident:', error.message);
    next(error);
  }
});

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default router;
