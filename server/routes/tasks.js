/**
 * Tasks REST API routes.
 */
import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/tasks — list all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await getDb().collection('tasks').find().toArray();
    res.json(tasks);
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — create a task
router.post('/', async (req, res) => {
  try {
    const task = req.body;
    if (!task.id || !task.title) {
      return res.status(400).json({ error: 'Task requires id and title' });
    }
    await getDb().collection('tasks').insertOne(task);
    res.status(201).json(task);
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id — update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Remove _id from updates if present (MongoDB doesn't allow modifying _id)
    delete updates._id;
    const result = await getDb().collection('tasks').updateOne(
      { id },
      { $set: updates }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getDb().collection('tasks').deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
