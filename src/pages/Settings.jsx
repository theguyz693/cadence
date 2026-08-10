import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import { ACCENT_THEMES } from '../utils/helpers.js';
import { AlertTriangle, Music, Plus, Trash2, Play, Square, CheckCircle2 } from 'lucide-react';

const DEFAULT_FOCUS_SOUNDS = [
  { id: 'sound_1', name: 'Deep Focus Ambient', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', type: 'preset', isDefault: true },
  { id: 'sound_2', name: 'Rain & Thunderstorm', src: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b71d9d970.mp3?filename=rain-and-thunder-16705.mp3', type: 'preset', isDefault: false },
  { id: 'sound_3', name: 'Night City Lo-Fi', src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3', type: 'preset', isDefault: false },
  { id: 'sound_4', name: 'Synth Meditation Drone', src: 'synth', type: 'preset', isDefault: false },
];

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

  // Focus Sounds State
  const focusSounds = state.settings?.focusSounds || DEFAULT_FOCUS_SOUNDS;
  const defaultSoundId = state.settings?.defaultSoundId || focusSounds[0]?.id || 'sound_1';

  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundSourceType, setNewSoundSourceType] = useState('url'); // 'url' | 'file'
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const [newSoundFile, setNewSoundFile] = useState(null);
  const [soundError, setSoundError] = useState('');

  // Audio Preview State
  const [previewingId, setPreviewingId] = useState(null);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

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

  // Sound Management Handlers
  const handleSetDefaultSound = (soundId) => {
    updateSettings({ defaultSoundId: soundId });
  };

  const handleRemoveSound = (soundId) => {
    if (previewingId === soundId && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewingId(null);
    }
    const updated = focusSounds.filter(s => s.id !== soundId);
    let newDefault = defaultSoundId;
    if (defaultSoundId === soundId) {
      newDefault = updated[0]?.id || null;
    }
    updateSettings({ focusSounds: updated, defaultSoundId: newDefault });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewSoundFile(file);
      if (!newSoundName.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setNewSoundName(nameWithoutExt);
      }
    }
  };

  const handleAddSound = () => {
    setSoundError('');
    if (!newSoundName.trim()) {
      setSoundError('Please enter a sound name.');
      return;
    }

    if (newSoundSourceType === 'url') {
      if (!newSoundUrl.trim()) {
        setSoundError('Please enter an audio file URL.');
        return;
      }

      const newEntry = {
        id: `sound_${Date.now()}`,
        name: newSoundName.trim(),
        src: newSoundUrl.trim(),
        type: 'url',
        isDefault: focusSounds.length === 0,
      };

      const updated = [...focusSounds, newEntry];
      updateSettings({
        focusSounds: updated,
        defaultSoundId: defaultSoundId || newEntry.id,
      });

      setNewSoundName('');
      setNewSoundUrl('');
    } else {
      if (!newSoundFile) {
        setSoundError('Please select a local audio file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        const newEntry = {
          id: `sound_${Date.now()}`,
          name: newSoundName.trim(),
          src: base64Data,
          type: 'file',
          isDefault: focusSounds.length === 0,
        };

        const updated = [...focusSounds, newEntry];
        updateSettings({
          focusSounds: updated,
          defaultSoundId: defaultSoundId || newEntry.id,
        });

        setNewSoundName('');
        setNewSoundFile(null);
      };
      reader.onerror = () => {
        setSoundError('Failed to read audio file.');
      };
      reader.readAsDataURL(newSoundFile);
    }
  };

  const togglePreviewSound = (sound) => {
    if (previewingId === sound.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    if (sound.src === 'synth') {
      setPreviewingId(sound.id);
      setTimeout(() => setPreviewingId(null), 3000);
      return;
    }

    try {
      const audio = new Audio(sound.src);
      audio.volume = 0.5;
      previewAudioRef.current = audio;
      setPreviewingId(sound.id);

      audio.play().catch(() => {
        setSoundError(`Unable to play "${sound.name}". Please check the audio URL.`);
        setPreviewingId(null);
      });

      audio.onended = () => {
        setPreviewingId(null);
      };
    } catch {
      setSoundError(`Unable to preview "${sound.name}".`);
      setPreviewingId(null);
    }
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

      {/* Focus Sounds / Lock In Sounds Section */}
      <div className="settings-section">
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Focus Sounds / Lock In Sounds</span>
          <span style={{ fontSize: '11px', color: 'var(--accent-secondary)', textTransform: 'none', fontWeight: 500 }}>
            {focusSounds.length} {focusSounds.length === 1 ? 'sound' : 'sounds'} configured
          </span>
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-md)' }}>
          Manage audio tracks for your Lock In focus sessions. Select a default sound or upload custom local audio files / URLs (.mp3, .wav, .ogg).
        </p>

        {/* List of configured sounds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
          {focusSounds.length === 0 ? (
            <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px border-dashed var(--border-subtle)', textAlign: 'center' }}>
              <Music size={24} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)' }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>No focus sounds yet</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)', marginTop: 2 }}>Add a sound below to customize your Lock In sessions.</div>
            </div>
          ) : (
            focusSounds.map((sound) => {
              const isDefault = (defaultSoundId || focusSounds[0]?.id) === sound.id;
              const isPreviewing = previewingId === sound.id;

              return (
                <div
                  key={sound.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isDefault ? 'rgba(124, 107, 245, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isDefault ? '1px solid rgba(124, 107, 245, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                    gap: 'var(--space-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', minWidth: 0, flex: 1 }}>
                    {/* Default radio selector button */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleSetDefaultSound(sound.id)}
                      title={isDefault ? 'Default Focus Sound' : 'Set as Default Sound'}
                      style={{
                        padding: 4,
                        color: isDefault ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                        cursor: 'pointer',
                      }}
                    >
                      <CheckCircle2 size={18} strokeWidth={isDefault ? 2.2 : 1.5} />
                    </button>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sound.name}
                        </span>
                        {isDefault && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-secondary)', background: 'var(--accent-primary-glow)', padding: '1px 6px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Default
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {sound.type === 'file' ? '📁 Local File' : sound.type === 'preset' ? '🎵 Preset Sound' : '🌐 Web URL'}
                        </span>
                        {sound.src && sound.src !== 'synth' && (
                          <span style={{ opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            • {sound.src.slice(0, 30)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                    {/* Audio Preview Button */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => togglePreviewSound(sound)}
                      style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: isPreviewing ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                      title="Preview Sound"
                    >
                      {isPreviewing ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                      {isPreviewing ? 'Stop' : 'Preview'}
                    </button>

                    {/* Delete Sound button */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleRemoveSound(sound.id)}
                      title="Remove Sound"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Sound Form */}
        <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={13} strokeWidth={2} /> Add Custom Focus Sound
          </div>

          {soundError && (
            <div style={{ fontSize: '11px', color: 'var(--color-danger)', background: 'rgba(248, 113, 113, 0.1)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-sm)' }}>
              {soundError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Sound Name
              </label>
              <input
                type="text"
                className="form-input"
                value={newSoundName}
                onChange={(e) => setNewSoundName(e.target.value)}
                placeholder="e.g. My Cafe Ambience"
                style={{ padding: '6px 10px', fontSize: 'var(--font-size-sm)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Source Type
              </label>
              <select
                className="form-input"
                value={newSoundSourceType}
                onChange={(e) => setNewSoundSourceType(e.target.value)}
                style={{ padding: '6px 10px', fontSize: 'var(--font-size-sm)', background: 'var(--bg-input)' }}
              >
                <option value="url">🌐 Direct Audio URL (.mp3 / .wav)</option>
                <option value="file">📁 Local Audio File Upload</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-sm)' }}>
            {newSoundSourceType === 'url' ? (
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Audio File URL (.mp3 / .ogg / .wav)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newSoundUrl}
                  onChange={(e) => setNewSoundUrl(e.target.value)}
                  placeholder="https://example.com/sound.mp3"
                  style={{ padding: '6px 10px', fontSize: 'var(--font-size-sm)' }}
                />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Upload Audio File
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)' }}
                />
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAddSound}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} strokeWidth={2} /> Save Focus Sound
            </button>
          </div>
        </div>
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
