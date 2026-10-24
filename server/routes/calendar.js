import { Router } from 'express';
import crypto from 'node:crypto';
import Settings from '../models/Settings.js';
import Routine from '../models/Routine.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import { safeFetchCalendar, parseCalendar, expandEvents, buildFeed } from '../lib/ical.js';

const MAX_CALENDARS = 5;
const MAX_RANGE_DAYS = 62;
const CACHE_MS = 5 * 60 * 1000;

// Best-effort per-instance cache of downloaded calendars (keyed by URL).
const cache = new Map();

async function loadCalendar(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.parsed;
  const parsed = parseCalendar(await safeFetchCalendar(url));
  cache.set(url, { at: Date.now(), parsed });
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return parsed;
}

/* ------------------------------------------------------------------------ */
/* Authenticated routes: /api/calendar/*                                     */
/* ------------------------------------------------------------------------ */
export const calendarRouter = Router();

// GET /api/calendar/events?from=ISO&to=ISO — events from the user's subscribed calendars
calendarRouter.get('/events', async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return res.status(400).json({ error: 'Provide a valid from/to range.' });
  }
  if ((to - from) / 86400000 > MAX_RANGE_DAYS) {
    return res.status(400).json({ error: `Range is limited to ${MAX_RANGE_DAYS} days.` });
  }

  try {
    const doc = await Settings.findOne({ userId: req.userId }).lean();
    const calendars = (doc?.calendars || []).filter(c => c?.url && c.enabled !== false).slice(0, MAX_CALENDARS);
    const events = [];
    const errors = [];
    await Promise.all(calendars.map(async (cal) => {
      try {
        const { events: raw } = await loadCalendar(cal.url);
        events.push(...expandEvents(raw, from, to, { calendar: cal.name, color: cal.color }));
      } catch (err) {
        errors.push({ calendar: cal.name, message: err.message });
      }
    }));
    res.json({ events, errors });
  } catch (err) {
    console.error('GET /api/calendar/events error:', err);
    res.status(500).json({ error: 'Failed to load calendars' });
  }
});

// POST /api/calendar/test { url } — validate a link before saving it
calendarRouter.post('/test', async (req, res) => {
  try {
    const { name, events } = await loadCalendar(req.body?.url);
    res.json({ ok: true, name, count: events.length });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Couldn’t read that calendar.' });
  }
});

// POST /api/calendar/feed-token { timeZone } — create (or rotate) the private feed link
calendarRouter.post('/feed-token', async (req, res) => {
  try {
    const token = crypto.randomBytes(24).toString('base64url');
    const timeZone = typeof req.body?.timeZone === 'string' && req.body.timeZone.length < 64 ? req.body.timeZone : 'UTC';
    await Settings.findOneAndUpdate(
      { userId: req.userId },
      { $set: { userId: req.userId, calendarFeedToken: token, timeZone } },
      { upsert: true },
    );
    res.json({ token });
  } catch (err) {
    console.error('POST /api/calendar/feed-token error:', err);
    res.status(500).json({ error: 'Failed to create feed link' });
  }
});

// DELETE /api/calendar/feed-token — turn the feed off
calendarRouter.delete('/feed-token', async (req, res) => {
  try {
    await Settings.updateOne({ userId: req.userId }, { $unset: { calendarFeedToken: '' } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to turn off feed' });
  }
});

/* ------------------------------------------------------------------------ */
/* Public route: /api/calendar/feed/:token.ics (calendar apps can't log in)  */
/* ------------------------------------------------------------------------ */
export const feedRouter = Router();

feedRouter.get('/:file', async (req, res) => {
  const token = String(req.params.file || '').replace(/\.ics$/i, '');
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return res.status(404).send('Not found');
  try {
    const settings = await Settings.findOne({ calendarFeedToken: token }).lean();
    if (!settings) return res.status(404).send('Not found');
    const userId = settings.userId;
    const [routines, tasks, goals] = await Promise.all([
      Routine.find({ userId }).lean(),
      Task.find({ userId }).lean(),
      Goal.find({ userId }).lean(),
    ]);
    const body = buildFeed({ routines, tasks, goals, timeZone: settings.timeZone || 'UTC' });
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="cadence.ics"',
      'Cache-Control': 'private, max-age=900',
    });
    res.send(body);
  } catch (err) {
    console.error('GET /api/calendar/feed error:', err);
    res.status(500).send('Feed unavailable');
  }
});
