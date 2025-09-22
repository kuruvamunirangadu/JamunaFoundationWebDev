// Application API routes
import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import { authenticateToken, requireRole } from '../middleware.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Set up multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all applications for a user (user only, must match logged-in user)
router.get('/user/:user_id', authenticateToken, (req, res) => {
  if (parseInt(req.params.user_id) !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  pool.query('SELECT * FROM applications WHERE user_id = $1', [req.params.user_id])
    .then(result => res.json(result.rows))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Get all applications for a resource (organizer only)
router.get('/resource/:resource_id', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM applications WHERE resource_id = $1', [req.params.resource_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit application with resume upload (user only)
router.post('/', authenticateToken, upload.single('resume'), async (req, res) => {
  const { resource_id } = req.body;
  const user_id = req.user.id;
  const resume_url = req.file ? req.file.path : null;
  try {
    const result = await pool.query(
      'INSERT INTO applications (user_id, resource_id, resume_url) VALUES ($1, $2, $3) RETURNING *',
      [user_id, resource_id, resume_url]
    );

    // Fetch resource and organizer email
    const resourceRes = await pool.query('SELECT * FROM resources WHERE id = $1', [resource_id]);
    const resource = resourceRes.rows[0];
    if (resource && resource.organizer_id) {
      const orgRes = await pool.query('SELECT * FROM users WHERE id = $1', [resource.organizer_id]);
      const organizer = orgRes.rows[0];
      if (organizer && organizer.email) {
        // Send email notification
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.NOTIFY_EMAIL,
            pass: process.env.NOTIFY_EMAIL_PASS
          }
        });
        const mailOptions = {
          from: process.env.NOTIFY_EMAIL,
          to: organizer.email,
          subject: 'New Application Received',
          text: `A new application has been submitted for your resource: ${resource.title}.`
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Email error:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update application status (organizer only)
router.put('/:id', authenticateToken, requireRole('organizer'), async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
