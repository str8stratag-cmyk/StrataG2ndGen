import express from 'express';
import { query } from '../database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/analytics/dashboard - Main dashboard KPIs
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [incidentsStats, driversStats, radioStats, recentActivity] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_incidents,
          COUNT(*) FILTER (WHERE status = 'CLEARED') as cleared,
          COUNT(*) FILTER (WHERE status = 'DISPATCHED') as dispatched,
          COUNT(*) FILTER (WHERE status = 'UNASSIGNED') as unassigned,
          COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical,
          COUNT(*) FILTER (WHERE created_at >= $1) as today_count
        FROM incidents
      `, [today]),
      
      query(`
        SELECT 
          COUNT(*) as total_drivers,
          COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available,
          COUNT(*) FILTER (WHERE status = 'EN_ROUTE') as en_route,
          COUNT(*) FILTER (WHERE status = 'ON_SCENE') as on_scene,
          COUNT(*) FILTER (WHERE status = 'OFF_DUTY') as off_duty
        FROM drivers
      `),
      
      query(`
        SELECT 
          COUNT(*) as total_calls,
          COUNT(*) FILTER (WHERE is_signal4 = true) as signal4_calls,
          COUNT(*) FILTER (WHERE created_at >= $1) as today_calls
        FROM radio_calls
      `, [today]),
      
      query(`
        SELECT id, case_number, status, severity, created_at, location_address
        FROM incidents
        ORDER BY created_at DESC
        LIMIT 5
      `)
    ]);
    
    res.json({
      success: true,
      incidents: incidentsStats.rows[0],
      drivers: driversStats.rows[0],
      radio: radioStats.rows[0],
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    logger.error('Analytics dashboard error:', error.message);
    next(error);
  }
});

// GET /api/analytics/performance - Shift performance metrics
router.get('/performance', async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as incidents,
        COUNT(*) FILTER (WHERE status = 'CLEARED') as cleared,
        AVG(EXTRACT(EPOCH FROM (dispatched_at - created_at))/60) as avg_response_time_minutes
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({ success: true, performance: result.rows });
  } catch (error) {
    logger.error('Performance analytics error:', error.message);
    next(error);
  }
});

export default router;
