import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
const secret = JWT_SECRET || 'development-only-secret-change-me';
const SESSION_DAYS = 7;

export async function createSession(userId) {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await query('INSERT INTO auth_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [id, userId, expiresAt]);
  return jwt.sign({ sub: String(userId), sid: id }, secret, { expiresIn: `${SESSION_DAYS}d` });
}

export const verifyToken = (token) => jwt.verify(token, secret);
export const revokeSession = (id) => query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL', [id]);
