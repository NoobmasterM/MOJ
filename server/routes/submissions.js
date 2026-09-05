import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const id = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

router.get('/user/:userId', authMiddleware, async (req, res, next) => {
  try {
    const userId = id(req.params.userId); if (!userId) return res.status(400).json({ error: 'Invalid user id' });
    if (userId !== req.userId && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only view your own submissions' });
    const { rows } = await query('SELECT s.*, p.title AS "problemTitle", p.difficulty AS "problemDifficulty" FROM submissions s JOIN problemsets p ON p.id = s."problemsetId" WHERE s."userId" = $1 ORDER BY s."createdAt" DESC', [userId]);
    res.status(200).json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const submissionId = id(req.params.id); if (!submissionId) return res.status(400).json({ error: 'Invalid submission id' });
    const { rows } = await query('SELECT s.*, p.title AS "problemTitle" FROM submissions s JOIN problemsets p ON p.id = s."problemsetId" WHERE s.id = $1', [submissionId]);
    if (!rows[0]) return res.status(404).json({ error: 'Submission not found' });
    if (rows[0].userId !== req.userId && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only access your own submission' });
    res.status(200).json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const problemsetId = id(req.body.problemsetId);
    const { code, language } = req.body;
    if (!problemsetId || typeof code !== 'string' || !code.trim() || typeof language !== 'string' || !language.trim()) return res.status(400).json({ error: 'problemsetId, code and language are required' });
    const exists = await query('SELECT id FROM problemsets WHERE id = $1', [problemsetId]);
    if (!exists.rowCount) return res.status(404).json({ error: 'Problem not found' });
    const { rows } = await query('INSERT INTO submissions (code, language, status, "userId", "problemsetId") VALUES ($1, $2, $3, $4, $5) RETURNING *', [code, language, 'PENDING', req.userId, problemsetId]);
    await query('INSERT INTO problemset_interaction (user_id, problemset_id) VALUES ($1, $2) ON CONFLICT (user_id, problemset_id) DO UPDATE SET last_interacted_at = NOW()', [req.userId, problemsetId]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const submissionId = id(req.params.id); if (!submissionId) return res.status(400).json({ error: 'Invalid submission id' });
    const existing = await query('SELECT "userId" FROM submissions WHERE id = $1', [submissionId]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Submission not found' });
    if (existing.rows[0].userId !== req.userId && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only delete your own submission' });
    await query('DELETE FROM submissions WHERE id = $1', [submissionId]);
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
