import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import { ACCENT_THEMES } from '../utils/helpers.js';
import { AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { state, clearAll, updateSettings } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Custom GIF inputs
  const currentAccent = state.settings?.accentColor || 'indigo';
  const showBanner = state.settings?.showBanner !== false;
  const bgBlur = state.settings?.bgBlur ?? 25;
  const bgDim = state.settings?.bgDim ?? 60;
  const activeBackground = state.settings?.activeBackground || 'random';
  const customBackgrounds = state.settings?.customBackgrounds || [];

  const totalTasks = state.tasks.length;
  const totalGoals = state.goals.length;
  const totalRoutines = state.routines.length;

  const handleClearAll = () => {
    clearAll();
    setShowConfirm(false);
  };

  const handleAccentChange = (colorKey) => {
    updateSettings({ accentColor: colorKey });
  };

  const handleToggleBanner = () => {
    updateSettings({ showBanner: !showBanner });
  };

  const handleActiveBgChange = (value) => {
    updateSettings({ activeBackground: value });
  };

  const handleSlotUrlChange = (slotId, url) => {
    const updated = customBackgrounds.map(bg =>
      bg.id === slotId ? { ...bg, url } : bg
    );
    updateSettings({ customBackgrounds: updated });
  };

  const handleSlotNameChange = (slotId, name) => {
    const updated = customBackgrounds.map(bg =>
      bg.id === slotId ? { ...bg, name } : bg
    );
    updateSettings({ customBackgrounds: updated });
  };

  return (
    <div className="centered-page-container">
      <div className="page-header">
        <h2>Settings</h2>
        <p>App preferences and data management</p>
      </div>

      {/* Data overview */}
      <div className="settings-section">
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Data Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
          <div className="stat-card">
            <div className="stat-card-value">{totalTasks}</div>
            <div className="stat-card-label">Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{totalGoals}</div>
            <div className="stat-card-label">Goals</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{totalRoutines}</div>
            <div className="stat-card-label">Routines</div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="settings-section">
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Appearance
        </h3>
        
        {/* Accent Color Theme */}
        <div className="settings-row">
          <div className="settings-row-label">
            <span>Color Palette Theme</span>
            <span>Choose a curated primary gradient theme</span>
          </div>
          <div className="accent-color-picker">
            {Object.entries(ACCENT_THEMES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleAccentChange(key)}
                className={`accent-swatch ${currentAccent === key ? 'selected' : ''}`}
                style={{ backgroundColor: value.primary, color: value.primary }}
                title={value.name}
              />
            ))}
          </div>
        </div>

        {/* Ambient Background Show/Hide */}
        <div className="settings-row">
          <div className="settings-row-label">
            <span>Ambient GIF Background</span>
            <span>Toggle the full-screen animated lofi background (picks a new one on refresh)</span>
          </div>
          <button
            className={`btn btn-sm ${showBanner ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleToggleBanner}
          >
            {showBanner ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Background Source Mode Selector */}
        {showBanner && (
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-md)' }}>
            <div className="settings-row-label">
              <span>Active Background Source</span>
              <span>Select either a random preset rotation or a customizable saved slot</span>
            </div>
            <select
              className="form-input"
              value={activeBackground}
              onChange={(e) => handleActiveBgChange(e.target.value)}
              style={{ background: 'var(--bg-input)', cursor: 'pointer', border: '1px solid var(--border-primary)' }}
            >
              <option value="random">🔄 Random Preset Rotation (Cozy Loop Gifs)</option>
              {customBackgrounds.map((bg) => (
                <option key={bg.id} value={bg.id}>
                  📂 {bg.name || bg.id.toUpperCase()} {bg.url ? '• Saved' : '• Empty'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Background Slots Manager */}
        {showBanner && (
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-md)' }}>
            <div className="settings-row-label">
              <span>Manage Custom Saved Backgrounds</span>
              <span>Edit slot names and paste loop GIF/image URLs. These save automatically!</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-xs)' }}>
              {customBackgrounds.map((bg) => {
                const isActive = activeBackground === bg.id;
                return (
                  <div 
                    key={bg.id} 
                    style={{ 
                      padding: 'var(--space-md)', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'rgba(255,255,255,0.015)',
                      border: isActive ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      position: 'relative'
                    }}
                  >
                    {isActive && (
                      <span 
                        style={{ 
                          position: 'absolute', 
                          top: 'var(--space-md)', 
                          right: 'var(--space-md)', 
                          fontSize: '8px', 
                          fontWeight: 800, 
                          color: 'var(--accent-secondary)', 
                          textTransform: 'uppercase', 
                          background: 'var(--accent-primary-glow)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          letterSpacing: '0.05em',
                          border: '1px solid rgba(124, 107, 245, 0.2)'
                        }}
                      >
                        Active Background
                      </span>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Slot Name</span>
                          <input
                            type="text"
                            className="form-input"
                            value={bg.name}
                            onChange={(e) => handleSlotNameChange(bg.id, e.target.value)}
                            placeholder="e.g. My Cozy Café"
                            style={{ padding: '6px 10px', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ flex: 2, minWidth: '200px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Loop GIF or Image URL</span>
                          <input
                            type="text"
                            className="form-input"
                            value={bg.url}
                            onChange={(e) => handleSlotUrlChange(bg.id, e.target.value)}
                            placeholder="Paste background loop URL..."
                            style={{ padding: '6px 10px', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Background Blur */}
        {showBanner && (
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-md)' }}>
            <div className="settings-row-label">
              <span>Background Blur: {bgBlur}px</span>
              <span>Adjust the blur level of the background GIF (set to 0 for a crisp image)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginTop: 'var(--space-xs)' }}>
              <input
                className="range-slider"
                type="range"
                min={0}
                max={80}
                value={bgBlur}
                onChange={e => updateSettings({ bgBlur: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {/* Background Dimness */}
        {showBanner && (
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-md)' }}>
            <div className="settings-row-label">
              <span>Background Overlay Opacity (Dimness): {bgDim}%</span>
              <span>Control how dark the screen overlay is (lower opacity lets you see the GIF more clearly)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginTop: 'var(--space-xs)' }}>
              <input
                className="range-slider"
                type="range"
                min={10}
                max={90}
                value={bgDim}
                onChange={e => updateSettings({ bgDim: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="settings-section">
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          About
        </h3>
        <div className="settings-row">
          <div className="settings-row-label">
            <span>Cadence</span>
            <span>Version 1.1.0 · Premium Personal Productivity</span>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">
            <span>Storage</span>
            <span>All data is stored locally in your browser</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section">
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-danger)', marginBottom: 'var(--space-lg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Danger Zone
        </h3>
        <div className="settings-row" style={{ borderColor: 'var(--color-danger-border)' }}>
          <div className="settings-row-label">
            <span>Clear All Data</span>
            <span>Permanently delete all tasks, goals, routines, and settings</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setShowConfirm(true)}>
            Clear Data
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Clear All Data"
        className="confirm-dialog"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--color-danger)' }} onClick={handleClearAll}>
              Yes, Clear Everything
            </button>
          </>
        }
      >
        <div className="confirm-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
          <AlertTriangle size={36} strokeWidth={1.5} style={{ color: 'var(--color-danger)' }} />
        </div>
        <p className="confirm-message">
          This will permanently delete all your tasks, goals, routines, and completion history. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
