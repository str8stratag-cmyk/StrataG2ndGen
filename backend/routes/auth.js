import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database.js';
import { config } from '../config.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/auth/login - Admin login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    // For demo/development, check env admin credentials
    if (email === config.adminEmail && password === config.adminPassword) {
      const token = jwt.sign(
        { email, role: 'admin' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      return res.json({ success: true, token, user: { email, role: 'admin' } });
    }
    
    // Check database users
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    logger.error('Login error:', error.message);
    next(error);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
});

// Middleware to authenticate JWT
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export default router;
