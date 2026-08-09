import { useState, useEffect } from 'react';
import { useLockIn } from '../context/LockInContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import Modal from './Modal.jsx';
import { Lock, Zap, CheckSquare, Target } from 'lucide-react';

export default function LockInModal() {
  const { showSetup, closeSetup, presetTaskTitle, startSession } = useLockIn();
  const { state } = useApp();

  const [taskTitle, setTaskTitle] = useState('');
  const [duration, setDuration] = useState(25); // minutes
  const [customDuration, setCustomDuration] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [breakMins, setBreakMins] = useState(5);

  // Sync preset task title when modal opens
  useEffect(() => {
    if (showSetup) {
      setTaskTitle(presetTaskTitle || '');
      setIsCustom(false);
      setCustomDuration('');
      setDuration(25);
    }
  }, [showSetup, presetTaskTitle]);

  if (!showSetup) return null;

  const activeTasks = state?.tasks?.filter(t => !t.completed) || [];
  const activeGoals = state?.goals?.filter(g => !g.completed) || [];

  const handleSelectPreset = (mins) => {
    setIsCustom(false);
    setDuration(mins);
  };

  const handleCustomChange = (val) => {
    setIsCustom(true);
    setCustomDuration(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setDuration(num);
    }
  };

  const handleStart = () => {
    const finalTitle = taskTitle.trim() || 'Deep Work Session';
    const finalMins = isCustom ? (parseInt(customDuration, 10) || 25) : duration;
    startSession({
      taskTitle: finalTitle,
      durationMinutes: Math.max(1, Math.min(240, finalMins)),
      breakMinutes: breakMins,
    });
  };

  return (
    <Modal
      isOpen={showSetup}
      onClose={closeSetup}
      title="LOCK IN — FOCUS SESSION"
      footer={
        <>
          <button className="btn btn-secondary" onClick={closeSetup}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleStart} style={{ background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={15} strokeWidth={2} /> START LOCK IN
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">What are you working on?</label>
        <input
          className="form-input"
          value={taskTitle}
          onChange={e => setTaskTitle(e.target.value)}
          placeholder="e.g. Finish LC209 / Capstone Work..."
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleStart()}
        />

        {/* Quick select from active Tasks or Goals */}
        {(activeTasks.length > 0 || activeGoals.length > 0) && (
          <div className="lock-in-quick-select">
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              Or pick from active items:
            </span>
            <div className="lock-in-item-chips">
              {activeTasks.slice(0, 3).map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`lock-in-chip ${taskTitle === t.title ? 'active' : ''}`}
                  onClick={() => setTaskTitle(t.title)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <CheckSquare size={11} strokeWidth={1.75} /> {t.title}
                </button>
              ))}
              {activeGoals.slice(0, 3).map(g => (
                <button
                  key={g.id}
                  type="button"
                  className={`lock-in-chip ${taskTitle === g.title ? 'active' : ''}`}
                  onClick={() => setTaskTitle(g.title)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Target size={11} strokeWidth={1.75} /> {g.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Focus Duration</label>
        <div className="lock-in-preset-grid">
          {[25, 50, 90].map(mins => (
            <button
              key={mins}
              type="button"
              className={`preset-btn ${!isCustom && duration === mins ? 'active' : ''}`}
              onClick={() => handleSelectPreset(mins)}
            >
              <span className="preset-time">{mins}</span>
              <span className="preset-unit">min</span>
            </button>
          ))}
          <button
            type="button"
            className={`preset-btn ${isCustom ? 'active' : ''}`}
            onClick={() => setIsCustom(true)}
          >
            <span className="preset-time">Custom</span>
            <span className="preset-unit">min</span>
          </button>
        </div>

        {isCustom && (
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <input
              type="number"
              className="form-input"
              placeholder="Enter duration in minutes (e.g. 15, 45, 60)"
              min={1}
              max={240}
              value={customDuration}
              onChange={e => handleCustomChange(e.target.value)}
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Break Preference</label>
        <div className="lock-in-break-selector">
          {[
            { label: '5 min break', value: 5 },
            { label: '10 min break', value: 10 },
            { label: 'No break', value: 0 },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`break-chip ${breakMins === opt.value ? 'active' : ''}`}
              onClick={() => setBreakMins(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
