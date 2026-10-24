import { useEffect, useState } from 'react';
import { fetchCalendarEvents } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';
import { toInputDate } from '../utils/dates.js';

// Small in-memory cache so moving between Today and Calendar doesn't refetch.
const cache = new Map();
const TTL = 5 * 60 * 1000;

/**
 * Events from the user's subscribed calendars (iCal links) between two dates.
 * Returns { events, loading, error }. Empty and idle when no calendars are set up.
 */
export function useCalendarEvents(from, to) {
  const { state } = useApp();
  const calendars = state.settings?.calendars || [];
  const signature = calendars.filter(c => c.enabled !== false).map(c => `${c.id}:${c.url}:${c.color}`).join('|');
  const key = `${toInputDate(from)}_${toInputDate(to)}_${signature}`;
  const [result, setResult] = useState(() => cache.get(key)?.value || { events: [], loading: !!signature, error: null });

  useEffect(() => {
    if (!signature) { setResult({ events: [], loading: false, error: null }); return undefined; }
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) { setResult(hit.value); return undefined; }
    let cancelled = false;
    setResult(r => ({ ...r, loading: true }));
    fetchCalendarEvents(from.toISOString(), to.toISOString())
      .then(data => {
        const value = { events: data.events || [], loading: false, error: data.errors?.length ? data.errors : null };
        cache.set(key, { at: Date.now(), value });
        if (!cancelled) setResult(value);
      })
      .catch(err => { if (!cancelled) setResult({ events: [], loading: false, error: [{ message: err.message }] }); });
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}

export function clearCalendarCache() {
  cache.clear();
}
