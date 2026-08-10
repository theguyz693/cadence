import { Router } from 'express';
import Settings from '../models/Settings.js';

const router = Router();

const DEFAULT_FOCUS_SOUNDS = [
  { id: 'sound_1', name: 'Deep Focus Ambient', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', type: 'preset', isDefault: true },
  { id: 'sound_2', name: 'Rain & Thunderstorm', src: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b71d9d970.mp3?filename=rain-and-thunder-16705.mp3', type: 'preset', isDefault: false },
  { id: 'sound_3', name: 'Night City Lo-Fi', src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3', type: 'preset', isDefault: false },
  { id: 'sound_4', name: 'Synth Meditation Drone', src: 'synth', type: 'preset', isDefault: false },
];

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: 'indigo',
  showBanner: true,
  bannerUrl: 'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif',
  bgBlur: 25,
  bgDim: 60,
  activeBackground: 'random',
  customBackgrounds: [
    { id: 'slot1', name: 'Cozy Cafe', url: 'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif' },
    { id: 'slot2', name: 'Pixel Cat', url: 'https://media.giphy.com/media/VPlgUzkP5yPba/giphy.gif' },
    { id: 'slot3', name: 'Sunset Train', url: 'https://media.giphy.com/media/43F752JzgNn44/giphy.gif' }
  ],
  focusSounds: DEFAULT_FOCUS_SOUNDS,
  defaultSoundId: 'sound_1',
};


// GET /api/settings — get user settings
router.get('/', async (req, res) => {
  try {
    const doc = await Settings.findOne({ userId: req.userId }).lean();
    if (!doc) {
      return res.json(DEFAULT_SETTINGS);
    }
    const { _id, userId, __v, ...settings } = doc;
    res.json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (err) {
    console.error('GET /api/settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings — update user settings
router.put('/', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.userId;
    delete updates.__v;

    await Settings.findOneAndUpdate(
      { userId: req.userId },
      { $set: { userId: req.userId, ...updates } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// DELETE /api/settings — reset user settings
router.delete('/', async (req, res) => {
  try {
    await Settings.deleteOne({ userId: req.userId });
    res.json({ success: true, settings: DEFAULT_SETTINGS });
  } catch (err) {
    console.error('DELETE /api/settings error:', err);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;
