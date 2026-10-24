/**
 * iCal helpers for Cadence.
 *  - safeFetchCalendar: download a user-supplied .ics link without letting it
 *    reach internal hosts (SSRF guard), with a timeout and size cap.
 *  - expandEvents: turn parsed VEVENTs (incl. RRULE/EXDATE/overrides) into
 *    concrete occurrences within a date range.
 *  - buildFeed: render a user's routines/tasks/goals as an .ics feed.
 */
import dns from 'node:dns/promises';
import net from 'node:net';
import ical from 'node-ical';

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}

export function normaliseCalendarUrl(raw) {
  let value = String(raw || '').trim();
  if (/^webcals?:\/\//i.test(value)) value = value.replace(/^webcals?:\/\//i, 'https://');
  let url;
  try { url = new URL(value); } catch { throw new Error('That doesn’t look like a link.'); }
  if (url.protocol !== 'https:') throw new Error('Use a secure (https) calendar link.');
  if (url.username || url.password) throw new Error('Links with embedded passwords aren’t supported.');
  return url;
}

async function assertPublicHost(url) {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('That address isn’t reachable.');
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addresses.length || addresses.some(a => isPrivateAddress(a.address))) throw new Error('That address isn’t reachable.');
}

/** Download an .ics file from a user-supplied link, safely. */
export async function safeFetchCalendar(rawUrl) {
  let url = normaliseCalendarUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'text/calendar, text/plain;q=0.9, */*;q=0.1', 'User-Agent': 'Cadence-Calendar/1.0' },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = normaliseCalendarUrl(new URL(res.headers.get('location'), url).toString());
      continue;
    }
    if (!res.ok) throw new Error(res.status === 404 ? 'Calendar not found — the link may have been reset.' : `The calendar server answered ${res.status}.`);
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > MAX_BYTES) throw new Error('That calendar is too large to import.');

    // Stream with a hard cap in case content-length was missing or wrong.
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { reader.cancel(); throw new Error('That calendar is too large to import.'); }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('That link didn’t return a calendar (.ics) file.');
    return text;
  }
  throw new Error('Too many redirects.');
}

// ---------------------------------------------------------------------------
// Parsing + expansion
// ---------------------------------------------------------------------------

export function parseCalendar(text) {
  const data = ical.sync.parseICS(text);
  const name = data.vcalendar?.['WR-CALNAME'] || null;
  const events = Object.values(data).filter(e => e && e.type === 'VEVENT');
  return { name, events };
}

const pad = (n) => String(n).padStart(2, '0');
/** Local (server) Y-M-D for date-only values, which node-ical builds at local midnight. */
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function isAllDay(ev) {
  return ev.datetype === 'date' || ev.start?.dateOnly === true;
}

function lookupKeyed(map, date, allDay) {
  if (!map) return undefined;
  return allDay ? map[ymd(date)] : (map[date.toISOString()] ?? map[ymd(date)]);
}

