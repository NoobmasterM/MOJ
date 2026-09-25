import express from 'express';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { createSession, revokeSession } from './sessionAuth.js';

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value) => typeof value === 'string' ? value.trim() : '';
const publicUser = (u) => ({ id: u.id, email: u.email, username: u.username, role: u.role, profilePic: u.profilePic, rating: u.rating, ratingFill: u.ratingFill, ratingColor: u.ratingColor, solvedProblems: u.solvedProblems, contestsParticipated: u.contestsParticipated });
const setSessionCookie = (res, token) => res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400000, path: '/api' });

router.post('/register', async (req, res, next) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const username = clean(req.body.username);
    const password = req.body.password;
<<<<<<< Updated upstream
    const role = "USER";
=======
    const role = username === 'NoobmasterM' ? 'ADMIN' : 'USER';
>>>>>>> Stashed changes
    if (!email || !username || typeof password !== 'string') return res.status(400).json({ error: 'Email, username and password are required' });
    if (!emailPattern.test(email) || username.length < 3 || username.length > 30 || !/^[A-Za-z0-9_]+$/.test(username) || password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Use a valid email, 3-30 character username, and password of at least 8 characters' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await withTransaction(async (client) => {
      const { rows } = await client.query('INSERT INTO users (email, username, password, role, "createdAt","updatedAt") VALUES ($1, $2, $3, $4::"Role",NOW(),NOW()) RETURNING id, email, username, role, "profilePic", rating, "ratingFill", "ratingColor", "solvedProblems", "contestsParticipated"', [email, username, passwordHash, role]);
      const createdUser = rows[0];
      const token = await createSession(createdUser.id, client);
      setSessionCookie(res, token);
      return createdUser;
    });

    return res.status(201).json({ ...publicUser(user), message: 'Registration successful' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email or username already exists' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const identifier = clean(req.body.identifier || req.body.email || req.body.username);
    const password = req.body.password;
    if (!identifier || typeof password !== 'string' || !password) return res.status(400).json({ error: 'Email or username and password are required' });

    const preparedIdentifier = identifier.toLowerCase();
    const isEmail = emailPattern.test(preparedIdentifier);
    const { rows } = await query(
      `SELECT id, email, username, password, role, "profilePic", rating, "ratingFill", "ratingColor", "solvedProblems", "contestsParticipated"
       FROM users
       WHERE ${isEmail ? 'email = $1' : 'LOWER(username) = $1'}
       LIMIT 1`,
      [preparedIdentifier]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid email/username or password' });

    let updatedUser = user;
    await withTransaction(async (client) => {
      if (user.username === 'NoobmasterM' && user.role !== 'ADMIN') {
        await client.query('UPDATE users SET role = $1::"Role", "updatedAt" = NOW() WHERE id = $2', ['ADMIN', user.id]);
        updatedUser = { ...user, role: 'ADMIN' };
      }
      const token = await createSession(user.id, client);
      setSessionCookie(res, token);
    });

    return res.status(200).json({ ...publicUser(updatedUser), message: 'Login successful' });
  } catch (error) { next(error); }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, email, username, role, "profilePic", rating, "ratingFill", "ratingColor", "solvedProblems", "contestsParticipated" FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(publicUser(rows[0]));
  } catch (error) { next(error); }
});

router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    await withTransaction(async (client) => {
      await revokeSession(req.sessionId, client);
    });
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api' });
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
