import { useEffect, useRef, useState } from 'react';
import { fetchAuthConfig } from '../utils/api.js';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise = null;
let configPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { scriptPromise = null; reject(new Error('Couldn’t load Google sign-in.')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

function loadClientId() {
  if (!configPromise) {
    configPromise = fetchAuthConfig()
      .then(c => c.googleClientId || null)
      .catch(() => { configPromise = null; return null; });
  }
  return configPromise;
}

/**
 * Google's official "Continue with Google" button (Google Identity Services).
 * Renders nothing when the server has no GOOGLE_CLIENT_ID configured, so the
 * page degrades to username/password without a broken button.
 *
 * onCredential(idToken) is called after the person picks their account.
 */
export default function GoogleSignInButton({ onCredential, onError, text = 'continue_with', onAvailable }) {
  const ref = useRef(null);
  const [clientId, setClientId] = useState(undefined); // undefined = loading, null = unavailable
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    loadClientId().then(id => { if (!cancelled) { setClientId(id); onAvailable?.(!!id); } });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!clientId || !ref.current) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current?.(response.credential),
          ux_mode: 'popup',
          auto_select: false,
          itp_support: true,
        });
        const dark = document.documentElement.dataset.theme === 'dark';
        const width = Math.min(400, Math.max(220, Math.round(ref.current.getBoundingClientRect().width || 336)));
        ref.current.innerHTML = '';
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: dark ? 'filled_black' : 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'center',
          width,
        });
      })
      .catch(err => onError?.(err));
    return () => { cancelled = true; };
  }, [clientId, text]); // eslint-disable-line react-hooks/exhaustive-deps

  if (clientId === null) return null;
  return <div ref={ref} className="google-btn" aria-busy={clientId === undefined || undefined} />;
}
