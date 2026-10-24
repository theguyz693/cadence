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
      <div className="player">
        <span className="player-empty">No focus sounds yet</span>
        <button type="button" className="focus-ghost-btn" onClick={() => navigate('/settings')}>
          <Plus size={13} /> Add a sound
        </button>
      </div>
    );
  }

  return (
    <div className="player" aria-label="Focus sound">
      <div className="player-row">
        <button type="button" className="player-btn" onClick={() => changeTrack(trackIndex - 1)} aria-label="Previous sound">
          <SkipBack size={15} strokeWidth={1.75} />
        </button>
        <button type="button" className="player-btn player-play" onClick={togglePlay} aria-label={isPlaying ? 'Pause sound' : 'Play sound'} aria-pressed={isPlaying}>
          {isPlaying ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
        </button>
        <button type="button" className="player-btn" onClick={() => changeTrack(trackIndex + 1)} aria-label="Next sound">
          <SkipForward size={15} strokeWidth={1.75} />
        </button>
        <div className="player-track">
          <Music size={13} strokeWidth={1.75} aria-hidden="true" className={isPlaying ? 'is-playing' : ''} />
          <span className="truncate">{currentSound?.name || 'Focus sound'}</span>
          <span className="player-count t-num">{trackIndex + 1}/{sounds.length}</span>
        </div>
        <button type="button" className="player-btn" onClick={() => setIsMuted(!isMuted)} aria-label={isMuted ? 'Unmute' : 'Mute'} aria-pressed={isMuted}>
          {isMuted || volume === 0 ? <VolumeX size={15} strokeWidth={1.75} /> : <Volume2 size={15} strokeWidth={1.75} />}
        </button>
        <input
          type="range"
          className="player-volume"
          min={0}
          max={1}
          step={0.05}
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            if (isMuted) setIsMuted(false);
          }}
          aria-label="Volume"
        />
      </div>
      {audioError && (
        <div className="player-error" role="alert">
          <AlertCircle size={13} /> Couldn't play this sound. Try another, or check its link in Settings.
        </div>
      )}
    </div>
  );
}
