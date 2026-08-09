import { useLockIn } from '../context/LockInContext.jsx';
import { formatMinutesLabel } from '../utils/lockInStorage.js';
import { Lock, Zap } from 'lucide-react';

export default function FocusTodayWidget() {
  const { todayStats, openLockIn } = useLockIn();

  return (
    <div className="glass-panel focus-today-widget glow-border">
      <div className="glass-panel-header">
        <div>
          <span className="glass-panel-title">Focus Today</span>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
            TOTAL: {formatMinutesLabel(todayStats.totalMinutes)} FOCUSED ({todayStats.count} SESSIONS)
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => openLockIn()}
          style={{ background: 'var(--accent-gradient)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Lock size={12} strokeWidth={2} /> LOCK IN
        </button>
      </div>

      {todayStats.sessions.length === 0 ? (
        <div style={{ padding: 'var(--space-md) 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
            No focus sessions logged today yet. Lock in to build your momentum!
          </p>
        </div>
      ) : (
        <div className="focus-today-chips-row">
          {todayStats.sessions.map((session) => {
            const mins = Math.round((session.durationSec || 0) / 60);
            return (
              <div key={session.id} className="focus-session-chip" title={session.taskTitle}>
                <span className="focus-chip-icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <Zap size={12} strokeWidth={1.75} style={{ color: 'var(--accent-primary)' }} />
                </span>
                <span className="focus-chip-task">{session.taskTitle}</span>
                <span className="focus-chip-time">{mins}m</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
