import express from 'express';
import { query, withTransaction } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT n.id, n.message, n."createdAt", u.username AS "senderUsername" FROM notifications n JOIN users u ON u.id = n.sender_id ORDER BY n."createdAt" DESC LIMIT 50'
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'Notification message is required' });
    if (message.length > 1000) return res.status(400).json({ error: 'Notification message must be 1000 characters or fewer' });
    const rows = await withTransaction(async (client) => {
      const result = await client.query(
        'INSERT INTO notifications (message, sender_id) VALUES ($1, $2) RETURNING id, message, "createdAt"',
        [message, req.userId]
      );
      return result.rows;
    });
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/', authMiddleware, async (req, res, next) => {
  try {
    await query('DELETE FROM notifications');
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
