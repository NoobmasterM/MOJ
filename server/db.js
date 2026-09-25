import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in server/.env');
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, values = []) => pool.query(text, values);

export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const ensureSchema = async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS contests (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      "startTime" TIMESTAMP NOT NULL,
      "endTime" TIMESTAMP NOT NULL,
      status TEXT NOT NULL DEFAULT 'UPCOMING',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS contest_participation (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, contest_id)
    )`,
    `CREATE TABLE IF NOT EXISTS problemset_interaction (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problemset_id INTEGER NOT NULL REFERENCES problemsets(id) ON DELETE CASCADE,
      last_interacted_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, problemset_id)
    )`,
    `CREATE TABLE IF NOT EXISTS auth_sessions (
      id UUID PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP NULL
    )`,
    `CREATE TABLE IF NOT EXISTS submission_audit (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problemset_id INTEGER NOT NULL REFERENCES problemsets(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
      status TEXT,
      occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS "ratingFill" INTEGER',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS "ratingColor" TEXT',
    'ALTER TABLE contests ADD COLUMN IF NOT EXISTS "ratingUpdatedAt" TIMESTAMP',
    'ALTER TABLE blogs ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE blogs ADD COLUMN IF NOT EXISTS dislikes INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE problemsets ADD COLUMN IF NOT EXISTS contest_id INTEGER',
    `ALTER TABLE problemsets
      ADD CONSTRAINT problemsets_contest_id_fkey
      FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE SET NULL ON UPDATE CASCADE`,
    'CREATE INDEX IF NOT EXISTS problemsets_contest_idx ON problemsets (contest_id)',
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT
    )`,
    'CREATE INDEX IF NOT EXISTS notifications_createdAt_idx ON notifications ("createdAt" DESC)',
    `CREATE OR REPLACE FUNCTION sync_user_submission_stats()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        UPDATE users
        SET "solvedProblems" = (
              SELECT COUNT(DISTINCT "problemsetId")
              FROM submissions
              WHERE "userId" = COALESCE(NEW."userId", OLD."userId")
                AND status = 'ACCEPTED'
            ),
            "contestsParticipated" = (
              SELECT COUNT(*)
              FROM contest_participation
              WHERE user_id = COALESCE(NEW."userId", OLD."userId")
            ),
            "updatedAt" = NOW()
        WHERE id = COALESCE(NEW."userId", OLD."userId");

        INSERT INTO submission_audit (user_id, problemset_id, action, status, occurred_at)
        VALUES (
          COALESCE(NEW."userId", OLD."userId"),
          COALESCE(NEW."problemsetId", OLD."problemsetId"),
          TG_OP,
          COALESCE(NEW.status, OLD.status),
          NOW()
        );

        RETURN COALESCE(NEW, OLD);
      END;
      $$`,
    `DROP TRIGGER IF EXISTS trg_sync_user_submission_stats ON submissions;`,
    `CREATE TRIGGER trg_sync_user_submission_stats
      AFTER INSERT OR UPDATE OF status, "userId", "problemsetId" OR DELETE ON submissions
      FOR EACH ROW
      EXECUTE FUNCTION sync_user_submission_stats();`,
    `CREATE OR REPLACE FUNCTION get_user_rating_snapshot(p_user_id INTEGER)
      RETURNS TABLE (
        user_id INTEGER,
        username TEXT,
        solved_count INTEGER,
        contest_count INTEGER,
        current_rating INTEGER
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          u.id::INTEGER AS user_id,
          u.username,
          COUNT(DISTINCT s."problemsetId") FILTER (WHERE s.status = 'ACCEPTED')::INTEGER AS solved_count,
          COUNT(DISTINCT cp.contest_id)::INTEGER AS contest_count,
          COALESCE(u.rating, 1200)::INTEGER AS current_rating
        FROM users u
        LEFT JOIN submissions s ON s."userId" = u.id AND s.status = 'ACCEPTED'
        LEFT JOIN contest_participation cp ON cp.user_id = u.id
        WHERE u.id = p_user_id
        GROUP BY u.id, u.username, u.rating;
      END;
      $$`,
    `CREATE OR REPLACE PROCEDURE register_submission_attempt(
        p_user_id INTEGER,
        p_problemset_id INTEGER,
        p_code TEXT,
        p_language TEXT,
        p_status TEXT,
        p_output TEXT,
        p_error TEXT,
        p_execution_time NUMERIC,
        p_tests_passed INTEGER,
        p_total_tests INTEGER
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        INSERT INTO submissions (code, language, status, output, error, "executionTime", "userId", "problemsetId", "testsPassed", "totalTests")
        VALUES (p_code, p_language, p_status, p_output, p_error, p_execution_time, p_user_id, p_problemset_id, p_tests_passed, p_total_tests);

        INSERT INTO contest_participation (user_id, contest_id)
        SELECT p_user_id, p.contest_id
        FROM problemsets p
        JOIN contests c ON c.id = p.contest_id
        WHERE p.id = p_problemset_id
          AND p.contest_id IS NOT NULL
          AND c."startTime" <= NOW()
          AND c."endTime" >= NOW()
        ON CONFLICT (user_id, contest_id) DO NOTHING;

        INSERT INTO problemset_interaction (user_id, problemset_id, last_interacted_at)
        VALUES (p_user_id, p_problemset_id, NOW())
        ON CONFLICT (user_id, problemset_id)
        DO UPDATE SET last_interacted_at = NOW();
      END;
      $$`
  ];

  for (const statement of statements) {
    try {
      await query(statement);
    } catch (error) {
      const ignoredCodes = new Set(['42710', '42701', '42P07', '23505', '42703', '2BP01', '42P01']);
      if (!ignoredCodes.has(String(error?.code))) {
        throw error;
      }
    }
  }
};
