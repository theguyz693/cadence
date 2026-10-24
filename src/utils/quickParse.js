/**
 * Natural-language quick add — a small, rule-based parser.
 *
 *   "gym 7am mon wed fri"            → routine, Mon/Wed/Fri at 07:00
 *   "read every day"                 → routine, daily
 *   "pay rent friday !high"          → task due Friday, high priority
 *   "call mom tomorrow 6pm for 30m"  → task due tomorrow 18:00, 30 min
 *   "learn spanish by dec 31"        → goal (deadline ≥ 2 weeks away)
 *   "goal: ship portfolio by friday" → goal (explicit)
 *
 * Returns the cleaned title plus everything it recognised, and the matched
 * fragments so the UI can show what was understood.
 */
import { addDays, startOfDay, daysBetween } from './dates.js';

const WEEKDAYS = [
  ['sunday', 'sun'], ['monday', 'mon'], ['tuesday', 'tue', 'tues'], ['wednesday', 'wed'],
  ['thursday', 'thu', 'thur', 'thurs'], ['friday', 'fri'], ['saturday', 'sat'],
];
const MONTHS = [
  ['january', 'jan'], ['february', 'feb'], ['march', 'mar'], ['april', 'apr'], ['may'], ['june', 'jun'],
  ['july', 'jul'], ['august', 'aug'], ['september', 'sep', 'sept'], ['october', 'oct'], ['november', 'nov'], ['december', 'dec'],
];

const DAY_ALT = WEEKDAYS.flat().sort((a, b) => b.length - a.length).join('|');
const MONTH_ALT = MONTHS.flat().sort((a, b) => b.length - a.length).join('|');

const weekdayIndex = (word) => WEEKDAYS.findIndex(names => names.includes(word.toLowerCase()));
const monthIndex = (word) => MONTHS.findIndex(names => names.includes(word.toLowerCase()));

/** Monday-first index (0 = Mon … 6 = Sun) from a JS day (0 = Sun). */
const monFirst = (jsDay) => (jsDay + 6) % 7;

function nextWeekday(jsDay, from = new Date(), { allowToday = false, skipWeek = false } = {}) {
  const today = startOfDay(from);
  let diff = (jsDay - today.getDay() + 7) % 7;
  if (diff === 0 && !allowToday) diff = 7;
  if (skipWeek) diff += diff < 7 ? 7 : 0;
  return addDays(today, diff);
}

