import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Repeat, CheckSquare, Target, Sun, Lock, Timer, Command, MoonStar,
  Smartphone, History, ShieldCheck, Coffee, Music, Keyboard,
} from 'lucide-react';
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
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
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
        loop
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
const FEATURES = [
  { Icon: History, title: 'Catch up honestly', text: 'Forgot to check in yesterday? Tap the day. Days before a routine existed never count against you.' },
  { Icon: ShieldCheck, title: 'Streaks that mean something', text: 'Consistency is calculated from real check-ins only. No inflated numbers, no gamified guilt.' },
  { Icon: Target, title: 'Goals with a next step', text: 'Break a goal into steps. Today shows the next one, so progress happens in small daily moves.' },
  { Icon: Command, title: 'Fast from the keyboard', text: 'Press ⌘K to jump anywhere or create anything. N adds a task, L starts a focus session.' },
  { Icon: MoonStar, title: 'Light, dark, or system', text: 'A calm interface designed for both, with an accent color that’s yours.' },
  { Icon: Smartphone, title: 'At home on your phone', text: 'A native-feeling layout with a tab bar and bottom sheets. Check in from anywhere.' },
];

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
          <a href="#features">Features</a>
        </nav>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <button type="button" className="btn btn-primary btn-sm" onClick={tryDemo}>Try the demo</button>
        </div>
      </header>

      <main id="landing-main">
        {/* ---------------- Hero ---------------- */}
        <section className="hero">
          <div className="hero-copy">
            {/* Each line rises from behind its own baseline (masked line reveal) */}
            <h1 className="hero-title lines">
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
            <Reveal immediate as="p" className="hero-note t-meta" delay={400}>No signup needed for the demo. It runs entirely in your browser.</Reveal>
          </div>
          <Reveal immediate className="hero-visual" delay={120}>
            <SequencerPlayground />
          </Reveal>
        </section>

        {/* ---------------- Preview ---------------- */}
        <section className="landing-section preview-section" aria-labelledby="preview-title">
          <Reveal className="section-head">
            <h2 id="preview-title" className="section-title">One calm view of your day</h2>
            <p className="section-sub">Today answers one question, what’s next, and keeps everything else a glance away.</p>
          </Reveal>
          <Reveal delay={80} className="shutter"><ProductPreview /></Reveal>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how" className="landing-section" aria-labelledby="how-title">
          <Reveal className="section-head">
            <h2 id="how-title" className="section-title">How it works</h2>
          </Reveal>
          <ol className="steps">
            {[
              { Icon: Repeat, title: 'Design a routine', text: 'Pick a cycle from 1 to 20 days and the days it runs. Label them: Push, Pull, Long run.' },
              { Icon: Check, title: 'Check in each day', text: 'Today lists what’s due. One tap marks it done; the sequence fills in as you go.' },
              { Icon: Lock, title: 'Lock in to do the work', text: 'Start a timed, distraction-free session on any routine, task or goal.' },
            ].map((s, i) => (
              <Reveal as="li" key={s.title} className="step" delay={i * 80}>
                <span className="step-num t-num">{i + 1}</span>
                <span className="step-icon" aria-hidden="true"><s.Icon size={18} strokeWidth={1.75} /></span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-text">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ---------------- Lock In ---------------- */}
        <section id="lock-in" className="lockin-band" aria-labelledby="lockin-title">
          <div className="lockin-inner">
            <Reveal className="lockin-copy">
              <h2 id="lockin-title" className="section-title">When it’s time to work, lock in.</h2>
              <p className="section-sub">
                One task. One timer. Nothing else on screen. Cadence logs every finished session so you can see where your focus actually went.
              </p>
              <ul className="lockin-list">
                <li><Timer size={15} strokeWidth={1.75} aria-hidden="true" /> 25, 50 or 90 minutes, or any length you like</li>
                <li><Coffee size={15} strokeWidth={1.75} aria-hidden="true" /> Breaks that start when you’re ready</li>
                <li><Music size={15} strokeWidth={1.75} aria-hidden="true" /> Built-in focus sounds, or bring your own</li>
                <li><Keyboard size={15} strokeWidth={1.75} aria-hidden="true" /> Space to pause, F for full screen</li>
              </ul>
            </Reveal>
            <Reveal delay={100}><LockInFilm /></Reveal>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="landing-section" aria-labelledby="features-title">
          <Reveal className="section-head">
            <h2 id="features-title" className="section-title">Small details, done properly</h2>
          </Reveal>
          <ul className="features">
            {FEATURES.map((f, i) => (
              <Reveal as="li" key={f.title} className="feature" delay={(i % 3) * 70}>
                <span className="feature-icon" aria-hidden="true"><f.Icon size={18} strokeWidth={1.75} /></span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-text">{f.text}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="landing-cta" aria-labelledby="cta-title">
          <Reveal>
            <h2 id="cta-title" className="cta-title">Your rhythm. Your rules.</h2>
            <p className="section-sub">See it with a lived-in workspace in one click, or start fresh with your own.</p>
            <div className="hero-ctas hero-ctas-center">
              <button type="button" className="btn btn-primary btn-lg" onClick={tryDemo}>Try the live demo <ArrowRight size={16} strokeWidth={2} /></button>
              <Link to="/signup" className="btn btn-secondary btn-lg">Create free account</Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="brand"><Logo size={16} /><span className="brand-name">Cadence</span></div>
        <span className="t-meta">© {new Date().getFullYear()} Cadence</span>
        <div className="landing-footer-links">
          <Link to="/login">Sign in</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </footer>
    </div>
  );
}
