import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickAdd } from './quickParse.js';
import { toInputDate } from './dates.js';

// Saturday, Oct 24 2026, 10:00 local
const NOW = new Date(2026, 9, 24, 10, 0);
const p = (s) => parseQuickAdd(s, NOW);
const day = (d) => (d ? toInputDate(d) : null);

test('weekday list becomes a weekly routine with a time', () => {
  const r = p('gym 7am mon wed fri');
  assert.equal(r.kind, 'routine');
  assert.equal(r.title, 'Gym');
  assert.equal(r.time, '07:00');
  assert.deepEqual(r.recurrence.weekdays, [0, 2, 4]);
});

test('day lists with commas, "and", plurals', () => {
  assert.deepEqual(p('yoga on tuesday and thursday').recurrence.weekdays, [1, 3]);
  assert.deepEqual(p('swim mon, wed & sat').recurrence.weekdays, [0, 2, 5]);
  assert.deepEqual(p('piano mondays').recurrence.weekdays, [0]);
  assert.deepEqual(p('laundry every sunday').recurrence.weekdays, [6]);
});

test('daily, every other day, every N days, weekdays, 3x a week', () => {
  assert.equal(p('read 20 pages every day').recurrence.cycleLength, 1);
  assert.equal(p('read daily').title, 'Read');
  assert.equal(p('stretch every other day').recurrence.cycleLength, 2);
  assert.equal(p('water plants every 3 days').recurrence.cycleLength, 3);
  assert.deepEqual(p('standup weekdays 9:30am').recurrence.weekdays, [0, 1, 2, 3, 4]);
  assert.equal(p('standup weekdays 9:30am').time, '09:30');
  assert.deepEqual(p('run 3x a week').recurrence.weekdays, [0, 2, 4]);
});

test('single weekday is a due date, not a routine', () => {
  const r = p('pay rent friday !high');
  assert.equal(r.kind, 'task');
  assert.equal(r.title, 'Pay rent');
  assert.equal(r.priority, 'high');
  assert.equal(day(r.date), '2026-10-30');
});

test('relative dates and times', () => {
  const r = p('call mom tomorrow 6pm for 30m');
  assert.equal(r.title, 'Call mom');
  assert.equal(day(r.date), '2026-10-25');
  assert.equal(r.time, '18:00');
  assert.equal(r.duration, 30);
  assert.equal(day(p('submit form today').date), '2026-10-24');
  assert.equal(day(p('dentist in 3 days').date), '2026-10-27');
  assert.equal(day(p('review next week').date), '2026-10-26');
});

test('time ranges', () => {
  const r = p('deep work tomorrow 9-11am');
  assert.equal(r.time, '09:00');
  assert.equal(r.duration, 120);
  assert.equal(p('dinner 7:30-9pm').time, '19:30');
  assert.equal(p('lunch at noon').time, '12:00');
});

test('long "by" deadline becomes a goal; short one stays a task', () => {
  const g = p('learn spanish by dec 31');
  assert.equal(g.kind, 'goal');
  assert.equal(g.title, 'Learn spanish');
  assert.equal(day(g.date), '2026-12-31');
  assert.equal(p('finish report by friday').kind, 'task');
});

test('explicit prefixes override inference', () => {
  assert.equal(p('goal: ship portfolio by friday').kind, 'goal');
  assert.equal(p('task: read every day').kind, 'task');
  assert.equal(p('routine: meditate').kind, 'routine');
});

test('priority markers', () => {
  assert.equal(p('fix bug p1').priority, 'high');
  assert.equal(p('email bob !!').priority, 'medium');
  assert.equal(p('tidy desk !low').priority, 'low');
});

test('plain text stays a plain task and keeps its words', () => {
  const r = p('call tom about the lease');
  assert.equal(r.kind, 'task');
  assert.equal(r.title, 'Call tom about the lease');
  assert.equal(r.date, null);
  assert.equal(r.recurrence, null);
});

test('month-day dates roll into next year when past', () => {
  assert.equal(day(p('renew licence on jan 5').date), '2027-01-05');
  assert.equal(day(p('party 31st oct').date), '2026-10-31');
});
