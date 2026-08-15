import express from 'express';
import { PrismaClient } from '@prisma/client';
import prismaConfig, { adapters } from '../prisma/prisma.config.js';
import dotenv from 'dotenv';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient({ adapter: adapters.pg });

// GET all problemsets
router.get('/', async (req, res) => {
  try {
    const problemsets = await prisma.problemset.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
        editorialRating: true,
        editorialFill: true,
        editorialColor: true,
        contestId: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { submissions: true }
        }
      }
    });
    res.json(problemsets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single problemset by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const problemset = await prisma.problemset.findUnique({
      where: { id: parseInt(id) },
      include: {
        submissions: {
          select: { id: true, status: true, createdAt: true }
        }
      }
    });

    if (!problemset) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problemset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new problemset (admin only)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      difficulty, 
      input,
      output,
      notes,
      testCases, 
      constraints, 
      examples,
      timeLimit,
      memoryLimit,
      tags,
      editorial,
      editorialRating,
      editorialFill,
      editorialColor,
      contestId,
      discussion
    } = req.body;

    if (!title || !description || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const problemset = await prisma.problemset.create({
      data: {
        title,
        description,
        difficulty,
        input: input || '',
        output: output || '',
        notes: notes || '',
        testCases: testCases || [],
        constraints: constraints || '',
        examples: examples || [],
        timeLimit: timeLimit || 1,
        memoryLimit: memoryLimit || 256,
        tags: tags || [],
        editorial: editorial || '',
        editorialRating: editorialRating || null,
        editorialFill: editorialFill || null,
        editorialColor: editorialColor || null,
        contestId: contestId ? parseInt(contestId) : null,
        discussion: discussion || ''
      }
    });

    res.status(201).json(problemset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update problemset
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      difficulty,
      input,
      output,
      notes,
      testCases,
      constraints,
      examples,
      timeLimit,
      memoryLimit,
      tags,
      editorial,
      editorialRating,
      editorialFill,
      editorialColor,
      contestId,
      discussion
    } = req.body;

    const problemset = await prisma.problemset.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(difficulty && { difficulty }),
        ...(input && { input }),
        ...(output && { output }),
        ...(notes && { notes }),
        ...(testCases && { testCases }),
        ...(constraints && { constraints }),
        ...(examples && { examples }),
        ...(timeLimit && { timeLimit }),
        ...(memoryLimit && { memoryLimit }),
        ...(tags && { tags }),
        ...(editorial && { editorial }),
        ...(editorialRating && { editorialRating }),
        ...(editorialFill && { editorialFill }),
        ...(editorialColor && { editorialColor }),
        ...(contestId !== undefined && { contestId: contestId ? parseInt(contestId) : null }),
        ...(discussion && { discussion })
      }
    });

    res.json(problemset);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE problemset
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.problemset.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
