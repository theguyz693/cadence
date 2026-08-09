import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, SkipForward } from 'lucide-react';

const TRACKS = [
  { id: 'ambient', name: 'Ambient Focus', src: '/audio/ambient.mp3' },
  { id: 'focus', name: 'Deep Focus', src: '/audio/focus.mp3' },
  { id: 'night', name: 'Night Rain', src: '/audio/night.mp3' },
];

export default function LockInMusicPlayer() {
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const synthContextRef = useRef(null);

  const activeTrack = TRACKS[currentTrackIdx] || TRACKS[0];

  // Initialize Audio instance
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (synthContextRef.current) {
        synthContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update track src
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const wasPlaying = isPlaying;

    audio.src = activeTrack.src;
    audio.load();
    setCurrentTime(0);

    if (wasPlaying) {
      audio.play().catch(() => {
        startSynthFallback();
      });
    }
  }, [currentTrackIdx]);

  // Handle volume & mute changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Web Audio synth fallback if HTML5 audio fails
  const startSynthFallback = () => {
    try {
      if (!synthContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        synthContextRef.current = ctx;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(277.18, ctx.currentTime); // C#4

        gain.gain.setValueAtTime(0.08 * (isMuted ? 0 : volume), ctx.currentTime);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
      }
    } catch {
      // Ignore fallback errors
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (synthContextRef.current && synthContextRef.current.state === 'running') {
        synthContextRef.current.suspend();
      }
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Autoplay/load issue: fallback gracefully
        setIsPlaying(true);
        startSynthFallback();
      }
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleNextTrack = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="lock-in-music-player">
      <div className="music-player-header">
        <div className="music-title-group">
          <Music size={14} className={`music-icon ${isPlaying ? 'spinning' : ''}`} style={{ color: 'var(--accent-primary)' }} />
          <span className="music-label">Focus Sound</span>
        </div>

        {/* Track selector dropdown */}
        <select
          className="music-track-select"
          value={currentTrackIdx}
          onChange={(e) => setCurrentTrackIdx(Number(e.target.value))}
        >
          {TRACKS.map((t, idx) => (
            <option key={t.id} value={idx}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Scrubber / Progress bar & Controls */}
      <div className="music-player-body">
        <button
          type="button"
          className="btn btn-ghost btn-icon music-play-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
        >
          {isPlaying ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
        </button>

        <div className="music-progress-wrapper">
          <input
            type="range"
            className="music-slider progress-slider"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
          />
          <div className="music-time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-icon music-next-btn"
          onClick={handleNextTrack}
          title="Next Track"
        >
          <SkipForward size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Volume control row */}
      <div className="music-volume-row">
        <button
          type="button"
          className="btn btn-ghost btn-icon music-mute-btn"
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute' : 'Mute'}
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
        />
      </div>
    </div>
  );
}
