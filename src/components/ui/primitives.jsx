import { useEffect, useId, useRef, useState } from 'react';

/* --------------------------------------------------------------------------
   CheckButton — the completion control used for tasks, routines and steps.
   Renders a real checkbox role so state is announced, not just colored.
   -------------------------------------------------------------------------- */
const SPARKS = 9;
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function CheckButton({ checked, onChange, label, size = 'md', shape = 'circle', disabled = false, className = '' }) {
  // A burst only on the way to "done" — un-checking stays quiet.
  const [burst, setBurst] = useState(null);
  const ref = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!checked && !prefersReducedMotion()) {
      const seed = Math.random() * 360;
      setBurst({
        key: Date.now(),
        sparks: Array.from({ length: SPARKS }, (_, i) => ({
          a: `${seed + (360 / SPARKS) * i + (Math.random() * 18 - 9)}deg`,
          d: `${16 + Math.random() * 14}px`,
        })),
      });
      setTimeout(() => setBurst(null), 700);
    }
    onChange?.(!checked);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      className={`check check-${size} check-${shape} ${checked ? 'is-checked' : ''} ${className}`}
      onClick={handleClick}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 8.4 6.7 11 12 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {burst && (
        <span className="burst" key={burst.key} aria-hidden="true">
          {burst.sparks.map((s, i) => <i key={i} style={{ '--a': s.a, '--d': s.d }} />)}
        </span>
      )}
    </button>
  );
}

/* --------------------------------------------------------------------------
   RollingNumber — each digit is a column that rolls to its value, columns a
   beat apart. The real value stays readable to assistive tech.
   -------------------------------------------------------------------------- */
export function RollingNumber({ value, className = '' }) {
  const text = String(value);
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text : text.replace(/\d/g, '0')));
  useEffect(() => {
    // Mount at zero, then roll to the value on the next frame.
    const id = requestAnimationFrame(() => setShown(text));
    const fallback = setTimeout(() => setShown(text), 120);
    return () => { cancelAnimationFrame(id); clearTimeout(fallback); };
  }, [text]);

  let col = 0;
  return (
    <span className={`roll ${className}`}>
      <span className="sr-only">{text}</span>
      <span className="roll-digits" aria-hidden="true">
        {[...text].map((ch, i) => {
          if (!/\d/.test(ch)) return <span key={`s${i}`}>{ch}</span>;
          const target = /\d/.test(shown[i] || '') ? Number(shown[i]) : 0;
          const delay = (col++) * 60;
          return (
            <span key={`d${i}`} className="roll-col">
              <span className="roll-strip" style={{ transform: `translateY(${-target}em)`, transitionDelay: `${delay}ms` }}>
                {Array.from({ length: 10 }, (_, n) => <span key={n}>{n}</span>)}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/* --------------------------------------------------------------------------
   IconButton — icon-only action with an accessible name and tooltip.
   -------------------------------------------------------------------------- */
export function IconButton({ icon: Icon, label, onClick, size = 16, tone, tooltip = true, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`icon-btn ${tone === 'danger' ? 'is-danger' : ''} ${className}`}
      aria-label={label}
      data-tooltip={tooltip ? label : undefined}
      onClick={onClick}
      {...rest}
    >
      <Icon size={size} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

/* --------------------------------------------------------------------------
   Progress
   -------------------------------------------------------------------------- */
export function ProgressBar({ value, max = 1, label, tone = 'accent', size = 'md' }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div
      className={`progress progress-${size} progress-${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="progress-fill" style={{ transform: `scaleX(${pct})` }} />
    </div>
  );
}

export function ProgressRing({ value, max = 1, size = 44, stroke = 4, label, children }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className={`ring-fill ${pct >= 1 ? 'is-complete' : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="ring-content">{children}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Segmented control (single choice). Arrow keys move the selection.
   -------------------------------------------------------------------------- */
export function Segmented({ value, onChange, options, label, size = 'md', disabled = false }) {
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % options.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + options.length) % options.length;
    if (next === null) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className={`segmented segmented-${size} ${disabled ? 'is-disabled' : ''}`} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map((opt, i) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={`segmented-item ${selected ? 'is-selected' : ''}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden="true" />}
            <span>{opt.label}</span>
            {opt.count !== undefined && <span className="segmented-count t-num">{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Empty state
   -------------------------------------------------------------------------- */
export function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`empty ${compact ? 'empty-compact' : ''}`}>
      {Icon && (
        <div className="empty-icon" aria-hidden="true">
          <Icon size={compact ? 18 : 20} strokeWidth={1.6} />
        </div>
      )}
      <div className="empty-title">{title}</div>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Skeleton
   -------------------------------------------------------------------------- */
export function Skeleton({ width = '100%', height = 14, radius, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/* --------------------------------------------------------------------------
   Field — label + control + hint/error, wired with ids for assistive tech.
   Children is a render function receiving the control props.
   -------------------------------------------------------------------------- */
export function Field({ label, hint, error, optional, children, className = '' }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {optional && <span className="field-optional">Optional</span>}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && <div id={hintId} className="field-hint">{hint}</div>}
      {error && <div id={errorId} className="field-error" role="alert">{error}</div>}
    </div>
  );
}

export function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

/* --------------------------------------------------------------------------
   Page header
   -------------------------------------------------------------------------- */
export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <header className="page-header">
      <div className="grow">
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1 className="t-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Spinner({ size = 14 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}
