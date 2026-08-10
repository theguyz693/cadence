import { Router } from 'express';
import Task from '../models/Task.js';

const router = Router();

// GET /api/tasks — list user tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).lean();
    res.json(tasks);
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — create a task
router.post('/', async (req, res) => {
  try {
    const taskData = req.body;
    if (!taskData.id || !taskData.title) {
      return res.status(400).json({ error: 'Task requires id and title' });
    }
    const task = new Task({ ...taskData, userId: req.userId });
    await task.save();
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
    const updates = { ...req.body };
    delete updates._id;
    delete updates.userId;

    const task = await Task.findOneAndUpdate(
      { id, userId: req.userId },
      { $set: updates },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (err) {
    console.error('PUT /api/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Task.deleteOne({ id, userId: req.userId });
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
