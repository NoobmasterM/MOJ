import express from 'express';
import { PrismaClient } from '@prisma/client';
import prismaConfig, { adapters } from '../prisma/prisma.config.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient({ adapter: adapters.pg });

// GET all users (admin)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        rating: true,
        ratingFill: true,
        ratingColor: true,
        solvedProblems: true,
        contestsParticipated: true,
        createdAt: true,
        _count: {
          select: { submissions: true }
        }
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (req.userId !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        rating: true,
        ratingFill: true,
        ratingColor: true,
        solvedProblems: true,
        contestsParticipated: true,
        createdAt: true,
        submissions: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            problemset: {
              select: { 
                id: true, 
                title: true, 
                difficulty: true,
                contest: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    startTime: true,
                    endTime: true,
                    status: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new user (signup)
router.post('/', async (req, res) => {
  try {
    const { email, username, password, role, profilePic, rating, ratingFill, ratingColor, solvedProblems, contestsParticipated } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    // Hash the password
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashed,
        role: role || 'USER',
        ...(profilePic && { profilePic }),
        ...(rating !== undefined && { rating: parseInt(rating) }),
        ...(ratingFill !== undefined && { ratingFill: parseInt(ratingFill) }),
        ...(ratingColor && { ratingColor }),
        ...(solvedProblems !== undefined && { solvedProblems: parseInt(solvedProblems) }),
        ...(contestsParticipated !== undefined && { contestsParticipated: parseInt(contestsParticipated) })
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        rating: true,
        ratingFill: true,
        ratingColor: true,
        solvedProblems: true,
        contestsParticipated: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, password, role, profilePic, rating, ratingFill, ratingColor, solvedProblems, contestsParticipated } = req.body;
    const userId = parseInt(id, 10);

    if (req.userId !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {
      ...(email && { email }),
      ...(username && { username }),
      ...(profilePic && { profilePic }),
      ...(rating !== undefined && { rating: parseInt(rating) }),
      ...(ratingFill !== undefined && { ratingFill: parseInt(ratingFill) }),
      ...(ratingColor && { ratingColor }),
      ...(solvedProblems !== undefined && { solvedProblems: parseInt(solvedProblems) }),
      ...(contestsParticipated !== undefined && { contestsParticipated: parseInt(contestsParticipated) })
    };

    if (role && req.userRole === 'ADMIN') {
      updateData.role = role;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        rating: true,
        ratingFill: true,
        ratingColor: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (req.userId !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
