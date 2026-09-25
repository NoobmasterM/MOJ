import express from 'express';
import { query, withTransaction } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const id = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

const parseProblemIds = (value) => {
  const raw = Array.isArray(value) ? value : [];
  return [...new Set(raw.map((entry) => Number(entry)).filter((entry) => Number.isSafeInteger(entry) && entry > 0))];
};

const getContestStatus = (contest) => {
  const now = Date.now();
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return contest.status || 'UPCOMING';
  if (now < startTime) return 'UPCOMING';
  if (now <= endTime) return 'ONGOING';
  return 'FINISHED';
};

const syncContestProblems = async (contestId, problemIds) => {
  const parsedProblemIds = parseProblemIds(problemIds);

  await withTransaction(async (client) => {
    if (parsedProblemIds.length) {
      await client.query(
        `UPDATE problemsets
         SET contest_id = CASE
           WHEN id = ANY($2::int[]) THEN $1
           ELSE NULL
         END
         WHERE contest_id = $1 OR id = ANY($2::int[])`,
        [contestId, parsedProblemIds]
      );
      return;
    }

    await client.query('UPDATE problemsets SET contest_id = NULL WHERE contest_id = $1', [contestId]);
  });
};

const calculateContestStandings = async (contest, options = {}) => {
  const { applyRatings = false } = options;
  const contestId = Number(contest.id);
  const contestStart = new Date(contest.startTime).getTime();
  const contestEnd = new Date(contest.endTime).getTime();

  const { rows: submissions } = await query(`
    SELECT s."userId" AS "userId", s."problemsetId" AS "problemsetId", s.status, s."createdAt" AS "createdAt", u.username
    FROM submissions s
    JOIN problemsets p ON p.id = s."problemsetId"
    JOIN users u ON u.id = s."userId"
    WHERE p.contest_id = $1
      AND s."createdAt" >= $2
      AND s."createdAt" <= $3
    ORDER BY s."createdAt" ASC
  `, [contestId, contest.startTime, contest.endTime]);

  const standingsMap = new Map();

  for (const submission of submissions) {
    const userId = Number(submission.userId);
    const problemId = Number(submission.problemsetId);

    if (!standingsMap.has(userId)) {
      standingsMap.set(userId, {
        userId,
        username: submission.username,
        solved: 0,
        penalty: 0,
        attempts: 0,
        problemStats: {}
      });
    }

    const entry = standingsMap.get(userId);
    entry.attempts += 1;

    if (!entry.problemStats[problemId]) {
      entry.problemStats[problemId] = { wrongAttempts: 0, solved: false };
    }

    if (submission.status === 'ACCEPTED') {
      if (!entry.problemStats[problemId].solved) {
        const acceptedAt = new Date(submission.createdAt).getTime();
        const penaltyMinutes = Math.max(0, Math.floor((acceptedAt - contestStart) / 60000)) + entry.problemStats[problemId].wrongAttempts * 20;
        entry.solved += 1;
        entry.penalty += penaltyMinutes;
        entry.problemStats[problemId].solved = true;
      }
    } else {
      entry.problemStats[problemId].wrongAttempts += 1;
    }
  }

  let standings = Array.from(standingsMap.values())
    .map((entry) => ({
      userId: entry.userId,
      username: entry.username,
      solved: entry.solved,
      penalty: entry.penalty,
      attempts: entry.attempts,
      rating: 0
    }))
    .sort((a, b) => b.solved - a.solved || a.penalty - b.penalty || a.userId - b.userId);

  const userIds = standings.map((entry) => entry.userId);
  const userRatingRows = userIds.length ? await query('SELECT id, COALESCE(rating, 1200) AS rating FROM users WHERE id = ANY($1::int[])', [userIds]) : { rows: [] };
  const ratingMap = new Map(userRatingRows.rows.map((user) => [Number(user.id), Number(user.rating)]));

  if (applyRatings) {
    const averageRating = userIds.length ? userIds.reduce((sum, userId) => sum + (ratingMap.get(userId) ?? 1200), 0) / userIds.length : 1200;

    await withTransaction(async (client) => {
      for (let index = 0; index < standings.length; index += 1) {
        const entry = standings[index];
        const userRating = ratingMap.get(entry.userId) ?? 1200;
        const expected = standings.length === 1 ? 1 : 1 / (1 + 10 ** ((averageRating - userRating) / 400));
        const actual = standings.length === 1 ? 1 : 1 - (index / (standings.length - 1));
        const delta = Math.round(32 * (actual - expected));
        const nextRating = Math.max(0, userRating + delta);
        ratingMap.set(entry.userId, nextRating);
        entry.ratingBefore = userRating;
        entry.ratingChange = nextRating - userRating;
        entry.rating = nextRating;
        await client.query('UPDATE users SET rating = $2 WHERE id = $1', [entry.userId, nextRating]);
      }

      await client.query('UPDATE contests SET "ratingUpdatedAt" = NOW() WHERE id = $1', [contestId]);
    });
  } else {
    for (const entry of standings) {
      entry.rating = Number(ratingMap.get(entry.userId) ?? 1200);
    }
  }

  return standings.map((entry, index) => ({ ...entry, rank: index + 1 }));
};

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM contests ORDER BY "startTime" DESC');
    for (const contest of rows) {
      const nextStatus = getContestStatus(contest);
      if (contest.status !== nextStatus) {
        await query('UPDATE contests SET status = $1, "updatedAt" = NOW() WHERE id = $2', [nextStatus, contest.id]);
      }
      contest.status = nextStatus;
    }
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const contestId = id(req.params.id);
    if (!contestId) return res.status(400).json({ error: 'Invalid contest id' });

    const { rows } = await query('SELECT * FROM contests WHERE id = $1', [contestId]);
    if (!rows[0]) return res.status(404).json({ error: 'Contest not found' });

    const contest = rows[0];
    const nextStatus = getContestStatus(contest);
    if (contest.status !== nextStatus) {
      await query('UPDATE contests SET status = $1, "updatedAt" = NOW() WHERE id = $2', [nextStatus, contestId]);
      contest.status = nextStatus;
    }

    const problems = await query('SELECT id,title,difficulty,"editorialRating" FROM problemsets WHERE contest_id=$1 ORDER BY id', [contestId]);
    const standings = await calculateContestStandings({ ...contest, status: nextStatus });

    res.json({ ...contest, status: nextStatus, problemsets: problems.rows, standings });
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { title, startTime, endTime, problemIds } = req.body;
    if (!title?.trim() || !startTime || !endTime || Number.isNaN(Date.parse(startTime)) || Number.isNaN(Date.parse(endTime))) return res.status(400).json({ error: 'title, valid startTime and endTime are required' });
    if (Date.parse(endTime) <= Date.parse(startTime)) return res.status(400).json({ error: 'endTime must be after startTime' });
    const parsedProblemIds = parseProblemIds(problemIds);
    const rows = await withTransaction(async (client) => {
      const result = await client.query('INSERT INTO contests (title,description,"startTime","endTime",status,"updatedAt") VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *', [title.trim(), req.body.description?.trim() || '', new Date(startTime), new Date(endTime), Date.parse(startTime) > Date.now() ? 'UPCOMING' : 'ONGOING']);
      const contestId = result.rows[0].id;
      if (parsedProblemIds.length) {
        await client.query(
          `UPDATE problemsets SET contest_id = CASE WHEN id = ANY($2::int[]) THEN $1 ELSE NULL END WHERE contest_id = $1 OR id = ANY($2::int[])`,
          [contestId, parsedProblemIds]
        );
      } else {
        await client.query('UPDATE problemsets SET contest_id = NULL WHERE contest_id = $1', [contestId]);
      }
      return result.rows;
    });
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const contestId = id(req.params.id);
    if (!contestId) return res.status(400).json({ error: 'Invalid contest id' });
    const { title, description, startTime, endTime, problemIds } = req.body;
    if (!title?.trim() || !startTime || !endTime || Number.isNaN(Date.parse(startTime)) || Number.isNaN(Date.parse(endTime))) return res.status(400).json({ error: 'title, valid startTime and endTime are required' });
    if (Date.parse(endTime) <= Date.parse(startTime)) return res.status(400).json({ error: 'endTime must be after startTime' });
    const now = Date.now();
    const start = Date.parse(startTime);
    const end = Date.parse(endTime);
    const status = now < start ? 'UPCOMING' : now <= end ? 'ONGOING' : 'FINISHED';
    const parsedProblemIds = parseProblemIds(problemIds);
    const rows = await withTransaction(async (client) => {
      const result = await client.query('UPDATE contests SET title=$1,description=$2,"startTime"=$3,"endTime"=$4,status=$5,"ratingUpdatedAt"=NULL,"updatedAt"=NOW() WHERE id=$6 RETURNING *', [title.trim(), description?.trim() || '', new Date(startTime), new Date(endTime), status, contestId]);
      if (!result.rowCount) throw Object.assign(new Error('Contest not found'), { status: 404 });
      if (parsedProblemIds.length) {
        await client.query(
          `UPDATE problemsets SET contest_id = CASE WHEN id = ANY($2::int[]) THEN $1 ELSE NULL END WHERE contest_id = $1 OR id = ANY($2::int[])`,
          [contestId, parsedProblemIds]
        );
      } else {
        await client.query('UPDATE problemsets SET contest_id = NULL WHERE contest_id = $1', [contestId]);
      }
      return result.rows;
    });
    res.json(rows[0]);
  } catch (error) { if (error.status === 404) return res.status(404).json({ error: 'Contest not found' }); next(error); }
});

