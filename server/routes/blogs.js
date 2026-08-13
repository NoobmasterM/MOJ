import express from 'express';
import { PrismaClient } from '@prisma/client';
import prismaConfig, { adapters } from '../prisma/prisma.config.js';
import dotenv from 'dotenv';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient({ adapter: adapters.pg });

// GET all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Increment views
    await prisma.blog.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } }
    });

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new blog
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        author,
        tags: tags || []
      }
    });

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update blog
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, tags } = req.body;

    const blog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(author && { author }),
        ...(tags && { tags })
      }
    });

    res.json(blog);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE blog
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.blog.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
