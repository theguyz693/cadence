import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  taskTitle: { type: String, default: 'Focus Session' },
  durationSec: { type: Number, default: 0 },
  completedAt: { type: String },
  isBreak: { type: Boolean, default: false },
}, { timestamps: false });

export default mongoose.model('FocusSession', focusSessionSchema);
