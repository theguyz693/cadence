/**
 * Completions REST API routes.
 * Completions are stored as a single document: { _docId: 'completions', data: { ... } }
 * This mirrors the current localStorage shape: { [routineId]: { [dateStr]: true } }
 */
import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();
const DOC_ID = 'completions';

// GET /api/completions — get all completions
router.get('/', async (req, res) => {
  try {
    const doc = await getDb().collection('completions').findOne({ _docId: DOC_ID });
    res.json(doc?.data || {});
  } catch (err) {
    console.error('GET /api/completions error:', err);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

// PUT /api/completions — replace the full completions object
router.put('/', async (req, res) => {
  try {
    const data = req.body;
    await getDb().collection('completions').updateOne(
      { _docId: DOC_ID },
      { $set: { _docId: DOC_ID, data } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/completions error:', err);
    res.status(500).json({ error: 'Failed to save completions' });
  }
});

export default router;
