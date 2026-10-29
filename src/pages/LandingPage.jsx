import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Repeat, CheckSquare, Target, Sun, Lock, Timer, Command, MoonStar, SunMedium,
  Smartphone, History, ShieldCheck, Coffee, Music, Keyboard, CalendarDays, Plus,
} from 'lucide-react';
import { revealAppearance } from '../utils/themeReveal.js';
import { storeAppearance } from '../hooks/useAppearance.js';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

/* --------------------------------------------------------------------------
   Reveal-on-scroll wrapper
   -------------------------------------------------------------------------- */
function Reveal({ children, className = '', as: Tag = 'div', delay = 0, immediate = false }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (immediate) return undefined;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setShown(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`${immediate ? 'reveal-now' : `reveal ${shown ? 'is-shown' : ''}`} ${className}`}
      style={immediate ? { animationDelay: `${delay}ms` } : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------------------
   Sequencer playground — the hero. A real, clickable version of the
   routine sequencer so visitors "get" Cadence in a few seconds.
   -------------------------------------------------------------------------- */
const PRESETS = {
  ppl: { label: 'Push / Pull / Legs', name: 'Strength training', days: ['Push', 'Pull', 'Legs', null, 'Upper', 'Lower', null], today: 4, missed: [2] },
  three: { label: '3× a week', name: 'Morning run', days: ['Run', null, 'Run', null, 'Run', null, null], today: 4, missed: [] },
  block: { label: '10-day block', name: '10K training block', days: ['Easy', null, 'Intervals', null, 'Tempo', null, null, 'Easy', null, 'Long run'], today: 7, missed: [] },
  daily: { label: 'Every day', name: 'Read 20 pages', days: ['', '', '', '', '', '', ''], today: 5, missed: [3] },
};

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function SequencerPlayground() {
  const [presetKey, setPresetKey] = useState('ppl');
  const preset = PRESETS[presetKey];
  const [done, setDone] = useState(() => new Set());
  const [revealed, setRevealed] = useState(0); // how many past days have "played in"

  // Play the cycle in: past scheduled days fill one by one up to today.
  useEffect(() => {
    const initial = new Set(preset.days.map((d, i) => (d !== null && i < preset.today && !preset.missed.includes(i) ? i : -1)).filter(i => i >= 0));
    setDone(initial);
    if (prefersReducedMotion()) { setRevealed(preset.today); return undefined; }
    setRevealed(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= preset.today) clearInterval(t);
    }, 140);
    return () => clearInterval(t);
  }, [presetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (i) => setDone(s => {
    const next = new Set(s);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  const scheduledSoFar = preset.days.filter((d, i) => d !== null && i <= preset.today).length;
  const doneSoFar = [...done].filter(i => i <= preset.today).length;
  const todayLabel = preset.days[preset.today];
  const todayActive = todayLabel !== null;
  const trackPct = preset.days.length > 1 ? (Math.min(revealed, preset.today) / (preset.days.length - 1)) * 100 : 0;

  return (
    <div
      className="playground"
      aria-label="Interactive routine sequencer demo"
      onPointerMove={(e) => {
        // A lamp that follows the pointer across the card (decorative, this element only).
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      <div className="playground-head">
        <span className="routine-icon routine-icon-lg" aria-hidden="true"><Repeat size={18} strokeWidth={1.75} /></span>
        <div className="grow">
          <div className="playground-title">{preset.name}</div>
          <div className="t-meta t-num">
            {preset.days.length}-day cycle · Day {preset.today + 1} of {preset.days.length}
          </div>
        </div>
        {todayActive && (
          <button
            type="button"
            className={`today-toggle ${done.has(preset.today) ? 'is-done' : ''}`}
            onClick={() => toggle(preset.today)}
            aria-pressed={done.has(preset.today)}
          >
            <span className={`check ${done.has(preset.today) ? 'is-checked' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 16 16"><path d="M4 8.4 6.7 11 12 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span>{done.has(preset.today) ? 'Done today' : `Today${todayLabel ? ` · ${todayLabel}` : ''}`}</span>
          </button>
        )}
      </div>

      <ol className={`sequence-track playground-track ${preset.days.length > 7 ? 'is-long' : ''}`} style={{ '--track-progress': `${trackPct}%` }}>
        {preset.days.map((label, i) => {
          const active = label !== null;
          const isToday = i === preset.today;
          const past = i < preset.today;
          const visible = i < revealed || !past;
          let status = 'rest';
          if (active) {
            if (done.has(i) && (visible || isToday)) status = 'done';
            else if (isToday) status = 'today';
            else if (past && visible) status = 'missed';
            else if (past) status = 'upcoming';
            else status = 'upcoming';
          }
          const clickable = active && (past || isToday);
          const Inner = (
            <>
              <span className="sequence-num t-num" aria-hidden="true">{i + 1}</span>
              <span className="sequence-step" aria-hidden="true">
                {status === 'done' && <Check size={14} strokeWidth={2.5} />}
              </span>
              <span className="sequence-label" aria-hidden="true">{isToday ? 'Today' : label}</span>
            </>
          );
          return (
            <li key={`${presetKey}-${i}`} className={`sequence-day is-${status} ${isToday ? 'is-current' : ''}`}>
              {clickable ? (
                <button
                  type="button"
                  className="sequence-hit"
                  onClick={() => toggle(i)}
                  aria-pressed={done.has(i)}
                  aria-label={`Day ${i + 1}${label ? `, ${label}` : ''}: ${done.has(i) ? 'done' : 'not done'}`}
                >
                  {Inner}
                </button>
              ) : (
                <div className="sequence-hit" role="img" aria-label={`Day ${i + 1}: ${active ? 'scheduled' : 'rest day'}`}>{Inner}</div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="playground-foot">
        <span className="t-meta t-num" aria-live="polite">
          <strong>{doneSoFar}</strong> of {scheduledSoFar} scheduled days done this cycle
        </span>
        <span className="t-meta playground-hint">Tap a day to check it off</span>
      </div>

      <div className="playground-presets" role="radiogroup" aria-label="Try a pattern">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={presetKey === key}
            className={`chip ${presetKey === key ? 'is-selected' : ''}`}
            onClick={() => setPresetKey(key)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Product preview — a faithful, static rendering of the Today screen,
   built from the app's own styles.
   -------------------------------------------------------------------------- */
function StaticCheck({ checked }) {
  return (
    <span className={`check ${checked ? 'is-checked' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 16 16"><path d="M4 8.4 6.7 11 12 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

function MiniSeq({ states }) {
  return (
    <div className="sequence sequence-compact">
      <ol className="sequence-track">
        {states.map((s, i) => (
          <li key={i} className={`sequence-day is-${s.replace('*', '')} ${s.includes('*') ? 'is-current' : ''}`}>
            <div className="sequence-hit"><span className="sequence-step" /></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="preview" role="img" aria-label="Preview of the Cadence Today screen: progress summary, the next action, today's routines and tasks.">
      <div className="preview-body" aria-hidden="true">
        <aside className="preview-side">
          <div className="brand"><Logo size={16} /><span className="brand-name">Cadence</span></div>
          <div className="preview-nav is-active"><Sun size={14} /> Today <span className="nav-count">3</span></div>
          <div className="preview-nav"><Repeat size={14} /> Routines</div>
          <div className="preview-nav"><CheckSquare size={14} /> Tasks</div>
          <div className="preview-nav"><Target size={14} /> Goals</div>
          <div className="preview-lock"><Lock size={13} /> Lock in</div>
        </aside>
        <div className="preview-main">
          <div className="page-eyebrow">Saturday, October 24</div>
          <div className="preview-h1">Good morning, Alex</div>
          <div className="summary">
            <div className="summary-main">
              <svg width="40" height="40" viewBox="0 0 40 40" className="preview-ring">
                <circle cx="20" cy="20" r="17" strokeWidth="4" fill="none" className="ring-track" />
                <circle cx="20" cy="20" r="17" strokeWidth="4" fill="none" className="ring-fill" strokeDasharray="106.8" strokeDashoffset="53.4" strokeLinecap="round" transform="rotate(-90 20 20)" />
              </svg>
              <div>
                <div className="summary-headline">3 of 6 done today</div>
                <div className="t-meta">Routines due today plus tasks due today.</div>
              </div>
            </div>
            <dl className="summary-stats">
              <div><dt>Routines</dt><dd>1<span>/3</span></dd></div>
              <div><dt>Focus</dt><dd>1h 15m</dd></div>
            </dl>
          </div>
          <div className="up-next">
            <div className="up-next-label">Up next</div>
            <div className="up-next-body">
              <span className="routine-icon"><Repeat size={14} /></span>
              <div className="grow"><div className="up-next-title">Strength training · Upper</div><div className="t-meta">Day 5 of 7</div></div>
              <span className="btn btn-primary btn-sm"><Check size={13} /> Mark done</span>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><span className="t-section">Routines</span><span className="t-meta">1 of 3</span></div>
            <ul className="item-list">
              <li className="item-row"><StaticCheck /><div className="item-main"><span className="item-title">Strength training <span className="item-tag">Upper</span></span><span className="item-notes">Day 5 of 7</span></div><MiniSeq states={['done', 'done', 'missed', 'rest', 'today*', 'upcoming', 'rest']} /></li>
              <li className="item-row is-done"><StaticCheck checked /><div className="item-main"><span className="item-title">Read 20 pages</span><span className="item-notes">Day 1 of 1</span></div><MiniSeq states={['done*']} /></li>
              <li className="item-row"><StaticCheck /><div className="item-main"><span className="item-title">Spanish practice <span className="item-tag">Listening</span></span><span className="item-notes">Day 2 of 3</span></div><MiniSeq states={['done', 'today*', 'rest']} /></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Lock In — the existing cinematic clip, played only while on screen.
   -------------------------------------------------------------------------- */
function LockInFilm() {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || !('IntersectionObserver' in window) || prefersReducedMotion()) return undefined;
    // Plays once and rests on the "LOCK IN." title; the clip's final frames fade to black,
    // so it stops at HOLD instead of its true end. Scrolling back never restarts it.
    const HOLD = 2.25;
    let finished = false;
    const hold = () => { finished = true; v.pause(); v.currentTime = HOLD; };
    let raf = 0;
    const watch = () => {
      if (v.currentTime >= HOLD) { hold(); return; }
      raf = requestAnimationFrame(watch);
    };
    const onPlay = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(watch); };
    v.addEventListener('play', onPlay);
    v.addEventListener('ended', hold);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!finished) v.play().catch(() => {}); } else v.pause();
    }, { threshold: 0.4 });
    io.observe(v);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('ended', hold);
    };
  }, []);
  return (
    <div className="film">
      <video
        ref={ref}
        className="film-video"
        src="/finallockvid.mp4"
        poster="/video-poster.jpg"
        muted
        playsInline
        preload="metadata"
        aria-label="Lock In: a short title animation"
      />
      <div className="film-timer" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="2" className="film-ring-track" />
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="2" className="film-ring-fill" strokeDasharray="339.3" strokeLinecap="round" transform="rotate(-90 60 60)" />
        </svg>
        <span className="t-num">25:00</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   Hero diagram — the things you already juggle converge on one centre.
   Concepts are Cadence's own (routines, tasks, goals, calendar), not an
   invented screen. Orbit lines carry a slow dash flow; still under reduced motion.
   -------------------------------------------------------------------------- */
const INPUTS = [
  { Icon: Repeat, label: 'Routines', sub: 'Push, Pull, Legs', x: 4, y: 10 },
  { Icon: CheckSquare, label: 'Tasks', sub: 'Pay rent, Friday', x: 62, y: 4 },
  { Icon: Target, label: 'Goals', sub: '3 of 6 steps', x: 66, y: 74 },
  { Icon: CalendarDays, label: 'Calendar', sub: 'Google, Outlook', x: 2, y: 78 },
];

function HeroDiagram() {
  return (
    <div className="diagram" role="img" aria-label="Your routines, tasks, goals and calendar flow into one Today view in Cadence.">
      <svg className="diagram-orbits" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="44" ry="38" />
        <ellipse cx="50" cy="50" rx="30" ry="26" />
        {INPUTS.map((n, i) => (
          <line key={n.label} className="diagram-link" x1={n.x + 15} y1={n.y + 8} x2="50" y2="50" style={{ animationDelay: `${i * -1.3}s` }} />
        ))}
      </svg>
      <div className="diagram-core" aria-hidden="true">
        <span className="diagram-core-mark"><Logo size={22} /></span>
        <span className="diagram-core-title">Today</span>
        <span className="diagram-core-sub">What’s next, in one place</span>
      </div>
      {INPUTS.map(({ Icon, label, sub, x, y }, i) => (
        <div key={label} className="diagram-tile" style={{ left: `${x}%`, top: `${y}%`, '--i': i }} aria-hidden="true">
          <span className="diagram-tile-icon"><Icon size={15} strokeWidth={1.9} /></span>
          <span className="diagram-tile-text"><b>{label}</b><small>{sub}</small></span>
        </div>
      ))}
    </div>
  );
}

/** Light / dark for signed-out pages, remembered on this device. */
function ThemeToggle() {
  const [mode, setMode] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dataset.theme : 'light'));
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      aria-label={`Switch to ${next} mode`}
      data-tooltip={next === 'dark' ? 'Dark mode' : 'Light mode'}
      onClick={(e) => revealAppearance({ theme: next, ui: 'standard' }, () => { storeAppearance({ theme: next }); setMode(next); }, e.currentTarget)}
    >
      {mode === 'dark' ? <SunMedium size={17} strokeWidth={1.75} /> : <MoonStar size={17} strokeWidth={1.75} />}
    </button>
  );
}

const FACTS = [
  ['1 to 20 days', 'Cycle length for any routine'],
  ['Plain English', 'Type “gym 7am mon wed fri” and it just works'],
  ['Two-way calendar', 'Google, Outlook and Apple'],
  ['Up to 4 hours', 'In one Lock In focus session'],
];

const STEPS = [
  { title: 'Design a routine', text: 'Pick a cycle from 1 to 20 days and the days it runs. Label them: Push, Pull, Long run.' },
  { title: 'Check in each day', text: 'Today lists what’s due. One tap marks it done, and the sequence fills in as you go.' },
  { title: 'Lock in to do the work', text: 'Start a timed, distraction-free session on any routine, task or goal.' },
];

const BENEFITS = [
  { Icon: History, title: 'Catch up honestly', text: 'Forgot yesterday? Tap the day. Days before a routine existed never count against you.' },
  { Icon: ShieldCheck, title: 'Streaks that mean something', text: 'Consistency comes from real check-ins only. No inflated numbers.' },
  { Icon: Command, title: 'Fast from the keyboard', text: 'Press ⌘ K to jump anywhere. Q adds anything in plain English.' },
  { Icon: Smartphone, title: 'At home on your phone', text: 'A native-feeling layout with a tab bar and bottom sheets.' },
];

const FAQ = [
  ['What is a cycle?', 'A routine repeats every N days, from 1 to 20. You choose which days in the cycle it runs, so every other day, 5 on and 2 off, or a 10-day training block all fit.'],
  ['Can I catch up on a missed day?', 'Yes. Tap any past scheduled day in the sequence to mark it done. Days before you created the routine never count as missed.'],
  ['Does it work with my calendar?', 'Paste your Google, Outlook or Apple calendar link and its events appear on Today. Cadence can also publish a private feed your calendar subscribes to.'],
  ['What happens in the demo?', 'You get a sample workspace with a few weeks of history, stored only in your browser. Nothing is sent to a server, and exiting the demo deletes it.'],
];

const PARTS = [
  { title: 'Routines', text: 'Cycles from 1 to 20 days with labels and times. Catch up on a missed day with one tap.', art: 'seq' },
  { title: 'Tasks', text: 'One-off things with real due dates and priorities. Type them the way you would say them.', art: 'task' },
  { title: 'Goals', text: 'A deadline and the steps to get there. Today always shows the next one.', art: 'goal' },
];

function PartArt({ kind }) {
  if (kind === 'seq') return <MiniSeq states={['done', 'done', 'missed', 'rest', 'today*', 'upcoming', 'rest']} />;
  if (kind === 'task') return <div className="card-art-row"><StaticCheck /><span>Pay rent</span><em>Fri</em></div>;
  return <div className="card-art-goal"><span className="card-art-bar"><i /></span><em>3 of 6</em></div>;
}

export default function LandingPage() {
  const { startDemo } = useAuth();
  const navigate = useNavigate();

  const tryDemo = () => {
    startDemo();
    navigate('/', { replace: true });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="landing">
      <a href="#landing-main" className="skip-link">Skip to content</a>

      <header className="landing-nav">
        <Link to="/" className="brand" aria-label="Cadence home">
          <Logo size={20} />
          <span className="brand-name">Cadence</span>
        </Link>
        <nav className="landing-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#lock-in">Lock In</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="landing-nav-actions">
          <ThemeToggle />
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <button type="button" className="btn btn-primary btn-sm" onClick={tryDemo}>Try the demo</button>
        </div>
      </header>

      <main id="landing-main">
        {/* ---------------- Opening ---------------- */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title lines">
              <span className="line"><span data-line style={{ '--i': 0 }}>Keep a rhythm,</span></span>
              <span className="line"><span data-line style={{ '--i': 1 }}>not a to-do list.</span></span>
            </h1>
            <Reveal immediate as="p" className="hero-sub" delay={260}>
              Cadence repeats what matters on cycles you design, from every day to a 20-day training block,
              and always shows you what to do next.
            </Reveal>
            <Reveal immediate className="hero-ctas" delay={340}>
              <button type="button" className="btn btn-primary btn-lg" onClick={tryDemo}>
                Try the live demo <ArrowRight size={16} strokeWidth={2} />
              </button>
              <Link to="/signup" className="btn btn-secondary btn-lg">Create free account</Link>
            </Reveal>
            <Reveal immediate as="p" className="hero-note" delay={400}>No signup for the demo. It runs entirely in your browser.</Reveal>
          </div>
          <Reveal immediate className="hero-visual" delay={160}>
            <HeroDiagram />
          </Reveal>
        </section>

        <dl className="facts" aria-label="Cadence at a glance">
          {FACTS.map(([value, label], i) => (
            <Reveal key={value} className="fact" delay={i * 60}>
              <dt>{value}</dt>
              <dd>{label}</dd>
            </Reveal>
          ))}
        </dl>

        {/* ---------------- Pale field: the live sequencer + the three parts ---------------- */}
        <section className="band band-muted" aria-labelledby="rhythm-title">
          <div className="band-inner">
            <div className="prose-pair">
              <Reveal className="prose-pair-text">
                <h2 id="rhythm-title" className="section-title">Design your rhythm, then just follow it</h2>
                <p className="section-sub">
                  A routine in Cadence is a cycle, not a checkbox. Pick the length and the days, and the sequence keeps your place,
                  whether you train three times a week or study every other day. Try it: tap a day.
                </p>
              </Reveal>
              <Reveal delay={80}><SequencerPlayground /></Reveal>
            </div>

            <div className="cards-3">
              {PARTS.map((c, i) => (
                <Reveal as="article" key={c.title} className="card-ed" delay={i * 70}>
                  <div className="card-ed-art" aria-hidden="true"><PartArt kind={c.art} /></div>
                  <h3 className="card-ed-title">{c.title}</h3>
                  <p className="card-ed-text">{c.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Dark field: process, Lock In, benefits ---------------- */}
        <section id="how" className="band band-field" aria-labelledby="how-title">
          <div className="band-inner">
            <Reveal className="section-head-left">
              <h2 id="how-title" className="section-title">How it works</h2>
            </Reveal>
            <ol className="steps-row">
              {STEPS.map((step, i) => (
                <Reveal as="li" key={step.title} className="step-row" delay={i * 80}>
                  <span className="step-row-num t-fig">{i + 1}</span>
                  <h3 className="step-row-title">{step.title}</h3>
                  <p className="step-row-text">{step.text}</p>
                </Reveal>
              ))}
            </ol>

            <div id="lock-in" className="lockin-split">
              <Reveal className="lockin-copy">
                <h2 className="section-title">When it’s time to work, lock in.</h2>
                <p className="section-sub">One task. One timer. Nothing else on screen. Every finished session is logged, so you can see where your focus went.</p>
                <ul className="lockin-list">
                  <li><Timer size={15} strokeWidth={1.75} aria-hidden="true" /> 25, 50 or 90 minutes, or any length you like</li>
                  <li><Coffee size={15} strokeWidth={1.75} aria-hidden="true" /> Breaks that start when you’re ready</li>
                  <li><Music size={15} strokeWidth={1.75} aria-hidden="true" /> Built-in focus sounds, or bring your own</li>
                  <li><Keyboard size={15} strokeWidth={1.75} aria-hidden="true" /> Space to pause, F for full screen</li>
                </ul>
              </Reveal>
              <Reveal delay={100}><LockInFilm /></Reveal>
            </div>

            <div className="benefits">
              <Reveal as="h2" className="benefits-title section-title">Small details, done properly</Reveal>
              <ul className="benefits-list">
                {BENEFITS.map((b, i) => (
                  <Reveal as="li" key={b.title} className="benefit" delay={(i % 2) * 70}>
                    <b.Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                    <div>
                      <h3 className="benefit-title">{b.title}</h3>
                      <p className="benefit-text">{b.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------- Pale: the product, then questions ---------------- */}
        <section className="band" aria-labelledby="preview-title">
          <div className="band-inner">
            <Reveal className="section-head">
              <h2 id="preview-title" className="section-title">One calm view of your day</h2>
              <p className="section-sub">Today answers one question, what’s next, and keeps everything else a glance away.</p>
            </Reveal>
            <Reveal delay={80} className="shutter"><ProductPreview /></Reveal>

            <div id="questions" className="faq">
              <Reveal as="h2" className="section-title faq-title">Questions</Reveal>
              <div className="faq-list">
                {FAQ.map(([q, a]) => (
                  <details key={q} className="faq-item">
                    <summary><span>{q}</span><Plus size={18} strokeWidth={1.75} aria-hidden="true" className="faq-plus" /></summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Dark close ---------------- */}
        <section className="band band-field band-close" aria-labelledby="cta-title">
          <div className="band-inner close-inner">
            <Reveal>
              <h2 id="cta-title" className="cta-title">Your rhythm. Your rules.</h2>
              <p className="section-sub">See a lived-in workspace in one click, or start fresh with your own.</p>
            </Reveal>
            <Reveal className="hero-ctas" delay={80}>
              <button type="button" className="btn btn-primary btn-lg" onClick={tryDemo}>Try the live demo <ArrowRight size={16} strokeWidth={2} /></button>
              <Link to="/signup" className="btn btn-secondary btn-lg">Create free account</Link>
            </Reveal>
          </div>
          <footer className="landing-footer">
            <div className="brand"><Logo size={16} /><span className="brand-name">Cadence</span></div>
            <div className="landing-footer-links">
              <Link to="/login">Sign in</Link>
              <Link to="/signup">Create account</Link>
              <a href="#questions">Questions</a>
            </div>
            <span className="landing-footer-copy">© {new Date().getFullYear()} Cadence</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
