import express from 'express';
import { PrismaClient } from '@prisma/client';
import prismaConfig, { adapters } from '../prisma/prisma.config.js';
import dotenv from 'dotenv';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient({ adapter: adapters.pg });

// GET all contests
router.get('/', async (req, res) => {
  try {
    const contests = await prisma.contest.findMany({
      include: {
        problemsets: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            editorialRating: true
          },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { startTime: 'desc' }
    });
    res.json(contests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single contest by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await prisma.contest.findUnique({
      where: { id: parseInt(id) },
      include: {
        problemsets: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            editorialRating: true
          },
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new contest
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { title, description, startTime, endTime, problems } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: new Date(startTime) > new Date() ? 'UPCOMING' : 'ONGOING'
      }
    });

    if (Array.isArray(problems) && problems.length > 0) {
      await prisma.problemset.updateMany({
        where: { id: { in: problems.map((problemId) => parseInt(problemId)) } },
        data: { contestId: contest.id }
      });
    }

    res.status(201).json(contest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update contest
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime, status, problems } = req.body;

    const contest = await prisma.contest.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status })
      }
    });

    if (Array.isArray(problems)) {
      await prisma.problemset.updateMany({
        where: { contestId: parseInt(id) },
        data: { contestId: null }
      });
      await prisma.problemset.updateMany({
        where: { id: { in: problems.map((problemId) => parseInt(problemId)) } },
        data: { contestId: parseInt(id) }
      });
    }

    res.json(contest);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contest not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE contest
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.contest.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Contest deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contest not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
