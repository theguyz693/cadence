import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, default: 'system' },
  accentColor: { type: String, default: 'cobalt' },
  showBanner: { type: Boolean, default: false },
  bannerUrl: { type: String, default: '' },
  bgBlur: { type: Number, default: 25 },
  bgDim: { type: Number, default: 60 },
  activeBackground: { type: String, default: 'random' },
  customBackgrounds: { type: Array, default: [] },
  calendarFeedToken: { type: String, index: { unique: true, sparse: true } },
  timeZone: { type: String },
}, { timestamps: false, strict: false });

export default mongoose.model('Settings', settingsSchema);
