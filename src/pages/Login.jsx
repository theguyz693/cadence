import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthLayout, AuthError, PasswordInput, DemoLink, GoogleAuth } from './AuthLayout.jsx';
import { Spinner } from '../components/ui/primitives.jsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!username.trim()) errs.username = 'Enter your username.';
    if (!password) errs.password = 'Enter your password.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setError('');
      setIsSubmitting(true);
      await login(username.trim(), password);
      const from = location.state?.from?.pathname;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up your rhythm where you left it."
      footer={<>New to Cadence? <Link to="/signup" className="link">Create an account</Link> or <DemoLink /></>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthError>{error}</AuthError>
        <GoogleAuth text="continue_with" onError={setError} />

        <div className={`field ${fieldErrors.username ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setFieldErrors(f => ({ ...f, username: '' })); }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!fieldErrors.username || undefined}
            aria-describedby={fieldErrors.username ? 'username-error' : undefined}
            autoFocus
          />
          {fieldErrors.username && <div id="username-error" className="field-error">{fieldErrors.username}</div>}
        </div>

        <div className={`field ${fieldErrors.password ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: '' })); }}
            autoComplete="current-password"
            invalid={!!fieldErrors.password}
            describedBy={fieldErrors.password ? 'password-error' : undefined}
          />
          {fieldErrors.password && <div id="password-error" className="field-error">{fieldErrors.password}</div>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
          {isSubmitting ? <><Spinner /> Signing in…</> : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
