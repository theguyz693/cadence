import mongoose from 'mongoose';

const completionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: false });

export default mongoose.model('Completion', completionSchema);
