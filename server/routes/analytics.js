import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/leaderboard', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        u.id,
        u.username,
        COALESCE(u.rating, 1200) AS rating,
        COUNT(DISTINCT s."problemsetId") FILTER (WHERE s.status = 'ACCEPTED') AS solved_problems,
        COUNT(s.id) AS total_attempts,
        ROW_NUMBER() OVER (ORDER BY COALESCE(u.rating, 1200) DESC, u.username ASC) AS rank
      FROM users u
      LEFT JOIN submissions s ON s."userId" = u.id
      GROUP BY u.id, u.username, u.rating
      ORDER BY rating DESC, solved_problems DESC, u.username ASC
      LIMIT 20
    `);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/contest-activity', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        c.id,
        c.title,
        COUNT(DISTINCT cp.user_id) AS participants,
        COUNT(DISTINCT s.id) AS submissions,
        COUNT(DISTINCT CASE WHEN s.status = 'ACCEPTED' THEN s.id END) AS accepted_submissions
      FROM contests c
      LEFT JOIN contest_participation cp ON cp.contest_id = c.id
      LEFT JOIN problemsets p ON p.contest_id = c.id
      LEFT JOIN submissions s ON s."problemsetId" = p.id
      GROUP BY c.id, c.title
      ORDER BY c."startTime" DESC
    `);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/problem-performance', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        p.id,
        p.title,
        p.difficulty,
        COUNT(DISTINCT s."userId") AS unique_solvers,
        COUNT(s.id) AS total_attempts,
        ROUND(AVG(CASE WHEN s.status = 'ACCEPTED' THEN 1.0 ELSE 0.0 END) * 100, 2) AS acceptance_rate
      FROM problemsets p
      LEFT JOIN submissions s ON s."problemsetId" = p.id
      GROUP BY p.id, p.title, p.difficulty
      ORDER BY acceptance_rate DESC NULLS LAST, unique_solvers DESC
    `);
    res.json(rows);
  } catch (error) { next(error); }
});

export default router;
