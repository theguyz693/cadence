/**
 * Routines REST API routes.
 */
import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/routines — list all routines
router.get('/', async (req, res) => {
  try {
    const routines = await getDb().collection('routines').find().toArray();
    res.json(routines);
  } catch (err) {
    console.error('GET /api/routines error:', err);
    res.status(500).json({ error: 'Failed to fetch routines' });
  }
});

// POST /api/routines — create a routine
router.post('/', async (req, res) => {
  try {
    const routine = req.body;
    if (!routine.id || !routine.name) {
      return res.status(400).json({ error: 'Routine requires id and name' });
    }
    await getDb().collection('routines').insertOne(routine);
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
    const updates = req.body;
    delete updates._id;
    const result = await getDb().collection('routines').updateOne(
      { id },
      { $set: updates }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/routines/:id error:', err);
    res.status(500).json({ error: 'Failed to update routine' });
  }
});

// DELETE /api/routines/:id — delete a routine
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getDb().collection('routines').deleteOne({ id });
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
