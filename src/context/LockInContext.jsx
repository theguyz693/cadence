import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  loadFocusHistory,
  recordCompletedSession,
  getTodayFocusStats,
} from '../utils/lockInStorage.js';

const LockInContext = createContext(null);

export function LockInProvider({ children }) {
  const [activeSession, setActiveSession] = useState(loadActiveSession);
  const [showSetup, setShowSetup] = useState(false);
  const [presetTaskTitle, setPresetTaskTitle] = useState('');
  const [history, setHistory] = useState(loadFocusHistory);
  const [remainingSec, setRemainingSec] = useState(0);

  // Sync activeSession to localStorage
  useEffect(() => {
    saveActiveSession(activeSession);
  }, [activeSession]);

  // Calculate current remaining seconds based on timestamps
  const computeRemainingSec = useCallback((session) => {
    if (!session) return 0;
    const now = Date.now();
    const duration = session.durationSec;
    
    if (session.status === 'paused') {
      const elapsed = Math.floor((session.pausedAt - session.startTime - session.totalPausedMs) / 1000);
      return Math.max(0, duration - elapsed);
    } else if (session.status === 'running') {
      const elapsed = Math.floor((now - session.startTime - session.totalPausedMs) / 1000);
      return Math.max(0, duration - elapsed);
    } else {
      return 0;
    }
  }, []);

  // Timer loop effect
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'running') {
      if (activeSession) {
        setRemainingSec(computeRemainingSec(activeSession));
      } else {
        setRemainingSec(0);
      }
      return;
    }

    // Initial calculation
    const currentRem = computeRemainingSec(activeSession);
    setRemainingSec(currentRem);

    if (currentRem <= 0) {
      // Session finished
      handleSessionFinished(activeSession);
      return;
    }

    const timer = setInterval(() => {
      const rem = computeRemainingSec(activeSession);
      setRemainingSec(rem);
      if (rem <= 0) {
        clearInterval(timer);
        handleSessionFinished(activeSession);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [activeSession, computeRemainingSec]);

  // Handle when session timer hits 0
  const handleSessionFinished = (session) => {
    if (session.status === 'completed') return;

    if (!session.isBreak) {
      // Record completed work session to history
      const updatedHistory = recordCompletedSession({
        taskTitle: session.taskTitle,
        durationSec: session.durationSec,
        isBreak: false,
      });
      setHistory(updatedHistory);
    }

    setActiveSession(prev => prev ? { ...prev, status: 'completed' } : null);
  };

  // Action: Open setup modal (optionally prefilled with a task title)
  const openLockIn = useCallback((title = '') => {
    setPresetTaskTitle(typeof title === 'string' ? title : '');
    setShowSetup(true);
  }, []);

  // Action: Close setup modal
  const closeSetup = useCallback(() => {
    setShowSetup(false);
    setPresetTaskTitle('');
  }, []);

  // Action: Start new focus session
  const startSession = useCallback(({ taskTitle, durationMinutes, breakMinutes = 5 }) => {
    const durationSec = durationMinutes * 60;
    const now = Date.now();

    const newSession = {
      id: now.toString(36),
      taskTitle: taskTitle.trim() || 'Focus Work',
      durationSec,
      breakMinutes,
      startTime: now,
      pausedAt: null,
      totalPausedMs: 0,
      status: 'running',
      isBreak: false,
      sessionNumber: 1,
    };

    setActiveSession(newSession);
    setShowSetup(false);
    setPresetTaskTitle('');
  }, []);

  // Action: Pause current session
  const pauseSession = useCallback(() => {
    setActiveSession(prev => {
      if (!prev || prev.status !== 'running') return prev;
      return {
        ...prev,
        status: 'paused',
        pausedAt: Date.now(),
      };
    });
  }, []);

  // Action: Resume current session
  const resumeSession = useCallback(() => {
    setActiveSession(prev => {
      if (!prev || prev.status !== 'paused' || !prev.pausedAt) return prev;
      const additionalPausedMs = Date.now() - prev.pausedAt;
      return {
        ...prev,
        status: 'running',
        pausedAt: null,
        totalPausedMs: prev.totalPausedMs + additionalPausedMs,
      };
    });
  }, []);

  // Action: End session early or exit after completion
  const endSession = useCallback(() => {
    setActiveSession(null);
    clearActiveSession();
  }, []);

  // Action: Start break session
  const startBreak = useCallback((breakMins = 5) => {
    const durationSec = breakMins * 60;
    const now = Date.now();

    const breakSession = {
      id: now.toString(36),
      taskTitle: `Break Time (${activeSession?.taskTitle || 'Focus'})`,
      durationSec,
      breakMinutes: breakMins,
      startTime: now,
      pausedAt: null,
      totalPausedMs: 0,
      status: 'running',
      isBreak: true,
      sessionNumber: (activeSession?.sessionNumber || 1),
    };

    setActiveSession(breakSession);
  }, [activeSession]);

  const todayStats = getTodayFocusStats(history);

  const value = {
    activeSession,
    remainingSec,
    showSetup,
    presetTaskTitle,
    history,
    todayStats,
    openLockIn,
    closeSetup,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    startBreak,
  };

  return <LockInContext.Provider value={value}>{children}</LockInContext.Provider>;
}

export function useLockIn() {
  const ctx = useContext(LockInContext);
  if (!ctx) throw new Error('useLockIn must be used within LockInProvider');
  return ctx;
}
