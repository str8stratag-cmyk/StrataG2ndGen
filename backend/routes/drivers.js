import express from 'express';
import { query } from '../database.js';
import logger from '../utils/logger.js';
import { emitToDispatchers } from '../websocket.js';
import { io } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/drivers - List all drivers
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, i.case_number as active_incident_case
       FROM drivers d
       LEFT JOIN incidents i ON d.active_incident_id = i.id
       ORDER BY d.status, d.name`
    );
    res.json({ success: true, count: result.rows.length, drivers: result.rows });
  } catch (error) {
    logger.error('Error fetching drivers:', error.message);
    next(error);
  }
});

// GET /api/drivers/:id - Get single driver
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT d.*, i.case_number as active_incident_case
       FROM drivers d
       LEFT JOIN incidents i ON d.active_incident_id = i.id
       WHERE d.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    res.json({ success: true, driver: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching driver:', error.message);
    next(error);
  }
});

// POST /api/drivers - Create new driver
router.post('/', async (req, res, next) => {
  try {
    const { name, callsign, phone, vehicle_type, current_location_lat, current_location_lng, current_location_address } = req.body;
    
    const id = uuidv4();
    const result = await query(
      `INSERT INTO drivers (id, name, callsign, phone, vehicle_type, status, current_location_lat, current_location_lng, current_location_address, completed_dispatches)
       VALUES ($1, $2, $3, $4, $5, 'AVAILABLE', $6, $7, $8, 0) RETURNING *`,
      [id, name, callsign, phone, vehicle_type || 'Tow Truck', current_location_lat || 27.9506, current_location_lng || -82.4572, current_location_address || 'Tampa, FL']
    );

    const driver = result.rows[0];
    io.emit('driver-created', driver);
    
    res.status(201).json({ success: true, driver });
  } catch (error) {
    logger.error('Error creating driver:', error.message);
    next(error);
  }
});

// PATCH /api/drivers/:id/status - Update driver status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, active_incident_id, current_location_lat, current_location_lng, current_location_address } = req.body;

    let updateFields = ['updated_at = NOW()'];
    let params = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (active_incident_id !== undefined) {
      updateFields.push(`active_incident_id = $${paramIndex}`);
      params.push(active_incident_id);
      paramIndex++;
    }
    if (current_location_lat !== undefined) {
      updateFields.push(`current_location_lat = $${paramIndex}`);
      params.push(current_location_lat);
      paramIndex++;
    }
    if (current_location_lng !== undefined) {
      updateFields.push(`current_location_lng = $${paramIndex}`);
      params.push(current_location_lng);
      paramIndex++;
    }
    if (current_location_address) {
      updateFields.push(`current_location_address = $${paramIndex}`);
      params.push(current_location_address);
      paramIndex++;
    }
    
    params.push(id);

    const result = await query(
      `UPDATE drivers SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const driver = result.rows[0];
    io.emit('driver-status-changed', driver);
    emitToDispatchers(io, 'driver-status-changed', driver);

    res.json({ success: true, driver });
  } catch (error) {
    logger.error('Error updating driver status:', error.message);
    next(error);
  }
});

// DELETE /api/drivers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM drivers WHERE id = $1', [id]);
    io.emit('driver-deleted', { id });
    res.json({ success: true, message: 'Driver deleted' });
  } catch (error) {
    logger.error('Error deleting driver:', error.message);
    next(error);
  }
});

export default router;
