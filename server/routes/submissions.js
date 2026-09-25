import express from 'express';
import { query, withTransaction } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { executeCode } from '../utils/codeExecutor.js';

const router = express.Router();
const id = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const normalizedOutput = (value) => String(value ?? '').replace(/\r\n/g, '\n').trim();

router.post('/test-submit', authMiddleware, async (req, res, next) => {
  try {
    const problemsetId = id(req.body.problemsetId);
    const { code, language } = req.body;
    if (!problemsetId || typeof code !== 'string' || !code.trim() || typeof language !== 'string' || !language.trim()) {
      return res.status(400).json({ error: 'problemsetId, code and language are required' });
    }

    const { rows } = await query('SELECT "testCases" FROM problemsets WHERE id = $1', [problemsetId]);
    if (!rows[0]) return res.status(404).json({ error: 'Problem not found' });
    const testCases = Array.isArray(rows[0].testCases) ? rows[0].testCases : [];
    if (!testCases.length) return res.status(400).json({ error: 'This problem has no test cases yet' });

    const testResults = [];
    for (let index = 0; index < testCases.length; index += 1) {
      const testCase = testCases[index];
      const result = await executeCode(code, language, testCase.input);
      const actualOutput = normalizedOutput(result.output);
      const expectedOutput = normalizedOutput(testCase.output);
      testResults.push({
        testCaseIndex: index + 1,
        passed: result.status === 'accepted' && actualOutput === expectedOutput,
        expectedOutput: testCase.output,
        actualOutput: result.output || '',
        error: result.error || null,
        executionTime: result.executionTime
      });
    }

    const passed = testResults.filter((test) => test.passed).length;
    const total = testResults.length;
    const status = passed === total ? 'ACCEPTED' : 'FAILED';
    const output = testResults.map((test) => `Test ${test.testCaseIndex}: ${test.passed ? 'PASS' : 'FAIL'}\nExpected: ${test.expectedOutput}\nActual: ${test.actualOutput || '(no output)'}`).join('\n\n');
    const executionTime = testResults.reduce((sum, test) => sum + Number(test.executionTime || 0), 0);

    const transactionResult = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO submissions (code, language, status, output, error, "executionTime", "userId", "problemsetId", "testsPassed", "totalTests") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [code, language, status, output, null, executionTime, req.userId, problemsetId, passed, total]
      );

      await client.query(`
        INSERT INTO contest_participation (user_id, contest_id)
        SELECT $1, p.contest_id
        FROM problemsets p
        JOIN contests c ON c.id = p.contest_id
        WHERE p.id = $2
          AND p.contest_id IS NOT NULL
          AND c."startTime" <= NOW()
          AND c."endTime" >= NOW()
        ON CONFLICT (user_id, contest_id) DO NOTHING
      `, [req.userId, problemsetId]);

      if (status === 'ACCEPTED') {
        await client.query(
          `UPDATE users SET "solvedProblems" = (SELECT COUNT(DISTINCT "problemsetId") FROM submissions WHERE "userId" = $1 AND status = 'ACCEPTED') WHERE id = $1`,
          [req.userId]
        );
      }

      return inserted.rows[0];
    });

    res.json({
      testResults,
      summary: { status, passed, total },
      submission: transactionResult
    });
  } catch (error) { next(error); }
});

router.get('/user/:userId', authMiddleware, async (req, res, next) => {
  try {
    const userId = id(req.params.userId); if (!userId) return res.status(400).json({ error: 'Invalid user id' });
    if (userId !== req.userId && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only view your own submissions' });
    const { rows } = await query('SELECT s.*, p.title AS "problemTitle", p.difficulty AS "problemDifficulty" FROM submissions s JOIN problemsets p ON p.id = s."problemsetId" WHERE s."userId" = $1 ORDER BY s."createdAt" DESC', [userId]);
    res.status(200).json(rows);
  } catch (error) { next(error); }
});

router.get('/problem/:problemId', authMiddleware, async (req, res, next) => {
  try {
    const problemId = id(req.params.problemId); if (!problemId) return res.status(400).json({ error: 'Invalid problem id' });
    const { rows } = await query('SELECT * FROM submissions WHERE "userId" = $1 AND "problemsetId" = $2 ORDER BY "createdAt" DESC', [req.userId, problemId]);
    res.status(200).json(rows);
  } catch (error) { next(error); }
});

router.get('/problemset/:problemId', authMiddleware, async (req, res, next) => {
  try {
    const problemId = id(req.params.problemId); if (!problemId) return res.status(400).json({ error: 'Invalid problem id' });
    const { rows } = await query('SELECT * FROM submissions WHERE "userId" = $1 AND "problemsetId" = $2 ORDER BY "createdAt" DESC', [req.userId, problemId]);
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

    const rows = await withTransaction(async (client) => {
      const result = await client.query('INSERT INTO submissions (code, language, status, "userId", "problemsetId") VALUES ($1, $2, $3, $4, $5) RETURNING *', [code, language, 'PENDING', req.userId, problemsetId]);
      await client.query(`
        INSERT INTO contest_participation (user_id, contest_id)
        SELECT $1, p.contest_id
        FROM problemsets p
        JOIN contests c ON c.id = p.contest_id
        WHERE p.id = $2
          AND p.contest_id IS NOT NULL
          AND c."startTime" <= NOW()
          AND c."endTime" >= NOW()
        ON CONFLICT (user_id, contest_id) DO NOTHING
      `, [req.userId, problemsetId]);
      await client.query('INSERT INTO problemset_interaction (user_id, problemset_id, last_interacted_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id, problemset_id) DO UPDATE SET last_interacted_at = NOW()', [req.userId, problemsetId]);
      return result.rows;
    });

    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const submissionId = id(req.params.id); if (!submissionId) return res.status(400).json({ error: 'Invalid submission id' });
    const existing = await query('SELECT "userId" FROM submissions WHERE id = $1', [submissionId]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Submission not found' });
    if (existing.rows[0].userId !== req.userId && req.userRole !== 'ADMIN') return res.status(403).json({ error: 'You may only delete your own submission' });
    await withTransaction(async (client) => {
      const result = await client.query('DELETE FROM submissions WHERE id = $1', [submissionId]);
      if (!result.rowCount) throw Object.assign(new Error('Submission not found'), { status: 404 });
    });
    res.status(204).send();
  } catch (error) { if (error.status === 404) return res.status(404).json({ error: 'Submission not found' }); next(error); }
});

export default router;
