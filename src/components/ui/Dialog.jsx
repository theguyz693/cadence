import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_MS = 140;

/**
 * Accessible modal dialog.
 * - Portalled, labelled, aria-modal
 * - Traps focus, restores focus to the opener on close
 * - Escape and backdrop click close it
 * - Plays a short exit transition before unmounting
 */
export default function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
  hideClose = false,
}) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mount / unmount with exit animation
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
      const opener = openerRef.current;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll lock while open
  useEffect(() => {
    if (!mounted) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mounted]);

  // Initial focus: first [data-autofocus], else first field, else panel
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target =
      panel.querySelector('[data-autofocus]') ||
      panel.querySelector('.dialog-body input, .dialog-body textarea, .dialog-body select') ||
      panel;
    target.focus({ preventScroll: true });
  }, [isOpen, mounted]);

  if (!mounted) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current?.();
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || [])
      .filter(n => n.offsetParent !== null || n === document.activeElement);
    if (nodes.length === 0) { e.preventDefault(); return; }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return createPortal(
    <div
      className="dialog-backdrop"
      data-state={closing ? 'closed' : 'open'}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`dialog dialog-${size} ${className}`}
        data-state={closing ? 'closed' : 'open'}
        onKeyDown={handleKeyDown}
      >
        {(title || !hideClose) && (
          <div className="dialog-header">
            <div className="grow">
              {title && <h2 id={titleId} className="dialog-title">{title}</h2>}
              {description && <p id={descId} className="dialog-description">{description}</p>}
            </div>
            {!hideClose && (
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
                <X size={16} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
