import { useState, useEffect, useCallback } from 'react';
import { useLockIn } from '../context/LockInContext.jsx';
import { formatTimerDisplay } from '../utils/lockInStorage.js';
import {
  Lock,
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
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  if (!activeSession) return null;

  const isRunning = activeSession.status === 'running';
  const isPaused = activeSession.status === 'paused';
  const isCompleted = activeSession.status === 'completed';
  const isBreak = activeSession.isBreak;

  const durationSec = activeSession.durationSec || 1;
  const progressRatio = Math.max(0, Math.min(1, remainingSec / durationSec));

  // SVG Circular progress ring calculations
  const strokeWidth = 8;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const durationMinutesLabel = Math.round(durationSec / 60);

  return (
    <div className={`lock-in-overlay ${isBreak ? 'break-mode' : ''} ${isCompleted ? 'completed-mode' : ''}`}>
      {/* Background ambient glow animation */}
      <div className="lock-in-ambient-glow" />
      <div className="lock-in-noise-overlay" />

      {/* Top Header Bar */}
      <div className="lock-in-header-bar">
        <div className="lock-in-brand">
          <span className="lock-in-logo-icon" style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)' }}>
            <Lock size={18} strokeWidth={2} />
          </span>
          <span className="lock-in-brand-text">CADENCE LOCK IN</span>
        </div>
        <div className="lock-in-top-actions">
          <button
            className="btn btn-ghost btn-sm lock-in-header-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {isFullscreen ? <Minimize2 size={13} strokeWidth={1.75} /> : <Maximize2 size={13} strokeWidth={1.75} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            className="btn btn-ghost btn-sm lock-in-header-btn"
            onClick={() => {
              if (isCompleted) {
                endSession();
              } else {
                setShowConfirmExit(true);
              }
            }}
            title="Close Focus Mode (Esc)"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <X size={13} strokeWidth={1.75} /> Exit
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="lock-in-center-container">
        
        {/* State Badge */}
        <div className="lock-in-status-pill">
          <span className={`status-dot ${isRunning ? 'pulsing' : isPaused ? 'paused' : 'done'}`} />
          <span>
            {isCompleted
              ? 'SESSION COMPLETE'
              : isBreak
              ? 'REST & RECHARGE'
              : isPaused
              ? 'PAUSED'
              : 'LOCKED IN'}
          </span>
        </div>

        {/* Task Title */}
        <h2 className="lock-in-task-title">
          {activeSession.taskTitle}
        </h2>

        {/* ============ CIRCULAR TIMER RING ============ */}
        <div className="lock-in-timer-wrapper">
          <svg className="lock-in-timer-svg" viewBox="0 0 320 320">
            {/* Background Track */}
            <circle
              className="lock-in-timer-bg-track"
              cx="160"
              cy="160"
              r={radius}
              strokeWidth={strokeWidth}
            />
            {/* Active Progress Fill */}
            <circle
              className="lock-in-timer-fill"
              cx="160"
              cy="160"
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Time Display */}
          <div className="lock-in-timer-content">
            <div className="lock-in-countdown-text">
              {formatTimerDisplay(remainingSec)}
            </div>
            {!isCompleted && (
              <div className="lock-in-session-meta">
                {isBreak ? 'Break Time' : `Session ${activeSession.sessionNumber || 1} · ${durationMinutesLabel}m`}
              </div>
            )}
          </div>
        </div>

        {/* ============ CONTROLS & COMPLETION STATES ============ */}
        {isCompleted ? (
          <div className="lock-in-completion-card">
            <div className="completion-icon-pulse">
              <Check size={32} strokeWidth={2.5} />
            </div>
            <h3 className="completion-heading">Great focus work!</h3>
            <p className="completion-subtext">
              You completed {durationMinutesLabel} minutes on <strong>{activeSession.taskTitle}</strong>.
            </p>

            <div className="completion-action-buttons">
              {!isBreak && activeSession.breakMinutes > 0 && (
                <button
                  className="btn btn-primary lock-in-action-btn"
                  onClick={() => startBreak(activeSession.breakMinutes)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Coffee size={16} strokeWidth={1.75} /> Take {activeSession.breakMinutes} Min Break
                </button>
              )}

              <button
                className="btn btn-secondary lock-in-action-btn"
                onClick={() => {
                  const currentTitle = activeSession.taskTitle;
                  endSession();
                  openLockIn(currentTitle);
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <RotateCcw size={16} strokeWidth={1.75} /> Start Another Session
              </button>

              <button
                className="btn btn-ghost lock-in-action-btn"
                onClick={endSession}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} strokeWidth={1.75} /> Return to Cadence
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="lock-in-controls-row">
              {isRunning ? (
                <button className="btn btn-secondary lock-in-ctrl-btn" onClick={pauseSession} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pause size={16} strokeWidth={2} /> Pause
                </button>
              ) : (
                <button className="btn btn-primary lock-in-ctrl-btn" onClick={resumeSession} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Play size={16} strokeWidth={2} /> Resume
                </button>
              )}

              <button
                className="btn btn-ghost lock-in-ctrl-btn"
                onClick={() => setShowConfirmExit(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Square size={14} strokeWidth={2} /> End Session
              </button>
            </div>

            {/* Lock In Mode Optional Music Player */}
            <LockInMusicPlayer />
          </>
        )}

        {/* Keyboard shortcut legend */}
        <div className="lock-in-keyboard-hints">
          <span><kbd>Space</kbd> Pause/Resume</span>
          <span><kbd>Esc</kbd> Exit</span>
          <span><kbd>F</kbd> Fullscreen</span>
        </div>
      </div>

      {/* Confirmation Exit Modal */}
      {showConfirmExit && (
        <div className="lock-in-modal-overlay" onClick={() => setShowConfirmExit(false)}>
          <div className="lock-in-confirm-box" onClick={e => e.stopPropagation()}>
            <h3>End Focus Session?</h3>
            <p>Ending early will stop the countdown. Are you sure?</p>
            <div className="lock-in-confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirmExit(false)}>
                Keep Focusing
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowConfirmExit(false);
                  endSession();
                }}
              >
                Yes, End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
