import { useState, useEffect, useCallback } from 'react';
import { useLockIn } from '../context/LockInContext.jsx';
import { formatTimerDisplay } from '../utils/lockInStorage.js';
import {
  Play,
  Pause,
  Square,
  Check,
  Coffee,
  RotateCcw,
  ArrowLeft,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import LockInMusicPlayer from './LockInMusicPlayer.jsx';
import Logo from './Logo.jsx';

export default function LockInScreen() {
  const {
    activeSession,
    remainingSec,
    pauseSession,
    resumeSession,
    endSession,
    startBreak,
    openLockIn,
  } = useLockIn();

  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcuts listener
  useEffect(() => {
    if (!activeSession) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (activeSession.status === 'running') {
          pauseSession();
        } else if (activeSession.status === 'paused') {
          resumeSession();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (showConfirmExit) {
          setShowConfirmExit(false);
        } else if (activeSession.status !== 'completed') {
          setShowConfirmExit(true);
        } else {
          endSession();
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSession, showConfirmExit, pauseSession, resumeSession, endSession]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  if (!activeSession) return null;

  const isRunning = activeSession.status === 'running';
  const isPaused = activeSession.status === 'paused';
  const isCompleted = activeSession.status === 'completed';
  const isBreak = activeSession.isBreak;

  const durationSec = activeSession.durationSec || 1;
  const progressRatio = Math.max(0, Math.min(1, remainingSec / durationSec));

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const durationMinutesLabel = Math.round(durationSec / 60);

  const statusText = isCompleted ? (isBreak ? 'Break over' : 'Session complete') : isBreak ? 'On a break' : isPaused ? 'Paused' : 'Locked in';

  return (
    <div
      className={`focus-mode ${isBreak ? 'is-break' : ''} ${isCompleted ? 'is-complete' : ''} ${isPaused ? 'is-paused' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Focus session: ${activeSession.taskTitle}`}
    >
      <div className="focus-top">
        <div className="focus-brand">
          <Logo size={16} />
          <span>Cadence</span>
        </div>
        <div className="row gap-1">
          <button type="button" className="focus-ghost-btn" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}>
            {isFullscreen ? <Minimize2 size={15} strokeWidth={1.75} /> : <Maximize2 size={15} strokeWidth={1.75} />}
            <span className="focus-btn-text">{isFullscreen ? 'Exit full screen' : 'Full screen'}</span>
          </button>
          <button
            type="button"
            className="focus-ghost-btn"
            onClick={() => (isCompleted ? endSession() : setShowConfirmExit(true))}
            aria-label="Leave focus mode"
          >
            <X size={15} strokeWidth={1.75} />
            <span className="focus-btn-text">Leave</span>
          </button>
        </div>
      </div>

      <div className="focus-center">
        <div className="focus-status" aria-live="polite">
          <span className={`focus-status-dot ${isRunning ? 'is-running' : ''}`} aria-hidden="true" />
          {statusText}
        </div>

        <h2 className="focus-title">{activeSession.taskTitle}</h2>

        <div className="focus-timer">
          <svg viewBox="0 0 320 320" aria-hidden="true">
            <circle className="focus-ring-track" cx="160" cy="160" r={radius} strokeWidth="3" fill="none" />
            <circle
              className="focus-ring-fill"
              cx="160"
              cy="160"
              r={radius}
              strokeWidth="3"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 160 160)"
            />
          </svg>
          <div className="focus-time">
            <div className="focus-countdown t-num" role="timer" aria-label={`${Math.floor(remainingSec / 60)} minutes ${remainingSec % 60} seconds remaining`}>
              {formatTimerDisplay(remainingSec)}
            </div>
            {!isCompleted && (
              <div className="focus-meta t-num">
                {isBreak ? `${durationMinutesLabel} min break` : `${durationMinutesLabel} min session`}
              </div>
            )}
          </div>
        </div>

        {isCompleted ? (
          <div className="focus-complete">
            <div className="focus-complete-icon" aria-hidden="true"><Check size={22} strokeWidth={2.5} /></div>
            <p className="focus-complete-text">
              {isBreak
                ? 'Ready for the next one?'
                : <>You focused for <strong>{durationMinutesLabel} {durationMinutesLabel === 1 ? 'minute' : 'minutes'}</strong> on {activeSession.taskTitle}.</>}
            </p>
            <div className="focus-actions">
              {!isBreak && activeSession.breakMinutes > 0 && (
                <button type="button" className="focus-btn focus-btn-primary" onClick={() => startBreak(activeSession.breakMinutes)}>
                  <Coffee size={16} strokeWidth={1.75} /> Take a {activeSession.breakMinutes} min break
                </button>
              )}
              <button
                type="button"
                className="focus-btn"
                onClick={() => { const t = activeSession.taskTitle; endSession(); openLockIn(t); }}
              >
                <RotateCcw size={16} strokeWidth={1.75} /> Another session
              </button>
              <button type="button" className="focus-btn focus-btn-ghost" onClick={endSession}>
                <ArrowLeft size={16} strokeWidth={1.75} /> Back to Cadence
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="focus-actions">
              {isRunning ? (
                <button type="button" className="focus-btn focus-btn-primary" onClick={pauseSession}>
                  <Pause size={16} strokeWidth={2} /> Pause
                </button>
              ) : (
                <button type="button" className="focus-btn focus-btn-primary" onClick={resumeSession}>
                  <Play size={16} strokeWidth={2} /> Resume
                </button>
              )}
              <button type="button" className="focus-btn focus-btn-ghost" onClick={() => setShowConfirmExit(true)}>
                <Square size={13} strokeWidth={2} /> End
              </button>
            </div>
            <LockInMusicPlayer />
          </>
        )}

        <div className="focus-hints" aria-hidden="true">
          <span><kbd>Space</kbd> pause</span>
          <span><kbd>F</kbd> full screen</span>
          <span><kbd>Esc</kbd> leave</span>
        </div>
      </div>

      {showConfirmExit && (
        <div className="focus-confirm-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowConfirmExit(false); }}>
          <div className="focus-confirm" role="alertdialog" aria-modal="true" aria-labelledby="focus-confirm-title" aria-describedby="focus-confirm-desc">
            <h3 id="focus-confirm-title">End this session early?</h3>
            <p id="focus-confirm-desc">The timer stops and this session won't be logged.</p>
            <div className="focus-confirm-actions">
              <button type="button" className="focus-btn" onClick={() => setShowConfirmExit(false)} autoFocus>Keep going</button>
              <button type="button" className="focus-btn focus-btn-danger" onClick={() => { setShowConfirmExit(false); endSession(); }}>End session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
