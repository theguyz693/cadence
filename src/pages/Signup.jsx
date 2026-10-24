import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthLayout, AuthError, PasswordInput, DemoLink } from './AuthLayout.jsx';
import { Spinner } from '../components/ui/primitives.jsx';

const MIN_USERNAME = 2;
const MAX_USERNAME = 30;
const MIN_PASSWORD = 6;

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const u = username.trim();
  const errors = {
    username: !u ? 'Choose a username.' : u.length < MIN_USERNAME ? `At least ${MIN_USERNAME} characters.` : u.length > MAX_USERNAME ? `At most ${MAX_USERNAME} characters.` : '',
    password: !password ? 'Choose a password.' : password.length < MIN_PASSWORD ? `At least ${MIN_PASSWORD} characters.` : '',
    confirm: confirmPassword !== password ? "Passwords don't match." : '',
  };
  const show = (key, value) => (submitted || value) && errors[key];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.username || errors.password || errors.confirm) return;
    try {
      setError('');
      setIsSubmitting(true);
      await signup(u, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || "We couldn't create your account. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Routines, tasks and goals — kept in one calm place."
      footer={<>Already have an account? <Link to="/login" className="link">Sign in</Link> · Just looking? <DemoLink /></>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthError>{error}</AuthError>

        <div className={`field ${show('username', submitted) ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={MAX_USERNAME + 5}
            aria-invalid={!!show('username', submitted) || undefined}
            aria-describedby="signup-username-msg"
            autoFocus
          />
          {show('username', submitted)
            ? <div id="signup-username-msg" className="field-error">{errors.username}</div>
            : <div id="signup-username-msg" className="field-hint">This is how you'll sign in.</div>}
        </div>

        <div className={`field ${show('password', submitted) ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="signup-password">Password</label>
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            invalid={!!show('password', submitted)}
            describedBy="signup-password-msg"
          />
          <div id="signup-password-msg" className={`field-hint ${password.length >= MIN_PASSWORD ? 'is-met' : ''} ${show('password', submitted) ? 'field-error' : ''}`}>
            {password.length >= MIN_PASSWORD ? <><Check size={12} strokeWidth={2.5} /> At least {MIN_PASSWORD} characters</> : `At least ${MIN_PASSWORD} characters`}
          </div>
        </div>

        <div className={`field ${show('confirm', confirmPassword) ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="confirm-password">Confirm password</label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            invalid={!!show('confirm', confirmPassword)}
            describedBy={show('confirm', confirmPassword) ? 'confirm-error' : undefined}
          />
          {show('confirm', confirmPassword) && <div id="confirm-error" className="field-error">{errors.confirm}</div>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
          {isSubmitting ? <><Spinner /> Creating account…</> : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
