import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  SkipForward,
  SkipBack,
  AlertCircle,
  Plus
} from 'lucide-react';

const DEFAULT_FOCUS_SOUNDS = [
  { id: 'sound_1', name: 'Deep Focus Ambient', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', type: 'preset' },
  { id: 'sound_2', name: 'Rain & Thunderstorm', src: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b71d9d970.mp3?filename=rain-and-thunder-16705.mp3', type: 'preset' },
  { id: 'sound_3', name: 'Night City Lo-Fi', src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3', type: 'preset' },
  { id: 'sound_4', name: 'Synth Meditation Drone', src: 'synth', type: 'preset' },
];

export default function LockInMusicPlayer() {
  const { state } = useApp();
  const navigate = useNavigate();

  const sounds = state?.settings?.focusSounds && state.settings.focusSounds.length > 0
    ? state.settings.focusSounds
    : DEFAULT_FOCUS_SOUNDS;

  const defaultSoundId = state?.settings?.defaultSoundId;

  // Initialize track index based on defaultSoundId
  const initialIdx = Math.max(0, sounds.findIndex(s => s.id === defaultSoundId));
  const [trackIndex, setTrackIndex] = useState(initialIdx);

  const [isPlaying, setIsPlaying] = useState(false); // Music OFF by default when entering Lock In
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef(null);
  const synthCtxRef = useRef(null);

  const currentSound = sounds[trackIndex] || sounds[0];

  // Helper to stop synth audio
  const stopSynth = useCallback(() => {
    if (synthCtxRef.current) {
      try {
        synthCtxRef.current.close().catch(() => {});
      } catch {}
      synthCtxRef.current = null;
    }
  }, []);

  // Helper to start synth fallback drone audio
  const startSynth = useCallback(() => {
    try {
      stopSynth();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      synthCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(220, ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(277.18, ctx.currentTime);

      const targetGain = isMuted ? 0 : volume * 0.08;
      gain.gain.setValueAtTime(targetGain, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
    } catch {
      // Ignore synth errors
    }
  }, [volume, isMuted, stopSynth]);

  // Clean up single audio instance on unmount (leaving Lock In)
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;

    const handleError = () => {
      setAudioError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('error', handleError);
      audio.src = '';
      audioRef.current = null;
      stopSynth();
    };
  }, [stopSynth]);

  // Sync volume & mute state to audio element / synth
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (synthCtxRef.current && synthCtxRef.current.state === 'running') {
      try {
        const gainNode = synthCtxRef.current.destination;
        if (gainNode) {
          // Adjust volume on synth
        }
      } catch {}
    }
  }, [volume, isMuted]);

  // Handle Track Switching
  const changeTrack = (newIdx) => {
    setAudioError(false);
    const validIdx = (newIdx + sounds.length) % sounds.length;
    const targetSound = sounds[validIdx];

    // Stop current audio cleanly
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopSynth();

    setTrackIndex(validIdx);

    // If was playing, continue playing the new track
    if (isPlaying) {
      if (targetSound.src === 'synth') {
        startSynth();
      } else if (audioRef.current) {
        audioRef.current.src = targetSound.src;
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          setAudioError(true);
          setIsPlaying(false);
        });
      }
    }
  };

  // Play / Pause Toggle
  const togglePlay = async () => {
    setAudioError(false);

    if (isPlaying) {
      // Pause playback
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopSynth();
      setIsPlaying(false);
    } else {
      // Start playback
      if (!currentSound) return;

      if (currentSound.src === 'synth') {
        startSynth();
        setIsPlaying(true);
      } else if (audioRef.current) {
        try {
          audioRef.current.src = currentSound.src;
          audioRef.current.volume = isMuted ? 0 : volume;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Audio playback failed:', err.message);
          setAudioError(true);
          setIsPlaying(false);
        }
      }
    }
  };

  // No sounds configured edge case
  if (sounds.length === 0) {
    return (
      <div className="lock-in-music-player">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-sm)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>No focus sounds yet</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/settings')}
            style={{ fontSize: '11px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} /> Add Sound
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lock-in-music-player">
      {/* Header with track name display & indicator */}
      <div className="music-player-header">
        <div className="music-title-group" style={{ flex: 1, minWidth: 0 }}>
          <Music size={14} className={`music-icon ${isPlaying ? 'spinning' : ''}`} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span className="music-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSound?.name || 'Focus Sound'}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
            ({trackIndex + 1}/{sounds.length})
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {audioError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-danger)', background: 'rgba(248, 113, 113, 0.1)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
          <AlertCircle size={12} /> Unable to play this sound. Try another track or edit source in Settings.
        </div>
      )}

      {/* Main Controls Row: Previous, Play/Pause, Next */}
      <div className="music-player-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-icon music-prev-btn"
          onClick={() => changeTrack(trackIndex - 1)}
          title="Previous Track"
          style={{ color: 'var(--text-secondary)' }}
        >
          <SkipBack size={16} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className="btn btn-primary btn-icon music-play-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pause Sound' : 'Play Sound'}
          style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isPlaying ? <Pause size={18} strokeWidth={2.2} /> : <Play size={18} strokeWidth={2.2} style={{ marginLeft: '2px' }} />}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-icon music-next-btn"
          onClick={() => changeTrack(trackIndex + 1)}
          title="Next Track"
          style={{ color: 'var(--text-secondary)' }}
        >
          <SkipForward size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Volume slider & Mute toggle */}
      <div className="music-volume-row" style={{ marginTop: 'var(--space-sm)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-icon music-mute-btn"
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={{ color: 'var(--text-tertiary)', padding: 4 }}
        >
          {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          className="music-slider volume-slider"
          min={0}
          max={1}
          step={0.05}
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            if (isMuted) setIsMuted(false);
          }}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}
