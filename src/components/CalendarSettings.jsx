import { useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Plus, RefreshCw, Trash2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './ui/Toast.jsx';
import { Field, IconButton, Spinner } from './ui/primitives.jsx';
import { testCalendarUrl, createFeedToken, revokeFeedToken, feedUrlFor } from '../utils/api.js';
import { clearCalendarCache } from '../hooks/useCalendarEvents.js';
import { generateId } from '../utils/helpers.js';

const COLORS = ['#3b82f6', '#16a34a', '#f59e0b', '#e11d48', '#8b5cf6', '#64748b'];
const MAX_CALENDARS = 5;

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="switch-thumb" />
    </button>
  );
}

/**
 * Settings → Calendars.
 *  1. Subscribe to external calendars by iCal link (read-only, no sign-in).
 *  2. Publish Cadence as a private feed other calendar apps can subscribe to.
 */
export default function CalendarSettings() {
  const { state, updateSettings } = useApp();
  const { isDemo } = useAuth();
  const { toast } = useToast();
  const calendars = state.settings?.calendars || [];
  const feedToken = state.settings?.calendarFeedToken || null;

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState(COLORS[calendars.length % COLORS.length]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedBusy, setFeedBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const save = (next) => { clearCalendarCache(); updateSettings({ calendars: next }); };

  const add = async (e) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) { setError('Paste your calendar’s iCal link.'); return; }
    if (calendars.length >= MAX_CALENDARS) { setError(`You can connect up to ${MAX_CALENDARS} calendars.`); return; }
    setAdding(true);
    try {
      const result = await testCalendarUrl(url.trim());
      const cal = {
        id: generateId(),
        name: name.trim() || result.name || 'Calendar',
        url: url.trim(),
        color,
        enabled: true,
      };
      save([...calendars, cal]);
      toast({ tone: 'success', title: 'Calendar connected', description: `${cal.name} · ${result.count} events found` });
      setName(''); setUrl(''); setColor(COLORS[(calendars.length + 1) % COLORS.length]);
    } catch (err) {
      setError(err.message || 'Couldn’t read that calendar.');
    } finally {
      setAdding(false);
    }
  };

  const remove = (cal) => {
    save(calendars.filter(c => c.id !== cal.id));
    toast({ title: 'Calendar removed', description: cal.name, action: { label: 'Undo', onClick: () => save(calendars) } });
  };

  const makeFeed = async () => {
    setFeedBusy(true);
    try {
      const { token } = await createFeedToken(Intl.DateTimeFormat().resolvedOptions().timeZone);
      updateSettings({ calendarFeedToken: token, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      toast({ tone: 'success', title: feedToken ? 'New feed link created' : 'Feed link created', description: feedToken ? 'The old link no longer works.' : undefined });
    } catch (err) {
      toast({ tone: 'error', title: 'Couldn’t create the feed link', description: err.message });
    } finally {
      setFeedBusy(false);
    }
  };

  const stopFeed = async () => {
    setFeedBusy(true);
    try {
      await revokeFeedToken();
      updateSettings({ calendarFeedToken: null });
      toast({ title: 'Calendar feed turned off' });
    } catch (err) {
      toast({ tone: 'error', title: 'Couldn’t turn off the feed', description: err.message });
    } finally {
      setFeedBusy(false);
    }
  };

  const feedUrl = feedToken ? feedUrlFor(feedToken) : '';
  const webcal = feedUrl.replace(/^https?:\/\//, 'webcal://');
  const isLocal = /localhost|127\.0\.0\.1/.test(feedUrl);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ tone: 'error', title: 'Couldn’t copy', description: 'Select the link and copy it manually.' });
    }
  };

  return (
    <>
      {/* ---------------- Import ---------------- */}
      {calendars.map(cal => (
        <div key={cal.id} className="settings-row cal-row">
          <span className="cal-color" style={{ background: cal.color }} aria-hidden="true" />
          <div className="grow">
            <div className="settings-row-label truncate">{cal.name}</div>
            <div className="settings-row-desc truncate">{cal.url.replace(/^(https?|webcal):\/\//, '').slice(0, 48)}…</div>
          </div>
          <Switch checked={cal.enabled !== false} onChange={(v) => save(calendars.map(c => c.id === cal.id ? { ...c, enabled: v } : c))} label={`Show ${cal.name}`} />
          <IconButton icon={Trash2} size={14} tone="danger" label={`Remove ${cal.name}`} onClick={() => remove(cal)} />
        </div>
      ))}

      <form className="settings-row is-stacked" onSubmit={add} noValidate>
        <div>
          <div className="settings-row-label">Show a calendar in Cadence</div>
          <div className="settings-row-desc">Paste a private iCal link from Google, Outlook or Apple Calendar. Events appear on Today and in Calendar — read-only, and no sign-in needed.</div>
        </div>
        <div className="cal-add-grid">
          <Field label="Link" error={error}>
            {(p) => <input {...p} className="input input-sm" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" inputMode="url" spellCheck={false} />}
          </Field>
          <Field label="Name" optional>
            {(p) => <input {...p} className="input input-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Work" maxLength={40} />}
          </Field>
        </div>
        <div className="row gap-3" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="swatches" role="radiogroup" aria-label="Calendar color">
            {COLORS.map(c => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Color ${c}`} className={`swatch swatch-sm ${color === c ? 'is-selected' : ''}`} style={{ '--swatch': c }} onClick={() => setColor(c)}>
                {color === c && <Check size={10} strokeWidth={3} />}
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" disabled={adding}>
            {adding ? <><Spinner /> Checking…</> : <><Plus size={14} strokeWidth={2} /> Connect calendar</>}
          </button>
        </div>
        <button type="button" className="disclosure" aria-expanded={helpOpen} onClick={() => setHelpOpen(o => !o)}>
          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" /> Where do I find my calendar link?
        </button>
        {helpOpen && (
          <ul className="help-list">
            <li><strong>Google Calendar</strong> (on a computer): Settings → pick your calendar under “Settings for my calendars” → <em>Integrate calendar</em> → copy <em>Secret address in iCal format</em>.</li>
            <li><strong>Outlook</strong>: Settings → Calendar → Shared calendars → <em>Publish a calendar</em> → choose “Can view all details” → copy the <em>ICS</em> link.</li>
            <li><strong>Apple iCloud</strong>: in Calendar, share the calendar → turn on <em>Public Calendar</em> → copy the link (starts with webcal://).</li>
            <li>Keep these links private — anyone with the link can see the events.</li>
          </ul>
        )}
      </form>

      {/* ---------------- Export ---------------- */}
      <div className="settings-row is-stacked">
        <div>
          <div className="settings-row-label">Show Cadence in your calendar</div>
          <div className="settings-row-desc">A private feed of your routines, dated tasks and goal deadlines. Your calendar app checks it for changes automatically.</div>
        </div>
        {isDemo ? (
          <p className="t-meta">Create an account to get your own calendar feed.</p>
        ) : feedToken ? (
          <>
            <div className="feed-url">
              <Link2 size={14} strokeWidth={1.75} aria-hidden="true" />
              <input className="input input-sm" value={feedUrl} readOnly onFocus={e => e.target.select()} aria-label="Calendar feed link" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
                {copied ? <><Check size={13} strokeWidth={2.5} /> Copied</> : <><Copy size={13} strokeWidth={1.75} /> Copy</>}
              </button>
            </div>
            {isLocal && <p className="field-hint">This link points at your computer, so Google and Outlook can only reach it once Cadence is deployed.</p>}
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <a className="btn btn-ghost btn-sm" href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noreferrer">
                Add to Google Calendar <ExternalLink size={12} strokeWidth={1.75} />
              </a>
              <a className="btn btn-ghost btn-sm" href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=Cadence`} target="_blank" rel="noreferrer">
                Add to Outlook <ExternalLink size={12} strokeWidth={1.75} />
              </a>
              <a className="btn btn-ghost btn-sm" href={webcal}>Open in Apple Calendar</a>
              <span className="grow" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={makeFeed} disabled={feedBusy}><RefreshCw size={13} strokeWidth={1.75} /> New link</button>
              <button type="button" className="btn btn-ghost btn-sm btn-danger-text" onClick={stopFeed} disabled={feedBusy}>Turn off</button>
            </div>
          </>
        ) : (
          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={makeFeed} disabled={feedBusy}>
              {feedBusy ? <Spinner /> : <Link2 size={14} strokeWidth={1.75} />} Create feed link
            </button>
          </div>
        )}
      </div>
    </>
  );
}