router.post('/:id/participation', authMiddleware, async (req, res, next) => {
  try {
    const contestId = id(req.params.id);
    if (!contestId) return res.status(400).json({ error: 'Invalid contest id' });
    const contest = await query('SELECT id FROM contests WHERE id=$1', [contestId]);
    if (!contest.rowCount) return res.status(404).json({ error: 'Contest not found' });
    await withTransaction(async (client) => {
      await client.query('INSERT INTO contest_participation (user_id, contest_id) VALUES ($1,$2) ON CONFLICT (user_id,contest_id) DO NOTHING', [req.userId, contestId]);
      await client.query('UPDATE users SET "contestsParticipated" = (SELECT COUNT(*) FROM contest_participation WHERE user_id = $1) WHERE id = $1', [req.userId]);
    });
    res.status(201).json({ message: 'Contest participation recorded' });
  } catch (error) { next(error); }
});

router.post('/:id/apply-ratings', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const contestId = id(req.params.id);
    if (!contestId) return res.status(400).json({ error: 'Invalid contest id' });

    const { rows } = await query('SELECT * FROM contests WHERE id = $1', [contestId]);
    if (!rows[0]) return res.status(404).json({ error: 'Contest not found' });

    const contest = rows[0];
    const status = getContestStatus(contest);
    if (status !== 'FINISHED') return res.status(400).json({ error: 'Contest ratings can only be applied after the contest has finished.' });

    if (contest.ratingUpdatedAt && new Date(contest.ratingUpdatedAt).getTime() >= new Date(contest.endTime).getTime()) {
      return res.status(409).json({ error: 'Contest ratings have already been applied.' });
    }

    const standings = await calculateContestStandings({ ...contest, status }, { applyRatings: true });
    res.json({ message: 'Contest ratings applied.', standings });
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const contestId = id(req.params.id);
    if (!contestId) return res.status(400).json({ error: 'Invalid contest id' });
    await withTransaction(async (client) => {
      const result = await client.query('DELETE FROM contests WHERE id=$1', [contestId]);
      if (!result.rowCount) throw Object.assign(new Error('Contest not found'), { status: 404 });
    });
    res.status(204).send();
  } catch (error) { if (error.status === 404) return res.status(404).json({ error: 'Contest not found' }); next(error); }
});

export default router;
