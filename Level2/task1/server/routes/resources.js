// Resource API routes
import express from 'express';
import pool from '../db.js';
import { authenticateToken, requireRole } from '../middleware.js';

const router = express.Router();

// Get all resources
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get featured resources
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources WHERE featured = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get resource by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create resource (organizer only)
router.post('/', authenticateToken, requireRole('organizer'), async (req, res) => {
  const { title, description, organizer_id, featured } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO resources (title, description, organizer_id, featured) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, organizer_id, featured || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update resource (organizer only)
router.put('/:id', authenticateToken, requireRole('organizer'), async (req, res) => {
  const { title, description, featured } = req.body;
  try {
    const result = await pool.query(
      'UPDATE resources SET title = $1, description = $2, featured = $3 WHERE id = $4 RETURNING *',
      [title, description, featured, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete resource (organizer only)
router.delete('/:id', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM resources WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found' });
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
