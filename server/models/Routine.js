import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '📋' },
  cycleLength: { type: Number, default: 7 },
  pattern: { type: Array, default: [] },
  startDate: { type: String },
}, { timestamps: false });

routineSchema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model('Routine', routineSchema);
