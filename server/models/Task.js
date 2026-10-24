import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueWithinDays: { type: Number, default: null },
  priority: { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
  completedAt: { type: String, default: null },
  time: { type: String, default: null },        // 'HH:MM' start, optional
  duration: { type: Number, default: null },    // minutes, optional
  completed: { type: Boolean, default: false },
  createdAt: { type: String },
}, { timestamps: false });

taskSchema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model('Task', taskSchema);
