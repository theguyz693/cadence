import { Router } from 'express';
import FocusSession from '../models/FocusSession.js';

const router = Router();

// GET /api/focus-sessions — list focus sessions for current user
router.get('/', async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.userId })
      .sort({ completedAt: -1 })
      .lean();
    res.json(sessions);
  } catch (err) {
    console.error('GET /api/focus-sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
});

// POST /api/focus-sessions — record a focus session
router.post('/', async (req, res) => {
  try {
    const { taskTitle, durationSec, completedAt, isBreak } = req.body;
    const session = new FocusSession({
      userId: req.userId,
      taskTitle: taskTitle || 'Focus Session',
      durationSec: durationSec || 0,
      completedAt: completedAt || new Date().toISOString(),
      isBreak: isBreak || false,
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    console.error('POST /api/focus-sessions error:', err);
    res.status(500).json({ error: 'Failed to save focus session' });
  }
});

export default router;
