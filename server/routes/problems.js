import express from 'express';
import { query, withTransaction } from '../db.js';
import { authMiddleware, requireAdmin, requireProblemAuthor } from '../middleware/auth.js';

const router = express.Router();
const numericId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const text = (value, max = 10000) => typeof value === 'string' && value.trim().length <= max ? value.trim() : null;
const difficultyValid = (value) => ['EASY', 'MEDIUM', 'HARD'].includes(value);

function validateCases(cases, field) {
  if (!Array.isArray(cases)) return `${field} must be an array`;

  for (let index = 0; index < cases.length; index += 1) {
    const item = cases[index];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return `${field}[${index}] must be an object`;
    if (typeof item.input !== 'string' || typeof item.output !== 'string') return `${field}[${index}] must include text input and output`;

    const allowed = field === 'examples' ? ['input', 'output', 'explanation'] : ['input', 'output'];
    if (Object.keys(item).some((key) => !allowed.includes(key))) return `${field}[${index}] contains an unsupported field`;
    if (field === 'examples' && item.explanation !== undefined && typeof item.explanation !== 'string') return `examples[${index}].explanation must be text`;
  }

  return null;
}

function problemInput(body, partial = false) {
  const result = {};
  for (const [field, max] of [['title', 200], ['description', 20000], ['input', 10000], ['output', 10000], ['notes', 10000], ['constraints', 10000], ['editorial', 30000], ['discussion', 30000]]) {
    if (body[field] !== undefined) { const value = text(body[field], max); if (value === null) return { error: `${field} must be a text value within its size limit` }; result[field] = value; }
  }
  if (!partial && (!result.title || !result.description || !difficultyValid(body.difficulty))) return { error: 'title, description and a valid difficulty are required' };
  if (body.difficulty !== undefined) { if (!difficultyValid(body.difficulty)) return { error: 'difficulty must be EASY, MEDIUM, or HARD' }; result.difficulty = body.difficulty; }
  for (const field of ['testCases', 'examples']) if (body[field] !== undefined) {
    const error = validateCases(body[field], field);
    if (error) return { error };
    result[field] = body[field];
  }
  if (body.tags !== undefined) { if (!Array.isArray(body.tags)) return { error: 'tags must be an array' }; result.tags = body.tags; }
  if (body.archived !== undefined) { result.archived = body.archived === true || body.archived === 'true' || body.archived === 1 || body.archived === '1'; }
  for (const field of ['timeLimit', 'memoryLimit']) if (body[field] !== undefined) { const value = Number(body[field]); if (!Number.isInteger(value) || value <= 0) return { error: `${field} must be a positive integer` }; result[field] = value; }
  if (body.editorialRating !== undefined) { const value = Number(body.editorialRating); if (!Number.isInteger(value) || value < 0) return { error: 'editorialRating must be a non-negative integer' }; result.editorialRating = value; }
  if (body.editorialFill !== undefined) { const value = Number(body.editorialFill); if (!Number.isInteger(value) || value < 0 || value > 100) return { error: 'editorialFill must be an integer from 0 to 100' }; result.editorialFill = value; }
  if (body.editorialColor !== undefined) { const value = text(body.editorialColor, 50); if (!value || !(/^[a-z]+$/i.test(value) || /^#[0-9a-f]{3,8}$/i.test(value))) return { error: 'editorialColor must be a named color or hex value' }; result.editorialColor = value; }
  return { value: result };
}

router.get('/', async (req, res, next) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const whereClause = includeArchived ? '' : 'WHERE COALESCE(p.archived, false) = false';
    const { rows } = await query(`
      SELECT
        p.id,
        p.title,
        p.difficulty,
        p."editorialRating",
        p."editorialFill",
        p."editorialColor",
        p.contest_id AS "contestId",
        p.created_by AS "createdBy",
        u.username AS "authorUsername",
        p.tags,
        p.archived,
        p."createdAt",
        p."updatedAt",
        COUNT(DISTINCT s."userId") FILTER (WHERE s.status = 'ACCEPTED') AS "solvedCount"
      FROM problemsets p
      LEFT JOIN users u ON u.id = p.created_by
      LEFT JOIN submissions s ON s."problemsetId" = p.id AND s.status = 'ACCEPTED'
      ${whereClause}
      GROUP BY p.id, u.username
      ORDER BY p.id
    `);
    res.status(200).json(rows);
  } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => { try { const id = numericId(req.params.id); if (!id) return res.status(400).json({ error: 'Invalid problem id' }); const { rows } = await query('SELECT * FROM problemsets WHERE id = $1', [id]); if (!rows[0]) return res.status(404).json({ error: 'Problem not found' }); res.status(200).json(rows[0]); } catch (error) { next(error); } });

router.post('/', authMiddleware, requireProblemAuthor, async (req, res, next) => {
  try {
    const parsed = problemInput(req.body); if (parsed.error) return res.status(400).json({ error: parsed.error });
    const p = parsed.value;
    if (req.userRole !== 'ADMIN' && ['editorialRating', 'editorialFill', 'editorialColor'].some((key) => p[key] !== undefined)) return res.status(403).json({ error: 'Only administrators can set ratings' });
    const rows = await withTransaction(async (client) => {
      const result = await client.query('INSERT INTO problemsets (title, description, difficulty, input, output, notes, "testCases", constraints, examples, "timeLimit", "memoryLimit", tags, editorial, discussion, "editorialRating", "editorialFill", "editorialColor", archived, created_by, "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,NOW()) RETURNING *', [p.title, p.description, p.difficulty, p.input || '', p.output || '', p.notes || '', JSON.stringify(p.testCases || []), p.constraints || '', JSON.stringify(p.examples || []), p.timeLimit || 1, p.memoryLimit || 256, JSON.stringify(p.tags || []), p.editorial || '', 'Discussion section: community discussion can be added here.', p.editorialRating ?? null, p.editorialFill ?? null, p.editorialColor ?? null, Boolean(p.archived), req.userId]);
      return result.rows;
    });
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireProblemAuthor, async (req, res, next) => {
  try {
    const id = numericId(req.params.id); if (!id) return res.status(400).json({ error: 'Invalid problem id' });
    const owner = await query('SELECT created_by FROM problemsets WHERE id = $1', [id]);
    if (!owner.rowCount) return res.status(404).json({ error: 'Problem not found' });
    if (req.userRole !== 'ADMIN' && owner.rows[0].created_by !== req.userId) return res.status(403).json({ error: 'Authors may only edit problems they created' });
    const parsed = problemInput(req.body, true); if (parsed.error) return res.status(400).json({ error: parsed.error });
    const p = parsed.value, values = [], sets = [];
    if (req.userRole !== 'ADMIN' && ['editorialRating', 'editorialFill', 'editorialColor'].some((key) => p[key] !== undefined)) return res.status(403).json({ error: 'Only administrators can set ratings' });
    const columns = { title: 'title', description: 'description', difficulty: 'difficulty', input: 'input', output: 'output', notes: 'notes', constraints: 'constraints', editorial: 'editorial', discussion: 'discussion', timeLimit: '"timeLimit"', memoryLimit: '"memoryLimit"', editorialRating: '"editorialRating"', editorialFill: '"editorialFill"', editorialColor: '"editorialColor"', archived: 'archived' };
    for (const [key, column] of Object.entries(columns)) if (p[key] !== undefined) { values.push(p[key]); sets.push(`${column} = $${values.length}`); }
    for (const key of ['testCases', 'examples', 'tags']) if (p[key] !== undefined) { values.push(JSON.stringify(p[key])); sets.push(`"${key}" = $${values.length}::jsonb`); }
    if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(id);
    const rows = await withTransaction(async (client) => {
      const result = await client.query(`UPDATE problemsets SET ${sets.join(', ')}, "updatedAt" = NOW() WHERE id = $${values.length} RETURNING *`, values);
      return result.rows;
    });
    res.status(200).json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => { try { const id = numericId(req.params.id); if (!id) return res.status(400).json({ error: 'Invalid problem id' }); await withTransaction(async (client) => { const result = await client.query('DELETE FROM problemsets WHERE id = $1', [id]); if (!result.rowCount) throw Object.assign(new Error('Problem not found'), { status: 404 }); }); res.status(204).send(); } catch (error) { if (error.status === 404) return res.status(404).json({ error: 'Problem not found' }); next(error); } });
export default router;
