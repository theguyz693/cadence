import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  emoji: { type: String, default: '' },
  cycleLength: { type: Number, default: 7 },
  pattern: { type: Array, default: [] },       // [{ active, label, time? }]
  time: { type: String, default: null },       // default 'HH:MM' for scheduled days
  duration: { type: Number, default: null },   // minutes
  startDate: { type: String },
  createdAt: { type: String },
}, { timestamps: false });

routineSchema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model('Routine', routineSchema);
