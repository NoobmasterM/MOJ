import express from 'express';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const validId = (id) => Number.isSafeInteger(Number(id)) && Number(id) > 0;
const profileFields = 'id, email, username, role, "profilePic", rating, "ratingFill", "ratingColor", "solvedProblems", "contestsParticipated", "createdAt", "updatedAt"';

router.get('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT ${profileFields} FROM users ORDER BY id`);
    res.status(200).json(rows);
  } catch (error) { next(error); }
});

router.get('/rankings', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT username, COALESCE(rating, 0) AS rating, "ratingFill", "ratingColor" FROM users ORDER BY rating DESC, username ASC');
    res.status(200).json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
    const id = Number(req.params.id);
    if (req.userId !== id && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only access your own profile' });
    const { rows: userRows } = await query(`SELECT ${profileFields} FROM users WHERE id = $1`, [id]);
    if (!userRows[0]) return res.status(404).json({ error: 'User not found' });

    const { rows: submissionRows } = await query(`
      SELECT s.*, p.id AS "problemId", p.title AS "problemTitle", p.difficulty AS "problemDifficulty"
      FROM submissions s
      JOIN problemsets p ON p.id = s."problemsetId"
      WHERE s."userId" = $1
      ORDER BY s."createdAt" DESC
    `, [id]);

    const user = userRows[0];
    user.submissions = submissionRows.map((submission) => ({
      ...submission,
      problemset: {
        id: submission.problemId,
        title: submission.problemTitle,
        difficulty: submission.problemDifficulty
      }
    }));

    res.status(200).json(user);
  } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
    const id = Number(req.params.id);
    if (req.userId !== id && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only update your own profile' });

    const existingUser = await query(`SELECT id, username, role FROM users WHERE id = $1`, [id]);
    if (!existingUser.rows[0]) return res.status(404).json({ error: 'User not found' });
    if (existingUser.rows[0].username === 'NoobmasterM' && req.body.role && req.body.role !== existingUser.rows[0].role) {
      return res.status(403).json({ error: 'NoobmasterM role cannot be changed' });
    }

    const allowed = ['username', 'profilePic'];
    const values = [], assignments = [];
    for (const field of allowed) if (typeof req.body[field] === 'string' && req.body[field].trim()) { values.push(req.body[field].trim()); assignments.push(`"${field}" = $${values.length}`); }
    if (typeof req.body.password === 'string') { if (req.body.password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters' }); values.push(await bcrypt.hash(req.body.password, 12)); assignments.push(`password = $${values.length}`); }
    if (req.userRole === 'ADMIN' && req.body.role && ['USER', 'AUTHOR', 'ADMIN'].includes(req.body.role)) { values.push(req.body.role); assignments.push(`role = $${values.length}::"Role"`); }
    if (req.userRole === 'ADMIN' && req.body.rating !== undefined) { const rating = Number(req.body.rating); if (!Number.isInteger(rating) || rating < 0) return res.status(400).json({ error: 'rating must be a non-negative integer' }); values.push(rating); assignments.push(`rating = $${values.length}`); }
    if (req.userRole === 'ADMIN' && req.body.ratingFill !== undefined) { const fill = Number(req.body.ratingFill); if (!Number.isInteger(fill) || fill < 0 || fill > 100) return res.status(400).json({ error: 'ratingFill must be an integer from 0 to 100' }); values.push(fill); assignments.push(`"ratingFill" = $${values.length}`); }
    if (req.userRole === 'ADMIN' && req.body.ratingColor !== undefined) { const color = typeof req.body.ratingColor === 'string' ? req.body.ratingColor.trim() : ''; if (!/^[a-z]+$/i.test(color)) return res.status(400).json({ error: 'ratingColor must be a named color' }); values.push(color); assignments.push(`"ratingColor" = $${values.length}`); }
    if (!assignments.length) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(id);

    const user = await withTransaction(async (client) => {
      const { rows } = await client.query(`UPDATE users SET ${assignments.join(', ')}, "updatedAt" = NOW() WHERE id = $${values.length} RETURNING ${profileFields}`, values);
      return rows[0];
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'Username already exists' }); next(error); }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
    const id = Number(req.params.id);
    if (req.userId !== id && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only delete your own profile' });

    await withTransaction(async (client) => {
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      if (!result.rowCount) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
    });

    res.status(204).send();
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: 'User not found' });
    next(error);
  }
});

export default router;

