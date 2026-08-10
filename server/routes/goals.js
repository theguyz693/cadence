import { Router } from 'express';
import Goal from '../models/Goal.js';

const router = Router();

// GET /api/goals — list user goals
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).lean();
    res.json(goals);
  } catch (err) {
    console.error('GET /api/goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals — create a goal
router.post('/', async (req, res) => {
  try {
    const goalData = req.body;
    if (!goalData.id || !goalData.title) {
      return res.status(400).json({ error: 'Goal requires id and title' });
    }
    const goal = new Goal({ ...goalData, userId: req.userId });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    console.error('POST /api/goals error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id — update a goal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.userId;

    const goal = await Goal.findOneAndUpdate(
      { id, userId: req.userId },
      { $set: updates },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ success: true, goal });
  } catch (err) {
    console.error('PUT /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id — delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Goal.deleteOne({ id, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
