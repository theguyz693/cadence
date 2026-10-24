import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

/**
 * Accessible dropdown menu.
 *
 * <Menu
 *   label="Task actions"
 *   trigger={(props) => <button {...props}>…</button>}
 *   items={[{ label, icon: Icon, onSelect, tone: 'danger', shortcut, checked }, { type: 'separator' }, { type: 'label', label }]}
 *   align="end"
 * />
 *
 * Portalled with fixed positioning so it never clips inside scroll containers;
 * flips above the trigger when there is not enough room below.
 */
export default function Menu({ trigger, items, align = 'end', label, width = 200 }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const actionable = items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => !item.type && !item.disabled);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const place = useCallback(() => {
    const t = triggerRef.current;
    const m = menuRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const mh = m?.offsetHeight || 200;
    const mw = m?.offsetWidth || width;
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < mh + 12 && r.top > mh + 12 ? r.top - mh - 6 : r.bottom + 6;
    let left = align === 'end' ? r.right - mw : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
    setPos({ top, left });
  }, [align, width]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      close(false);
    };
    const onScroll = () => close(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) menuRef.current?.focus({ preventScroll: true });
  }, [open]);

  const select = (item) => {
    close(true);
    // Defer so focus restoration happens before the action (which may open a dialog).
    setTimeout(() => item.onSelect?.(), 0);
  };

  const onMenuKeyDown = (e) => {
    const n = actionable.length;
    if (!n) return;
    const cur = actionable.findIndex(a => a.i === activeIndex);
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(actionable[(cur + 1) % n].i); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(actionable[(cur - 1 + n) % n].i); }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIndex(actionable[0].i); }
    else if (e.key === 'End') { e.preventDefault(); setActiveIndex(actionable[n - 1].i); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const it = items[activeIndex];
      if (it && !it.type && !it.disabled) select(it);
    } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'Tab') { close(false); }
  };

  const triggerProps = {
    ref: triggerRef,
    type: 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    'aria-label': label,
    onClick: (e) => { e.stopPropagation(); setOpen(o => !o); },
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        const list = e.key === 'ArrowDown' ? actionable : [...actionable].reverse();
        if (list[0]) setActiveIndex(list[0].i);
      }
    },
  };

  return (
    <>
      {trigger(triggerProps, open)}
      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          className="menu"
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, minWidth: width }}
          onKeyDown={onMenuKeyDown}
          aria-activedescendant={activeIndex >= 0 ? `${menuId}-${activeIndex}` : undefined}
        >
          {items.map((item, i) => {
            if (item.type === 'separator') return <div key={i} className="menu-separator" role="separator" />;
            if (item.type === 'label') return <div key={i} className="menu-label">{item.label}</div>;
            const Icon = item.icon;
            return (
              <div
                key={i}
                id={`${menuId}-${i}`}
                role={item.checked !== undefined ? 'menuitemradio' : 'menuitem'}
                aria-checked={item.checked !== undefined ? !!item.checked : undefined}
                aria-disabled={item.disabled || undefined}
                className={`menu-item ${item.tone === 'danger' ? 'is-danger' : ''} ${activeIndex === i ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={(e) => { e.stopPropagation(); if (!item.disabled) select(item); }}
              >
                <span className="menu-item-icon" aria-hidden="true">
                  {item.checked !== undefined
                    ? (item.checked ? <Check size={14} strokeWidth={2} /> : null)
                    : Icon && <Icon size={15} strokeWidth={1.75} />}
                </span>
                <span className="grow truncate">{item.label}</span>
                {item.shortcut && <kbd className="kbd">{item.shortcut}</kbd>}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
