import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
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

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
    const id = Number(req.params.id);
    if (req.userId !== id && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only access your own profile' });
    const { rows } = await query(`SELECT ${profileFields} FROM users WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(rows[0]);
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
    if (!assignments.length) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(id);
    const { rows } = await query(`UPDATE users SET ${assignments.join(', ')}, "updatedAt" = NOW() WHERE id = $${values.length} RETURNING ${profileFields}`, values);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(rows[0]);
  } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'Username already exists' }); next(error); }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });
    const id = Number(req.params.id);
    if (req.userId !== id && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only delete your own profile' });
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;

