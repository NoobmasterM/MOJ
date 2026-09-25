import express from 'express';
import { query, withTransaction } from '../db.js';
import { authMiddleware, requireProblemAuthor } from '../middleware/auth.js';
const router = express.Router();
const id = x => Number.isSafeInteger(Number(x)) && Number(x) > 0 ? Number(x) : null;
router.get('/', async (req,res,next) => { try { const { rows } = await query('SELECT b.*, u.username AS "authorUsername" FROM blogs b LEFT JOIN users u ON u.id = b.author_id ORDER BY b."createdAt" DESC'); res.json(rows); } catch(e){next(e);} });
router.get('/:id', async (req,res,next) => { try { const blogId=id(req.params.id); if(!blogId)return res.status(400).json({error:'Invalid blog id'}); const rows = await withTransaction(async (client) => { const result = await client.query('UPDATE blogs SET views = views + 1, "updatedAt" = NOW() WHERE id=$1 RETURNING *',[blogId]); return result.rows; }); if(!rows[0])return res.status(404).json({error:'Blog not found'});res.json(rows[0]);}catch(e){next(e);} });
const canManage = async (blogId, userId, role) => {
  const { rows } = await query('SELECT author_id FROM blogs WHERE id=$1', [blogId]);
  if (!rows[0]) return 'missing';
  return role === 'ADMIN' || rows[0].author_id === userId;
};

router.post('/:id/vote', authMiddleware, async (req, res, next) => {
  try {
    const blogId = id(req.params.id);
    if (!blogId) return res.status(400).json({ error: 'Invalid blog id' });
    const voteType = String(req.body?.type || '').toLowerCase();
    if (!['like', 'dislike'].includes(voteType)) return res.status(400).json({ error: 'Vote type must be like or dislike' });

    const column = voteType === 'like' ? 'likes' : 'dislikes';
    const rows = await withTransaction(async (client) => {
      const result = await client.query(`UPDATE blogs SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = $1 RETURNING id, likes, dislikes`, [blogId]);
      return result.rows;
    });
    if (!rows[0]) return res.status(404).json({ error: 'Blog not found' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/',authMiddleware,requireProblemAuthor,async(req,res,next)=>{try{const {title,content}=req.body;if(!title?.trim()||!content?.trim())return res.status(400).json({error:'title and content are required'});const rows = await withTransaction(async (client) => { const result = await client.query('INSERT INTO blogs (title,content,author,author_id,tags,likes,dislikes,"updatedAt") VALUES ($1,$2,(SELECT username FROM users WHERE id=$3),$3,$4::jsonb,0,0,NOW()) RETURNING *',[title.trim(),content.trim(),req.userId,JSON.stringify(Array.isArray(req.body.tags)?req.body.tags:[])]); return result.rows; });res.status(201).json(rows[0]);}catch(e){next(e);}});
router.patch('/:id',authMiddleware,requireProblemAuthor,async(req,res,next)=>{try{const blogId=id(req.params.id);if(!blogId)return res.status(400).json({error:'Invalid blog id'});const allowed=await canManage(blogId,req.userId,req.userRole);if(allowed==='missing')return res.status(404).json({error:'Blog not found'});if(!allowed)return res.status(403).json({error:'You may only edit blogs you created'});const {title,content}=req.body;if(!title?.trim()||!content?.trim())return res.status(400).json({error:'title and content are required'});const rows = await withTransaction(async (client) => { const result = await client.query('UPDATE blogs SET title=$1,content=$2,tags=$3::jsonb,"updatedAt"=NOW() WHERE id=$4 RETURNING *',[title.trim(),content.trim(),JSON.stringify(Array.isArray(req.body.tags)?req.body.tags:[]),blogId]); return result.rows; });res.json(rows[0]);}catch(e){next(e);}});
router.delete('/:id',authMiddleware,requireProblemAuthor,async(req,res,next)=>{try{const blogId=id(req.params.id);if(!blogId)return res.status(400).json({error:'Invalid blog id'});const allowed=await canManage(blogId,req.userId,req.userRole);if(allowed==='missing')return res.status(404).json({error:'Blog not found'});if(!allowed)return res.status(403).json({error:'You may only delete blogs you created'});await withTransaction(async (client) => { const result = await client.query('DELETE FROM blogs WHERE id=$1',[blogId]); if (!result.rowCount) throw Object.assign(new Error('Blog not found'), { status: 404 }); });res.status(204).send();}catch(e){if(e.status===404)return res.status(404).json({error:'Blog not found'});next(e);}});
export default router;
