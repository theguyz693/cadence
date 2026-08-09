/**
 * Settings REST API routes.
 * Settings are stored as a single document: { _docId: 'settings', ...settingsFields }
 */
import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();
const DOC_ID = 'user_settings';

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
};

// GET /api/settings — get settings
router.get('/', async (req, res) => {
  try {
    const doc = await getDb().collection('settings').findOne({ _docId: DOC_ID });
    if (!doc) {
      return res.json(DEFAULT_SETTINGS);
    }
    // Strip internal fields
    const { _id, _docId, ...settings } = doc;
    res.json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (err) {
    console.error('GET /api/settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings — merge-update settings
router.put('/', async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates._docId;
    await getDb().collection('settings').updateOne(
      { _docId: DOC_ID },
      { $set: { _docId: DOC_ID, ...updates } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// DELETE /api/settings — reset to defaults
router.delete('/', async (req, res) => {
  try {
    await getDb().collection('settings').deleteOne({ _docId: DOC_ID });
    res.json({ success: true, settings: DEFAULT_SETTINGS });
  } catch (err) {
    console.error('DELETE /api/settings error:', err);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;
