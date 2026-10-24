import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const MAX_TOASTS = 3;

let nextId = 1;

/**
 * Lightweight toast system.
 * toast({ title, description?, tone?: 'success'|'error'|'info'|'neutral', action?: { label, onClick }, duration? })
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts(list => list.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 160);
  }, []);

  const toast = useCallback((opts) => {
    const id = nextId++;
    const entry = {
      id,
      tone: 'neutral',
      duration: opts.action ? 6000 : 3500,
      ...opts,
    };
    setToasts(list => [...list.slice(-(MAX_TOASTS - 1)), entry]);
    if (entry.duration !== Infinity) {
      timers.current.set(id, setTimeout(() => dismiss(id), entry.duration));
    }
    return id;
  }, [dismiss]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifications">
        <ol aria-live="polite" aria-relevant="additions">
          {toasts.map(t => {
            const Icon = ICONS[t.tone];
            return (
              <li
                key={t.id}
                className={`toast toast-${t.tone}`}
                data-state={t.leaving ? 'closed' : 'open'}
                role={t.tone === 'error' ? 'alert' : 'status'}
              >
                {Icon && <Icon size={16} strokeWidth={2} className="toast-icon" aria-hidden="true" />}
                <div className="toast-content">
                  <div className="toast-title">{t.title}</div>
                  {t.description && <div className="toast-description">{t.description}</div>}
                </div>
                {t.action && (
                  <button
                    type="button"
                    className="toast-action"
                    onClick={() => { t.action.onClick(); dismiss(t.id); }}
                  >
                    {t.action.label}
                  </button>
                )}
                <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                  <X size={14} strokeWidth={2} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
