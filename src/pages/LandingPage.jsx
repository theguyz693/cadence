import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Logo from '../components/Logo.jsx';

function FadeInSection({ children }) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (domRef.current) {
      observer.observe(domRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`landing-scroll-section ${isIntersecting ? 'is-visible' : ''}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Autoplay video once, do not loop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = false;
      videoRef.current.play().catch(() => {
        console.log('Autoplay prevented. User interaction required.');
      });
    }
  }, []);

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // Smoothly auto-scroll down a little bit as soon as the video ends
    setTimeout(() => {
      if (window.scrollY < 100) {
        window.scrollBy({
          top: Math.min(window.innerHeight * 0.45, 450),
          behavior: 'smooth'
        });
      }
    }, 300);
  };

  return (
    <div className="cinematic-landing">
      {/* Subtle background noise overlay */}
      <div className="landing-noise-overlay" />

      {/* Minimal Navigation Header */}
      <nav className="cinematic-nav">
        <div className="nav-brand">
          <Logo size={20} style={{ color: '#ffffff', marginRight: '6px' }} />
          <span>CADENCE</span>
        </div>
        <button className="nav-login-link" onClick={() => navigate('/login')}>
          LOG IN
        </button>
      </nav>

      {/* 1. CINEMATIC OPENING VIDEO (DOMINANT FIRST VIEWPORT) */}
      <section className="cinematic-opening-hero">
        <div className="cinema-video-wrapper">
          <video
            ref={videoRef}
            className="cinema-hero-video"
            src="/finallockvid.mp4"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
          />
        </div>

        <div className="hero-scroll-indicator">
          <span>SCROLL TO EXPLORE</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* 2. CADENCE HERO INTRODUCTION (BELOW THE VIDEO IN DOM) */}
      <main className="cinematic-content">
        <FadeInSection>
          <section className="cadence-hero-intro">
            <h1 className="hero-title">CADENCE</h1>
            <h2 className="hero-subtitle">YOUR RHYTHM. YOUR RULES.</h2>
            <p className="hero-description">
              A focused workspace to plan your goals, build routines, manage tasks, and actually lock in.
            </p>
            <div className="hero-cta-group">
              <button className="btn-cinematic-primary" onClick={() => navigate('/signup')}>
                GET STARTED <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </section>
        </FadeInSection>

        {/* 3. SCROLL SECTION: WHAT IS CADENCE */}
        <FadeInSection>
          <section className="scroll-section-concept">
            <h3 className="section-label">THE TEMPO</h3>
            <h2 className="section-headline">PLAN LESS.<br />DO MORE.</h2>
            <p className="section-intro">
              Cadence replaces complicated project boards with a lightweight, focused rhythm designed to turn intent into execution.
            </p>

            <div className="concept-pillars">
              <div className="pillar-item">
                <span className="pillar-index">01</span>
                <h4 className="pillar-title">GOALS</h4>
                <p className="pillar-desc">Know what you're working toward.</p>
              </div>

              <div className="pillar-item">
                <span className="pillar-index">02</span>
                <h4 className="pillar-title">ROUTINES</h4>
                <p className="pillar-desc">Build a rhythm that sticks.</p>
              </div>

              <div className="pillar-item">
                <span className="pillar-index">03</span>
                <h4 className="pillar-title">TASKS</h4>
                <p className="pillar-desc">Turn intention into action.</p>
              </div>
            </div>
          </section>
        </FadeInSection>

        {/* 4. SCROLL SECTION: LOCK IN */}
        <FadeInSection>
          <section className="scroll-section-lockin">
            <h3 className="section-label">FOCUS STATE</h3>
            <h2 className="section-headline">WHEN IT'S TIME TO WORK,<br />LOCK IN.</h2>
            <p className="section-intro">
              Use Cadence's focus session to turn a planned block of time into uninterrupted work. A clean, distraction-free environment to sync your thoughts.
            </p>

            {/* Subtle schematic of the Lock-In circular countdown timer */}
            <div className="schematic-wrapper">
              <div className="schematic-circle-container">
                <svg className="schematic-circle-svg" viewBox="0 0 200 200">
                  <circle className="schematic-track" cx="100" cy="100" r="90" />
                  <circle className="schematic-fill" cx="100" cy="100" r="90" />
                </svg>
                <div className="schematic-time">25:00</div>
                <div className="schematic-badge">LOCKED IN</div>
              </div>
            </div>
          </section>
        </FadeInSection>

        {/* 5. SCROLL SECTION: YOUR DAY (Capabilities) */}
        <FadeInSection>
          <section className="scroll-section-capabilities">
            <h3 className="section-label">WORKSPACE ENGINE</h3>
            <h2 className="section-headline">BUILT FOR RHYTHM.</h2>
            
            <div className="capabilities-grid">
              <div className="capability-stat">
                <div className="stat-label">OBJECTIVES</div>
                <div className="stat-val">GOALS ACTIVE</div>
                <p className="stat-explanation">Plan multi-day targets and checklists.</p>
              </div>

              <div className="capability-stat">
                <div className="stat-label">DAY FLOW</div>
                <div className="stat-val">TASKS</div>
                <p className="stat-explanation">A simple checkbox pipeline to clear your mind.</p>
              </div>

              <div className="capability-stat">
                <div className="stat-label">BEHAVIORS</div>
                <div className="stat-val">ROUTINES</div>
                <p className="stat-explanation">Schedule repeating tracks for day-to-day habits.</p>
              </div>

              <div className="capability-stat">
                <div className="stat-label">DISTRACTION-FREE</div>
                <div className="stat-val">FOCUS TIME</div>
                <p className="stat-explanation">Integrated sound player and custom timers.</p>
              </div>
            </div>
          </section>
        </FadeInSection>

        {/* 6. FINAL CALL TO ACTION */}
        <FadeInSection>
          <section className="scroll-section-cta">
            <h2 className="cta-headline">YOUR RHYTHM.<br />YOUR RULES.</h2>
            
            <div className="cta-actions">
              <button className="btn-cinematic-primary lg" onClick={() => navigate('/signup')}>
                GET STARTED
              </button>
              
              <div className="cta-footer-links">
                <span>Already have an account?</span>
                <button className="cta-secondary-link" onClick={() => navigate('/login')}>
                  LOG IN &rarr;
                </button>
              </div>
            </div>
          </section>
        </FadeInSection>
      </main>

      {/* Cinematic Footer */}
      <footer className="cinematic-footer">
        <p>&copy; {new Date().getFullYear()} Cadence. All rights reserved.</p>
      </footer>
    </div>
  );
}
