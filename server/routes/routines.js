import { Router } from 'express';
import Routine from '../models/Routine.js';

const router = Router();

// GET /api/routines — list user routines
router.get('/', async (req, res) => {
  try {
    const routines = await Routine.find({ userId: req.userId }).lean();
    res.json(routines);
  } catch (err) {
    console.error('GET /api/routines error:', err);
    res.status(500).json({ error: 'Failed to fetch routines' });
  }
});

// POST /api/routines — create a routine
router.post('/', async (req, res) => {
  try {
    const routineData = req.body;
    if (!routineData.id || !routineData.name) {
      return res.status(400).json({ error: 'Routine requires id and name' });
    }
    const routine = new Routine({ ...routineData, userId: req.userId });
    await routine.save();
    res.status(201).json(routine);
  } catch (err) {
    console.error('POST /api/routines error:', err);
    res.status(500).json({ error: 'Failed to create routine' });
  }
});

// PUT /api/routines/:id — update a routine
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.userId;

    const routine = await Routine.findOneAndUpdate(
      { id, userId: req.userId },
      { $set: updates },
      { new: true }
    );

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.json({ success: true, routine });
  } catch (err) {
    console.error('PUT /api/routines/:id error:', err);
    res.status(500).json({ error: 'Failed to update routine' });
  }
});

// DELETE /api/routines/:id — delete a routine
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Routine.deleteOne({ id, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/routines/:id error:', err);
    res.status(500).json({ error: 'Failed to delete routine' });
  }
});

export default router;