/** Concrete occurrences of the given VEVENTs overlapping [from, to). */
export function expandEvents(events, from, to, { calendar, color, limit = 500 } = {}) {
  const out = [];
  for (const ev of events) {
    if (!ev.start || ev.status === 'CANCELLED') continue;
    if (ev.recurrenceid) continue; // overrides are applied via the master's `recurrences`
    const allDay = isAllDay(ev);
    const start = new Date(ev.start);
    const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + (allDay ? 86400000 : 3600000));
    const duration = Math.max(0, end - start);

    const starts = ev.rrule
      ? ev.rrule.between(new Date(from.getTime() - duration), to, true)
      : [start];

    for (const occ of starts) {
      if (lookupKeyed(ev.exdate, occ, allDay)) continue;
      const override = lookupKeyed(ev.recurrences, occ, allDay);
      const src = override || ev;
      if (src.status === 'CANCELLED') continue;
      const oStart = override ? new Date(override.start) : new Date(occ);
      const oEnd = override?.end ? new Date(override.end) : new Date(oStart.getTime() + duration);
      if (oEnd <= from || oStart >= to) continue;

      const base = {
        id: `${ev.uid || 'event'}-${oStart.toISOString()}`,
        title: String(src.summary || 'Busy'),
        location: src.location ? String(src.location) : undefined,
        calendar,
        color,
      };
      if (allDay) out.push({ ...base, allDay: true, date: ymd(oStart), endDate: ymd(oEnd) });
      else out.push({ ...base, allDay: false, start: oStart.toISOString(), end: oEnd.toISOString() });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Feed (Cadence → your calendar)
// ---------------------------------------------------------------------------

function esc(text) {
  return String(text ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Fold lines longer than 75 octets per RFC 5545. */
function fold(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts = [];
  let cur = '';
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch, 'utf8') > (parts.length ? 74 : 75)) { parts.push(cur); cur = ''; }
    cur += ch;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

/** Calendar date (Y, M, D) of an instant in a given IANA time zone. */
function partsInZone(iso, timeZone) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const [y, m, d] = f.format(new Date(iso)).split('-').map(Number);
  return { y, m, d };
}

function addDaysYmd({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

const ymdCompact = ({ y, m, d }) => `${y}${pad(m)}${pad(d)}`;
const cmpYmd = (a, b) => (a.y - b.y) || (a.m - b.m) || (a.d - b.d);
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function dtLines(day, time, duration, timeZone) {
  if (!time) {
    return [`DTSTART;VALUE=DATE:${ymdCompact(day)}`, `DTEND;VALUE=DATE:${ymdCompact(addDaysYmd(day, 1))}`];
  }
  const [hh, mm] = time.split(':');
  return [`DTSTART;TZID=${timeZone}:${ymdCompact(day)}T${hh}${mm}00`, `DURATION:PT${Math.max(5, duration || 30)}M`];
}

/**
 * Build an .ics document. Each scheduled day of a routine's cycle becomes a
 * DAILY rule with INTERVAL = cycle length — an exact encoding of the cycle.
 */
export function buildFeed({ routines, tasks, goals, timeZone = 'UTC', appUrl = '' }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadence//Rhythm feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Cadence',
    `X-WR-TIMEZONE:${timeZone}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];
  const now = stamp();

  for (const r of routines) {
    if (!r.startDate || !r.cycleLength) continue;
    const anchor = partsInZone(r.startDate, timeZone);
    const tracking = r.createdAt ? partsInZone(r.createdAt, timeZone) : anchor;
    (r.pattern || []).forEach((day, i) => {
      if (!day?.active) return;
      let first = addDaysYmd(anchor, i);
      while (cmpYmd(first, tracking) < 0) first = addDaysYmd(first, r.cycleLength);
      const time = day.time || r.time || null;
      lines.push(
        'BEGIN:VEVENT',
        `UID:routine-${r.id}-d${i}@cadence`,
        `DTSTAMP:${now}`,
        ...dtLines(first, time, r.duration, timeZone),
        `RRULE:FREQ=DAILY;INTERVAL=${r.cycleLength}`,
        `SUMMARY:${esc(day.label ? `${r.name} · ${day.label}` : r.name)}`,
        `DESCRIPTION:${esc(`Day ${i + 1} of a ${r.cycleLength}-day routine in Cadence.${appUrl ? ` ${appUrl}/routines` : ''}`)}`,
        'CATEGORIES:Routine',
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      );
    });
  }

  for (const t of tasks) {
    if (t.completed || t.dueWithinDays === null || t.dueWithinDays === undefined || !t.createdAt) continue;
    const due = addDaysYmd(partsInZone(t.createdAt, timeZone), Number(t.dueWithinDays));
    lines.push(
      'BEGIN:VEVENT',
      `UID:task-${t.id}@cadence`,
      `DTSTAMP:${now}`,
      ...dtLines(due, t.time, t.duration, timeZone),
      `SUMMARY:${esc(t.title)}`,
      t.description ? `DESCRIPTION:${esc(t.description)}` : null,
      'CATEGORIES:Task',
      t.time ? 'TRANSP:OPAQUE' : 'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }

  for (const g of goals) {
    if (g.completed || !g.createdAt) continue;
    const due = addDaysYmd(partsInZone(g.createdAt, timeZone), Number(g.durationDays) || 0);
    lines.push(
      'BEGIN:VEVENT',
      `UID:goal-${g.id}@cadence`,
      `DTSTAMP:${now}`,
      ...dtLines(due, null, null, timeZone),
      `SUMMARY:${esc(`Goal due: ${g.title}`)}`,
      'CATEGORIES:Goal',
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).map(fold).join('\r\n') + '\r\n';
}
