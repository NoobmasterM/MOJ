import { query } from '../db.js';
import { verifyToken } from '../routes/sessionAuth.js';

const tokenFrom = (req) => req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : null);

export const authMiddleware = async (req, res, next) => {
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = verifyToken(token);
    const { rows } = await query(
      `SELECT u.id, u.role, s.id AS session_id FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL AND s.expires_at > NOW()`,
      [payload.sid, Number(payload.sub)]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Session is invalid or expired' });
    req.userId = rows[0].id;
    req.userRole = rows[0].role;
    req.sessionId = rows[0].session_id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

export const requireAdmin = (req, res, next) => req.userRole === 'ADMIN' ? next() : res.status(403).json({ error: 'Admin role required' });

export const requireProblemAuthor = (req, res, next) => ['ADMIN', 'AUTHOR'].includes(req.userRole)
  ? next()
  : res.status(403).json({ error: 'Author or admin role required' });
