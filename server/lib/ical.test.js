import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeed, parseCalendar, expandEvents, normaliseCalendarUrl, safeFetchCalendar } from './ical.js';

const TZ = 'Asia/Kolkata';

test('feed encodes a routine cycle as DAILY rules and round-trips', () => {
  const feed = buildFeed({
    timeZone: TZ,
    routines: [{
      id: 'r1', name: 'Strength training', cycleLength: 7, time: '07:00', duration: 60,
      startDate: '2026-10-18T18:30:00.000Z', // Mon Oct 19 00:00 IST
      createdAt: '2026-10-18T18:30:00.000Z',
      pattern: [{ active: true, label: 'Push' }, { active: false }, { active: true, label: 'Legs', time: '18:00' }, { active: false }, { active: false }, { active: false }, { active: false }],
    }],
    tasks: [
      { id: 't1', title: 'Pay rent, finally', createdAt: '2026-10-23T18:30:00.000Z', dueWithinDays: 2, completed: false },
      { id: 't2', title: 'Done already', createdAt: '2026-10-23T18:30:00.000Z', dueWithinDays: 0, completed: true },
    ],
    goals: [{ id: 'g1', title: 'Run a 10K', createdAt: '2026-10-01T00:00:00.000Z', durationDays: 30, completed: false }],
  });

  assert.match(feed, /RRULE:FREQ=DAILY;INTERVAL=7/);
  assert.match(feed, /DTSTART;TZID=Asia\/Kolkata:20261019T070000/);
  assert.match(feed, /DTSTART;TZID=Asia\/Kolkata:20261021T180000/); // per-day time override
  assert.match(feed, /SUMMARY:Pay rent\\, finally/);
  assert.doesNotMatch(feed, /Done already/);
  assert.ok(feed.split('\r\n').every(l => Buffer.byteLength(l) <= 75), 'lines are folded');

  const { events } = parseCalendar(feed);
  const occ = expandEvents(events, new Date('2026-10-26T00:00:00+05:30'), new Date('2026-11-02T00:00:00+05:30'));
  const titles = occ.map(o => o.title).sort();
  // Oct 26–Nov 1 IST: Push (Mon 26), Legs (Wed 28), rent due Mon 26, goal due Sat 31.
  assert.deepEqual(titles, ['Goal due: Run a 10K', 'Pay rent, finally', 'Strength training · Legs', 'Strength training · Push']);
  const rent = occ.find(o => o.title === 'Pay rent, finally');
  assert.equal(rent.allDay, true);
});

test('expansion honours EXDATE and overridden occurrences', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT', 'UID:s', 'SUMMARY:Standup',
    'DTSTART;TZID=America/New_York:20261019T090000', 'DTEND;TZID=America/New_York:20261019T091500',
    'RRULE:FREQ=DAILY;COUNT=10', 'EXDATE;TZID=America/New_York:20261021T090000', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:s', 'RECURRENCE-ID;TZID=America/New_York:20261022T090000', 'SUMMARY:Standup (moved)',
    'DTSTART;TZID=America/New_York:20261022T110000', 'DTEND;TZID=America/New_York:20261022T111500', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:h', 'SUMMARY:Holiday', 'DTSTART;VALUE=DATE:20261023', 'DTEND;VALUE=DATE:20261024', 'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const { events } = parseCalendar(ics);
  const occ = expandEvents(events, new Date('2026-10-20T00:00:00Z'), new Date('2026-10-24T00:00:00Z'), { calendar: 'Work' });
  const standups = occ.filter(o => o.title.startsWith('Standup'));
  assert.equal(standups.length, 3); // 20, (21 excluded), 22 moved, 23
  assert.ok(standups.some(o => o.title === 'Standup (moved)' && o.start === '2026-10-22T15:00:00.000Z'));
  assert.ok(!standups.some(o => o.start?.startsWith('2026-10-21')));
  const holiday = occ.find(o => o.title === 'Holiday');
  assert.equal(holiday.allDay, true);
  assert.equal(holiday.calendar, 'Work');
});

test('calendar links: webcal is upgraded, http and internal hosts are refused', async () => {
  assert.equal(normaliseCalendarUrl('webcal://example.com/a.ics').protocol, 'https:');
  assert.throws(() => normaliseCalendarUrl('http://example.com/a.ics'), /https/);
  assert.throws(() => normaliseCalendarUrl('not a url'), /link/);
  await assert.rejects(safeFetchCalendar('https://localhost/cal.ics'), /reachable/);
  await assert.rejects(safeFetchCalendar('https://127.0.0.1/cal.ics'), /reachable/);
  await assert.rejects(safeFetchCalendar('https://192.168.1.10/cal.ics'), /reachable/);
  await assert.rejects(safeFetchCalendar('https://[::1]/cal.ics'), /reachable/);
  await assert.rejects(safeFetchCalendar('https://169.254.169.254/latest/meta-data'), /reachable/);
});
