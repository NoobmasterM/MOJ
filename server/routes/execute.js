import express from 'express';
import { executeCode } from '../utils/codeExecutor.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST execute code
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, language = 'javascript', input = '' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = await executeCode(code, language, input);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      output: '',
      executionTime: 0
    });
  }
});

export default router;
