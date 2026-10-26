/**
 * Sample workspace for demo mode. Everything is generated relative to today
 * so the demo always looks lived-in: a few weeks of routine history with
 * realistic misses, tasks due around now, goals mid-way, a couple of focus
 * sessions. Deterministic (seeded) so every visitor sees the same story.
 */
import { toDateKey } from '../utils/recurrence.js';
import { addDays, startOfDay } from '../utils/dates.js';

const DEFAULT_FOCUS_SOUNDS = [
  { id: 'sound_1', name: 'Deep Focus Ambient', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', type: 'preset', isDefault: true },
  { id: 'sound_2', name: 'Rain & Thunderstorm', src: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b71d9d970.mp3?filename=rain-and-thunder-16705.mp3', type: 'preset', isDefault: false },
  { id: 'sound_3', name: 'Night City Lo-Fi', src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3', type: 'preset', isDefault: false },
  { id: 'sound_4', name: 'Synth Meditation Drone', src: 'synth', type: 'preset', isDefault: false },
];

/** Small deterministic PRNG (mulberry32). */
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const day = (n) => addDays(startOfDay(), -n);
const iso = (n) => day(n).toISOString();

function pattern(spec) {
  return spec.map(s => (s === null ? { active: false, label: '' } : { active: true, label: s }));
}

/**
 * Mark scheduled days done with probability `rate`, skipping today unless
 * `doneToday`, and guaranteeing an unbroken run of `recentRun` days.
 */
function history(routine, rate, { recentRun = 0, doneToday = false, seed = 1 } = {}) {
  const rand = rng(seed);
  const out = {};
  const len = routine.cycleLength;
  const startDays = Math.round((startOfDay() - startOfDay(routine.startDate)) / 86400000);
  let run = 0;
  for (let n = 0; n <= startDays; n++) {
    const pos = (((startDays - n) % len) + len) % len;
    if (!routine.pattern[pos].active) continue;
    if (n === 0) { if (doneToday) out[toDateKey(day(0))] = true; continue; }
    const forced = run < recentRun;
    if (forced || rand() < rate) out[toDateKey(day(n))] = true;
    run += 1;
  }
  return out;
}

export function createDemoData() {
  const routines = [
    {
      id: 'demo_strength',
      name: 'Strength training',
      icon: 'dumbbell',
      emoji: '',
      cycleLength: 7,
      pattern: pattern(['Push', 'Pull', 'Legs', null, 'Upper', 'Lower', null]),
      time: '07:00',
      duration: 60,
      startDate: iso(44),
      createdAt: iso(44),
    },
    {
      id: 'demo_reading',
      name: 'Read 20 pages',
      icon: 'book',
      emoji: '',
      cycleLength: 1,
      pattern: pattern(['']),
      time: '21:30',
      duration: 30,
      startDate: iso(36),
      createdAt: iso(36),
    },
    {
      id: 'demo_spanish',
      name: 'Spanish practice',
      icon: 'language',
      emoji: '',
      cycleLength: 3,
      pattern: pattern(['Vocab', 'Listening', null]),
      time: '08:00',
      duration: 25,
      startDate: iso(29),
      createdAt: iso(29),
    },
    {
      id: 'demo_run',
      name: '10K training block',
      icon: 'run',
      emoji: '',
      cycleLength: 10,
      pattern: pattern(['Easy 3K', null, 'Intervals', null, 'Tempo 5K', null, null, 'Easy 4K', null, 'Long run']),
      startDate: iso(23),
      createdAt: iso(23),
    },
  ];

  const completions = {
    demo_strength: history(routines[0], 0.84, { recentRun: 3, seed: 11 }),
    demo_reading: history(routines[1], 0.82, { recentRun: 6, doneToday: true, seed: 7 }),
    demo_spanish: history(routines[2], 0.75, { recentRun: 2, seed: 3 }),
    demo_run: history(routines[3], 0.9, { recentRun: 2, seed: 5 }),
  };

  // dueWithinDays is relative to createdAt, so build each from a target offset.
  const task = (id, title, { created = 3, dueIn = null, priority = 'none', description = '', completedToday = false, time = null, duration = null }) => ({
    id,
    title,
    description,
    priority,
    createdAt: iso(created),
    dueWithinDays: dueIn === null ? null : created + dueIn,
    completed: completedToday,
    completedAt: completedToday ? new Date().toISOString() : null,
    time,
    duration,
  });

  const tasks = [
    task('demo_t1', 'Send portfolio to Priya', { created: 2, dueIn: 0, priority: 'high', description: 'Include the case study and the Cadence demo link.', time: '16:00', duration: 30 }),
    task('demo_t2', 'Draft Q4 budget', { created: 6, dueIn: -1, priority: 'medium' }),
    task('demo_t3', 'Buy running shoes', { created: 4, dueIn: 1, priority: 'low', time: '18:30', duration: 45 }),
    task('demo_t4', 'Renew passport', { created: 9, dueIn: 4, priority: 'medium', description: 'Photos are in the desk drawer.' }),
    task('demo_t5', 'Book dentist appointment', { created: 5 }),
    task('demo_t6', 'Reply to the landlord', { created: 1 }),
    task('demo_t7', 'Pay electricity bill', { created: 3, dueIn: 0, completedToday: true }),
  ];

  const step = (id, text, done) => ({ id, text, completed: done });
  const goals = [
    {
      id: 'demo_g1',
      title: 'Run a 10K under 55 minutes',
      description: 'Race is on the calendar — build up steadily, no injuries.',
      createdAt: iso(23),
      durationDays: 49,
      completed: false,
      checklist: [
        step('g1s1', 'Run 3K without stopping', true),
        step('g1s2', 'Run 5K in under 30 min', true),
        step('g1s3', 'First 7K long run', true),
        step('g1s4', 'Run 8K at race pace', false),
        step('g1s5', 'Taper week', false),
        step('g1s6', 'Race day', false),
      ],
    },
    {
      id: 'demo_g2',
      title: 'Ship my portfolio site',
      description: '',
      createdAt: iso(10),
      durationDays: 15,
      completed: false,
      checklist: [
        step('g2s1', 'Pick three case studies', true),
        step('g2s2', 'Write the about page', true),
        step('g2s3', 'Record a product walkthrough', false),
        step('g2s4', 'Get feedback from two friends', false),
        step('g2s5', 'Publish', false),
      ],
    },
    {
      id: 'demo_g3',
      title: 'Finish "Atomic Habits"',
      description: '',
      createdAt: iso(40),
      durationDays: 30,
      completed: true,
      checklist: [step('g3s1', 'Part 1', true), step('g3s2', 'Part 2', true), step('g3s3', 'Part 3', true)],
    },
  ];

  const at = (n, h, m) => { const d = day(n); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const focusSessions = [
    { _id: 'demo_f1', taskTitle: 'Draft Q4 budget', durationSec: 50 * 60, completedAt: at(0, 9, 40), isBreak: false },
    { _id: 'demo_f2', taskTitle: 'Spanish practice', durationSec: 25 * 60, completedAt: at(0, 8, 5), isBreak: false },
    { _id: 'demo_f3', taskTitle: 'Ship my portfolio site', durationSec: 90 * 60, completedAt: at(1, 15, 30), isBreak: false },
    { _id: 'demo_f4', taskTitle: 'Deep work', durationSec: 50 * 60, completedAt: at(2, 10, 0), isBreak: false },
  ];

  const settings = {
    theme: 'system',
    uiTheme: 'standard',
    accentColor: 'ember',
    showBanner: false,
    bgBlur: 25,
    bgDim: 60,
    activeBackground: 'random',
    customBackgrounds: [
      { id: 'slot1', name: '', url: '' },
      { id: 'slot2', name: '', url: '' },
      { id: 'slot3', name: '', url: '' },
    ],
    focusSounds: DEFAULT_FOCUS_SOUNDS,
    defaultSoundId: 'sound_1',
    calendars: [{ id: 'demo_cal', name: 'Work (sample)', url: 'https://calendar.example.com/demo.ics', color: '#3b82f6', enabled: true }],
  };

  return { tasks, goals, routines, completions, settings, focusSessions };
}

export const DEMO_USER = { id: 'demo', username: 'Alex', demo: true };

/**
 * Sample "connected calendar" events for demo mode, generated for any range:
 * a weekday standup, a few recurring meetings and one birthday.
 */
export function demoCalendarEvents(from, to) {
  const events = [];
  const at = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
  const birthday = addDays(startOfDay(), 3);
  for (let d = startOfDay(from); d < to; d = addDays(d, 1)) {
    const dow = d.getDay();
    const base = { calendar: 'Work (sample)', color: '#3b82f6' };
    const push = (title, h, m, mins, extra = {}) => {
      const start = at(d, h, m);
      events.push({ ...base, ...extra, id: `demo-${title}-${start.toISOString()}`, title, allDay: false, start: start.toISOString(), end: new Date(start.getTime() + mins * 60000).toISOString() });
    };
    if (dow >= 1 && dow <= 5) push('Team standup', 10, 0, 15, { location: 'Zoom' });
    if (dow === 2 || dow === 4) push('1:1 with Priya', 15, 0, 30);
    if (dow === 3) push('Design review', 14, 0, 60, { location: 'Room 4B' });
    if (dow === 5) push('Lunch with Sam', 13, 0, 60);
    if (dow === 6) push('Farmers market', 9, 30, 90, { calendar: 'Personal (sample)', color: '#16a34a' });
    if (d.getTime() === birthday.getTime()) {
      const y = d.getFullYear(), mo = String(d.getMonth() + 1).padStart(2, '0'), da = String(d.getDate()).padStart(2, '0');
      const n = addDays(d, 1);
      events.push({ id: 'demo-bday', title: 'Mom’s birthday', allDay: true, date: `${y}-${mo}-${da}`, endDate: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`, calendar: 'Personal (sample)', color: '#e11d48' });
    }
  }
  return events;
}
