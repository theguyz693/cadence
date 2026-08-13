import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * IntroAnimation — Fullscreen video intro overlay for Cadence.
 *
 * Plays `finallockvid.mp4` every time the site is opened/reloaded.
 * Uses the video's native `ended` event to trigger a smooth fade-out,
 * then unmounts the overlay to reveal the app underneath.
 *
 * Does NOT replay on internal React navigation — only on initial mount.
 * Respects prefers-reduced-motion (skips intro entirely).
 */

export default function IntroAnimation({ children }) {
  const [visible, setVisible] = useState(() => {
    // If user prefers reduced motion, skip the intro entirely
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
    return true;
  });

  const [fading, setFading] = useState(false);
  const videoRef = useRef(null);

  const handleVideoEnded = useCallback(() => {
    // Start the fade-out transition
    setFading(true);
  }, []);

  const handleSkip = useCallback(() => {
    if (!visible || fading) return;
    // Pause the video and start fade-out immediately
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setFading(true);
  }, [visible, fading]);

  // After the CSS fade-out transition completes, unmount the overlay
  const handleTransitionEnd = useCallback((e) => {
    // Only react to the opacity transition on the overlay itself
    if (e.propertyName === 'opacity' && fading) {
      setVisible(false);
    }
  }, [fading]);

  // Keyboard skip (Escape / Enter / Space)
  useEffect(() => {
    if (!visible || fading) return;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, fading, handleSkip]);

  // Cleanup: pause video if component unmounts while still playing
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, []);

  // If not visible, just render children with no overhead
  if (!visible) {
    return <>{children}</>;
  }

  return (
    <>
      {/* The real app rendered underneath — hidden while overlay is opaque */}
      <div
        className="cadence-intro-app-behind"
        style={{ opacity: fading ? 1 : 0 }}
        aria-hidden={!fading}
      >
        {children}
      </div>

      {/* Video intro overlay */}
      <div
        className={`cadence-intro-overlay${fading ? ' cadence-intro-fadeout' : ''}`}
        onClick={handleSkip}
        onTransitionEnd={handleTransitionEnd}
        role="presentation"
        aria-label="Cadence intro animation. Press Escape to skip."
      >
        <video
          ref={videoRef}
          className="cadence-intro-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnded}
        >
          <source src="/finallockvid.mp4" type="video/mp4" />
        </video>
      </div>
    </>
  );
}
