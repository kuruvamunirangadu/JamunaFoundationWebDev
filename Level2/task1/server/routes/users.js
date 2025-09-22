// User API routes
import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  console.log('Register endpoint hit', req.body);
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    console.log('Missing required field:', { name, email, password });
    return res.status(400).json({ error: 'Missing required field' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, role || 'user']
    );
    console.log('User inserted:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, 'secretkey');
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
