import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Eye, EyeOff, CircleAlert } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { Spinner } from '../components/ui/primitives.jsx';

/** Shared frame for sign-in and sign-up. */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <header className="auth-top">
        <Link to="/" className="brand" aria-label="Cadence home">
          <Logo size={18} />
          <span className="brand-name">Cadence</span>
        </Link>
      </header>
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-head">
            <h1 className="t-title">{title}</h1>
            {subtitle && <p className="t-secondary">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <p className="auth-footer">{footer}</p>}
      </main>
    </div>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div className="auth-error" role="alert">
      <CircleAlert size={15} strokeWidth={2} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Password input with a visibility toggle. */
export function PasswordInput({ id, value, onChange, autoComplete, invalid, describedBy, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-affix">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="input-affix-btn"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
      </button>
    </div>
  );
}

/** "Just looking?" entry point into the sample workspace. */
export function DemoLink() {
  const { startDemo } = useAuth();
  const navigate = useNavigate();
  return (
    <button type="button" className="link link-button" onClick={() => { startDemo(); navigate('/', { replace: true }); }}>
      try the demo
    </button>
  );
}

/**
 * "Continue with Google" plus an "or" divider. Shows nothing at all when the
 * server isn't configured for Google, so the page falls back cleanly.
 */
export function GoogleAuth({ text = 'continue_with', onError }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (credential) => {
    setBusy(true);
    onError?.('');
    try {
      await loginWithGoogle(credential);
      const from = location.state?.from?.pathname;
      navigate(from && !['/login', '/signup'].includes(from) ? from : '/', { replace: true });
    } catch (err) {
      onError?.(err.message || 'Google sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className={`google-auth ${available ? 'is-available' : ''}`}>
      <div className="google-auth-button" aria-hidden={busy || undefined}>
        <GoogleSignInButton text={text} onCredential={handle} onAvailable={setAvailable} onError={(e) => onError?.(e.message)} />
        {busy && <div className="google-auth-busy" role="status"><Spinner /> Signing you in…</div>}
      </div>
      {available && <div className="auth-divider" role="separator"><span>or</span></div>}
    </div>
  );
}
