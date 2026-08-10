import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, signupApi, logoutApi, fetchMeApi, getToken, setToken } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    async function initAuth() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await fetchMeApi();
        setUser(userData);
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginApi({ username, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (username, password) => {
    const data = await signupApi({ username, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network failure on logout
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
