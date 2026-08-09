/**
 * Goals REST API routes.
 * Goals contain embedded checklist arrays — all mutations happen via PUT.
 */
import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/goals — list all goals
router.get('/', async (req, res) => {
  try {
    const goals = await getDb().collection('goals').find().toArray();
    res.json(goals);
  } catch (err) {
    console.error('GET /api/goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals — create a goal
router.post('/', async (req, res) => {
  try {
    const goal = req.body;
    if (!goal.id || !goal.title) {
      return res.status(400).json({ error: 'Goal requires id and title' });
    }
    await getDb().collection('goals').insertOne(goal);
    res.status(201).json(goal);
  } catch (err) {
    console.error('POST /api/goals error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id — update a goal (covers edit, toggle, checklist mutations)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    const result = await getDb().collection('goals').updateOne(
      { id },
      { $set: updates }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id — delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getDb().collection('goals').deleteOne({ id });
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
