import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  durationDays: { type: Number, default: 7 },
  checklist: { type: Array, default: [] },
  completed: { type: Boolean, default: false },
  createdAt: { type: String },
}, { timestamps: false });

goalSchema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model('Goal', goalSchema);
