import express from 'express';
import { PrismaClient } from '@prisma/client';
import prismaConfig, { adapters } from '../prisma/prisma.config.js';
import dotenv from 'dotenv';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

dotenv.config();
import { executeCode } from '../utils/codeExecutor.js';

const router = express.Router();
const prisma = new PrismaClient({ adapter: adapters.pg });

// GET all submissions for a user
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);

    if (req.userId !== parsedUserId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const submissions = await prisma.submission.findMany({
      where: { userId: parsedUserId },
      include: {
        problemset: {
          select: { id: true, title: true, difficulty: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET submissions for a specific problemset
router.get('/problemset/:problemsetId', async (req, res) => {
  try {
    const { problemsetId } = req.params;

    const submissions = await prisma.submission.findMany({
      where: { problemsetId: parseInt(problemsetId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/problem/:problemsetId', async (req, res) => {
  try {
    const { problemsetId } = req.params;

    const submissions = await prisma.submission.findMany({
      where: { problemsetId: parseInt(problemsetId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single submission
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        problemset: true,
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (req.userId !== submission.user.id && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new submission
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { problemsetId, code, language } = req.body;
    const userId = req.userId;

    if (!userId || !problemsetId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify problemset exists
    const problemset = await prisma.problemset.findUnique({ where: { id: parseInt(problemsetId, 10) } });

    if (!problemset) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemsetId: parseInt(problemsetId, 10),
        code,
        language,
        status: 'PENDING'
      },
      include: {
        problemset: true,
        user: { select: { username: true } }
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update submission status
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, output, error, executionTime } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (req.userId !== submission.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.submission.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(status && { status }),
        ...(output && { output }),
        ...(error && { error }),
        ...(executionTime && { executionTime })
      }
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE submission
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (req.userId !== submission.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.submission.delete({
      where: { id: parseInt(id, 10) }
    });

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST submit code and test against test cases
router.post('/test-submit', authMiddleware, async (req, res) => {
  try {
    const { problemsetId, code, language } = req.body;
    const userId = req.userId;

    if (!userId || !problemsetId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get problem with test cases
    const problemset = await prisma.problemset.findUnique({
      where: { id: parseInt(problemsetId, 10) }
    });

    if (!problemset) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const testCases = Array.isArray(problemset.testCases) ? problemset.testCases : [];
    if (testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases found for this problem' });
    }

    let testsPassed = 0;
    const results = [];

    // Run code against each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await executeCode(code, language, testCase.input);

      const actualOutput = result.output || '';
      const expectedOutput = testCase.output || '';
      const passed = !result.error && actualOutput.trim() === expectedOutput.trim();
      if (passed) testsPassed++;

      results.push({
        testCaseIndex: i + 1,
        input: testCase.input,
        expectedOutput,
        actualOutput,
        passed,
        error: result.error
      });
    }

    const status = testsPassed === testCases.length ? 'ACCEPTED' : 'FAILED';

    // Save submission to database
    const submission = await prisma.submission.create({
      data: {
        userId: parseInt(userId),
        problemsetId: parseInt(problemsetId),
        code,
        language,
        status,
        testsPassed,
        totalTests: testCases.length,
        output: JSON.stringify(results)
      },
      include: {
        problemset: true,
        user: { select: { username: true } }
      }
    });

    res.status(201).json({
      submission,
      testResults: results,
      summary: {
        total: testCases.length,
        passed: testsPassed,
        failed: testCases.length - testsPassed,
        status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST run code against single test case
router.post('/run-code', async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing code or language' });
    }

    const result = await executeCode(code, language, input || '');

    res.json({
      status: result.status,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
