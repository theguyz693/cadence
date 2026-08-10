import { Router } from 'express';
import Completion from '../models/Completion.js';

const router = Router();

// GET /api/completions — get user completions
router.get('/', async (req, res) => {
  try {
    const doc = await Completion.findOne({ userId: req.userId }).lean();
    res.json(doc?.data || {});
  } catch (err) {
    console.error('GET /api/completions error:', err);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

// PUT /api/completions — replace user completions object
router.put('/', async (req, res) => {
  try {
    const data = req.body;
    await Completion.findOneAndUpdate(
      { userId: req.userId },
      { $set: { userId: req.userId, data } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/completions error:', err);
    res.status(500).json({ error: 'Failed to save completions' });
  }
});

export default router;