function to24h(h, m, ampm) {
  let hour = Number(h);
  const min = Number(m || 0);
  if (ampm) {
    const pm = ampm.toLowerCase().startsWith('p');
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
  }
  if (hour > 23 || min > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function minutesBetween(a, b) {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  let d = bh * 60 + bm - (ah * 60 + am);
  if (d <= 0) d += 24 * 60;
  return d;
}

/**
 * Each rule finds a fragment, records what it means, and removes it from the
 * working text so later rules (and the final title) don't see it again.
 */
export function parseQuickAdd(input, now = new Date()) {
  let text = ` ${input.trim()} `;
  const today = startOfDay(now);
  const out = {
    kind: null,           // 'task' | 'routine' | 'goal' (null = default)
    explicitKind: false,
    title: '',
    date: null,           // Date (task due / goal deadline)
    time: null,           // 'HH:MM'
    duration: null,       // minutes
    priority: null,       // 'high' | 'medium' | 'low'
    recurrence: null,     // { cycleLength, active: number[], weekdays?: number[] (Mon-first), label }
    matches: [],          // [{ type, text }]
  };

  const take = (re, fn) => {
    const m = text.match(re);
    if (!m) return false;
    const ok = fn(m);
    if (ok === false) return false;
    out.matches.push({ type: ok?.type || 'meta', text: m[0].trim() });
    text = text.replace(m[0], ' ');
    return true;
  };

  // ---- Explicit kind prefix: "task:", "routine:", "goal:" ----
  take(/^\s*(task|todo|routine|habit|goal)\s*:\s*/i, (m) => {
    const k = m[1].toLowerCase();
    out.kind = k === 'todo' ? 'task' : k === 'habit' ? 'routine' : k;
    out.explicitKind = true;
    return { type: 'kind' };
  });

  // ---- Priority: !high / !h / !!! / p1 ----
  take(/\s(!{1,3}(?:high|h|urgent|medium|med|m|low|l)?|p[123])(?=\s)/i, (m) => {
    const t = m[1].toLowerCase();
    if (t === 'p1' || t === '!!!' || /high|^!h$|urgent/.test(t)) out.priority = 'high';
    else if (t === 'p2' || t === '!!' || /med|^!m$/.test(t)) out.priority = 'medium';
    else out.priority = 'low';
    return { type: 'priority' };
  });

  // ---- Duration: "for 30m", "for 1h", "for 90 minutes", "for 1.5 hours" ----
  take(/\s(?:for\s+)(\d+(?:\.\d+)?)\s*(m|min|mins|minutes|h|hr|hrs|hour|hours)(?=\s)/i, (m) => {
    const n = parseFloat(m[1]);
    out.duration = Math.round(/^h/i.test(m[2]) ? n * 60 : n);
    return { type: 'time' };
  });

  // ---- Time range: "6-7pm", "9:30–11am", "18:00-19:00" ----
  take(/\s(?:at\s+|from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?=\s)/i, (m) => {
    const endAmpm = m[6];
    const startAmpm = m[3] || endAmpm;
    const start = to24h(m[1], m[2], startAmpm);
    const end = to24h(m[4], m[5], endAmpm);
    if (!start || !end) return false;
    out.time = start;
    out.duration = minutesBetween(start, end);
    return { type: 'time' };
  }) ||
  // ---- Single time: "7am", "7:30 pm", "at 19:00", "noon" ----
  take(/\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)(?=\s)/i, (m) => {
    const t = to24h(m[1], m[2], m[3].replace(/\./g, ''));
    if (!t) return false;
    out.time = t;
    return { type: 'time' };
  }) ||
  take(/\s(?:at\s+)(\d{1,2}):(\d{2})(?=\s)|\s(\d{1,2}):(\d{2})(?=\s)/i, (m) => {
    const t = to24h(m[1] ?? m[3], m[2] ?? m[4]);
    if (!t) return false;
    out.time = t;
    return { type: 'time' };
  }) ||
  take(/\s(?:at\s+)?(noon|midday|midnight)(?=\s)/i, (m) => {
    out.time = /mid(night)/i.test(m[1]) ? '00:00' : '12:00';
    return { type: 'time' };
  });

  // ---- Recurrence ----
  const setWeekly = (monFirstDays, label) => {
    const set = [...new Set(monFirstDays)].sort((a, b) => a - b);
    out.recurrence = { cycleLength: 7, active: set, weekdays: set, label };
  };

  take(/\s(?:every\s*day|everyday|daily|each\s+day)(?=\s)/i, () => {
    out.recurrence = { cycleLength: 1, active: [0], label: 'Every day' };
    return { type: 'repeat' };
  }) ||
  take(/\s(?:every\s+other\s+day|alternate\s+days)(?=\s)/i, () => {
    out.recurrence = { cycleLength: 2, active: [0], label: 'Every other day' };
    return { type: 'repeat' };
  }) ||
  take(/\severy\s+(\d{1,2})\s+days(?=\s)/i, (m) => {
    const n = Math.max(1, Math.min(20, Number(m[1])));
    out.recurrence = { cycleLength: n, active: [0], label: `Every ${n} days` };
    return { type: 'repeat' };
  }) ||
  take(/\s(?:on\s+)?(?:every\s+)?weekdays?(?=\s)/i, () => { setWeekly([0, 1, 2, 3, 4], 'Weekdays'); return { type: 'repeat' }; }) ||
  take(/\s(?:on\s+)?(?:every\s+)?weekends?(?=\s)/i, () => { setWeekly([5, 6], 'Weekends'); return { type: 'repeat' }; }) ||
  take(/\s(?:(\d)|once|twice|thrice)\s*(?:x|times)\s*(?:a|per|\/)\s*week(?=\s)/i, (m) => {
    const word = m[0].toLowerCase();
    const n = m[1] ? Number(m[1]) : word.includes('once') ? 1 : word.includes('twice') ? 2 : 3;
    const presets = { 1: [0], 2: [1, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
    if (!presets[n]) return false;
    setWeekly(presets[n], `${n}× a week`);
    return { type: 'repeat' };
  }) ||
  // Day lists: "mon wed fri", "mon, wed & fri", "every tuesday and thursday", "mondays"
  take(new RegExp(`\\s(?:on\\s+|every\\s+)?((?:(?:${DAY_ALT})s?(?:\\s*(?:,|&|and|\\/)\\s*|\\s+)){1,6}(?:${DAY_ALT})s?)(?=\\s)`, 'i'), (m) => {
    const words = m[1].toLowerCase().split(/\s*(?:,|&|\/|\band\b)\s*|\s+/).filter(Boolean);
    const days = words
      .map(w => { const i = weekdayIndex(w.replace(/days$/, 'day')); return i >= 0 ? i : weekdayIndex(w.replace(/s$/, '')); })
      .filter(i => i >= 0)
      .map(monFirst);
    if (days.length < 2) return false;
    setWeekly(days, null);
    return { type: 'repeat' };
  }) ||
  take(new RegExp(`\\s(?:every\\s+(${DAY_ALT})|(sunday|monday|tuesday|wednesday|thursday|friday|saturday)s)(?=\\s)`, 'i'), (m) => {
    const idx = weekdayIndex(m[1] || m[2]);
    if (idx < 0) return false;
    setWeekly([monFirst(idx)], null);
    return { type: 'repeat' };
  });

  // ---- Deadline / due date ----
  let byDeadline = false;
  const setDate = (d, viaBy) => { out.date = d; byDeadline = viaBy; };

  take(new RegExp(`\\s(by|on|due|before)?\\s*(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?(?=\\s)`, 'i'), (m) => {
    const d = new Date(m[4] ? Number(m[4]) : today.getFullYear(), monthIndex(m[2]), Number(m[3]));
    if (!m[4] && d < today) d.setFullYear(d.getFullYear() + 1);
    setDate(d, !!m[1] && /by|before/i.test(m[1]));
    return { type: 'date' };
  }) ||
  take(new RegExp(`\\s(by|on|due|before)?\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})\\.?(?:,?\\s*(\\d{4}))?(?=\\s)`, 'i'), (m) => {
    const d = new Date(m[4] ? Number(m[4]) : today.getFullYear(), monthIndex(m[3]), Number(m[2]));
    if (!m[4] && d < today) d.setFullYear(d.getFullYear() + 1);
    setDate(d, !!m[1] && /by|before/i.test(m[1]));
    return { type: 'date' };
  }) ||
  take(/\s(by\s+|within\s+|in\s+)(\d{1,3})\s*(d|days?|w|weeks?|months?)(?=\s)/i, (m) => {
    const n = Number(m[2]);
    const unit = m[3].toLowerCase();
    const days = unit.startsWith('w') ? n * 7 : unit.startsWith('m') ? n * 30 : n;
    setDate(addDays(today, days), !/^in/i.test(m[1]));
    return { type: 'date' };
  }) ||
  take(/\s(by\s+|due\s+)?(today|tonight|tomorrow|tmrw|tmr)(?=\s)/i, (m) => {
    setDate(addDays(today, /^to(day|night)$/i.test(m[2]) ? 0 : 1), !!m[1] && /by/i.test(m[1]));
    return { type: 'date' };
  }) ||
  take(/\s(by\s+|due\s+)?(next\s+week|end\s+of\s+(?:the\s+)?week|this\s+weekend|end\s+of\s+(?:the\s+)?month|next\s+month)(?=\s)/i, (m) => {
    const p = m[2].toLowerCase();
    let d;
    if (p.startsWith('next week')) d = nextWeekday(1, today);
    else if (p.includes('weekend')) d = nextWeekday(6, today, { allowToday: true });
    else if (p.includes('week')) d = nextWeekday(5, today, { allowToday: true });
    else if (p.startsWith('next month')) d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    else d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setDate(d, !!m[1] && /by/i.test(m[1]));
    return { type: 'date' };
  }) ||
  (!out.recurrence && take(new RegExp(`\\s(by\\s+|due\\s+|on\\s+)?(next\\s+|this\\s+)?(${DAY_ALT})(?=\\s)`, 'i'), (m) => {
    const idx = weekdayIndex(m[3]);
    if (idx < 0) return false;
    const d = nextWeekday(idx, today, { allowToday: /this/i.test(m[2] || ''), skipWeek: /next/i.test(m[2] || '') && nextWeekday(idx, today) - today < 3 * 86400000 });
    setDate(d, !!m[1] && /by/i.test(m[1]));
    return { type: 'date' };
  }));

  // ---- Kind inference ----
  if (!out.kind) {
    if (out.recurrence) out.kind = 'routine';
    else if (out.date && byDeadline && daysBetween(today, out.date) >= 14) out.kind = 'goal';
    else out.kind = 'task';
  }

  out.title = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s,;:-]+|[\s,;:-]+$/g, '')
    .trim();
  if (out.title) out.title = out.title[0].toUpperCase() + out.title.slice(1);

  return out;
}

/** Monday on or before `date` — anchors weekly routines so day 1 = Monday. */
export function mondayOnOrBefore(date = new Date()) {
  const d = startOfDay(date);
  return addDays(d, -monFirst(d.getDay()));
}

/** Human summary of a parse, e.g. "Routine · Mon, Wed, Fri · 7:00 AM". */
export function describeParse(p, { formatTime }) {
  const parts = [];
  if (p.recurrence) {
    if (p.recurrence.label) parts.push(p.recurrence.label);
    else if (p.recurrence.weekdays) parts.push(p.recurrence.weekdays.map(i => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]).join(', '));
  }
  if (p.time) parts.push(formatTime(p.time) + (p.duration ? ` · ${p.duration} min` : ''));
  else if (p.duration) parts.push(`${p.duration} min`);
  return parts;
}
