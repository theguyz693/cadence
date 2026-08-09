import { useState, useEffect, useRef } from 'react';
import { Settings as GearIcon, Box } from 'lucide-react';

// Default Spline interactive 3D clock concept URL (designed by community/Spline)
// Can be customized by changing this URL
const DEFAULT_SPLINE_URL = 'https://my.spline.design/interactiveclock-1ccba6cbf2d8e6a2bbd63a43fa48a58a/';

export default function InteractiveClock() {
  const [time, setTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('gears'); // 'gears' | 'spline'
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetMousePos, setTargetMousePos] = useState({ x: 0, y: 0 });
  const animationFrameId = useRef(null);
  const rotationAngle = useRef(0);

  // Update clock time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track mouse coordinates for parallax
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTargetMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setTargetMousePos({ x: 0, y: 0 });
  };

  // Smooth mouse movement interpolation (lerp)
  useEffect(() => {
    let active = true;
    const updateLerp = () => {
      if (!active) return;
      setMousePos(prev => ({
        x: prev.x + (targetMousePos.x - prev.x) * 0.1,
        y: prev.y + (targetMousePos.y - prev.y) * 0.1
      }));
      requestAnimationFrame(updateLerp);
    };
    updateLerp();
    return () => { active = false; };
  }, [targetMousePos]);

  // Gear Canvas Animation
  useEffect(() => {
    if (viewMode !== 'gears') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize handler
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Draw single gear helper
    const drawGear = (ctx, x, y, radius, teeth, angle, color, glowColor, spokes = 5) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Apply subtle shadow/glow to gear lines
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      // Outer rim teeth
      ctx.beginPath();
      const pitchRadius = radius;
      const addendum = 5; // tooth height out
      const dedendum = 5; // tooth depth in
      
      for (let i = 0; i < teeth; i++) {
        const angleStep = (Math.PI * 2) / teeth;
        const a0 = i * angleStep;
        const a1 = a0 + angleStep * 0.25;
        const a2 = a0 + angleStep * 0.5;
        const a3 = a0 + angleStep * 0.75;
        
        const rOuter = pitchRadius + addendum;
        const rInner = pitchRadius - dedendum;

        if (i === 0) {
          ctx.moveTo(rInner * Math.cos(a0), rInner * Math.sin(a0));
        } else {
          ctx.lineTo(rInner * Math.cos(a0), rInner * Math.sin(a0));
        }
        ctx.lineTo(rOuter * Math.cos(a1), rOuter * Math.sin(a1));
        ctx.lineTo(rOuter * Math.cos(a2), rOuter * Math.sin(a2));
        ctx.lineTo(rInner * Math.cos(a3), rInner * Math.sin(a3));
      }
      ctx.closePath();
      ctx.stroke();

      // Outer rim circle
      ctx.beginPath();
      ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
      ctx.stroke();

      // Inner hub circle
      ctx.beginPath();
      ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
      ctx.stroke();

      // Center core hole
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.stroke();

      // Spokes
      ctx.beginPath();
      for (let j = 0; j < spokes; j++) {
        const spokeAngle = (j * Math.PI * 2) / spokes;
        ctx.moveTo(6 * Math.cos(spokeAngle), 6 * Math.sin(spokeAngle));
        ctx.lineTo((radius - 10) * Math.cos(spokeAngle), (radius - 10) * Math.sin(spokeAngle));
      }
      ctx.stroke();

      ctx.restore();
    };

    // Animation Loop
    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Fetch colors dynamically from CSS variables
      const rootStyle = getComputedStyle(document.documentElement);
      const accentPrimary = rootStyle.getPropertyValue('--accent-primary').trim() || '#7c6bf5';
      const accentSecondary = rootStyle.getPropertyValue('--accent-secondary').trim() || '#a78bfa';
      const successColor = rootStyle.getPropertyValue('--color-success').trim() || '#34d399';

      // Base coordinates
      const cx = width / 2;
      const cy = height / 2;

      // Adjust rotation angle speed
      rotationAngle.current += 0.003;

      // Draw Gears with 3D Parallax layers (different offset modifiers)
      
      // 1. Medium gear (Left top, middle layer)
      // Meshing distance: R1 + R2 = 60 + 40 = 100
      const g2x = cx - 80 + (mousePos.x * 0.04);
      const g2y = cy - 60 + (mousePos.y * 0.04);
      const g2Angle = -rotationAngle.current * (60 / 40) + 0.15; // meshes with center gear
      drawGear(ctx, g2x, g2y, 40, 16, g2Angle, accentSecondary, 'rgba(167, 139, 250, 0.2)', 4);

      // 2. Small gear (Right bottom, front layer)
      // Meshing distance: R1 + R3 = 60 + 25 = 85
      const g3x = cx + 75 + (mousePos.x * 0.06);
      const g3y = cy + 40 + (mousePos.y * 0.06);
      const g3Angle = -rotationAngle.current * (60 / 25) - 0.05; // meshes with center gear
      drawGear(ctx, g3x, g3y, 25, 10, g3Angle, successColor, 'rgba(52, 211, 153, 0.2)', 3);

      // 3. Center big gear (Main background layer)
      const g1x = cx + (mousePos.x * 0.02);
      const g1y = cy + (mousePos.y * 0.02);
      drawGear(ctx, g1x, g1y, 60, 24, rotationAngle.current, accentPrimary, 'rgba(124, 107, 245, 0.25)', 5);

      // 4. Subtle background clock dial markings
      ctx.save();
      ctx.translate(cx + (mousePos.x * 0.01), cy + (mousePos.y * 0.01));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.stroke();
      
      // Tick indicators
      for (let i = 0; i < 12; i++) {
        const tickAngle = (i * Math.PI * 2) / 12;
        ctx.beginPath();
        ctx.moveTo(102 * Math.cos(tickAngle), 102 * Math.sin(tickAngle));
        ctx.lineTo(108 * Math.cos(tickAngle), 108 * Math.sin(tickAngle));
        ctx.stroke();
      }
      ctx.restore();

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [viewMode, mousePos]);

  // Formatted date & time
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      className="glass-panel bento-clock-gears glow-border"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="glass-panel-header">
        <span className="glass-panel-title">Visual Dimension</span>
        <span className="glass-panel-subtitle">Time & Rhythm</span>
      </div>

      <div className="clock-canvas-container">
        {viewMode === 'gears' ? (
          <>
            <canvas ref={canvasRef} className="clock-canvas" />
            <div className="clock-canvas-overlay" />
          </>
        ) : (
          <iframe 
            src={DEFAULT_SPLINE_URL} 
            className="spline-embed-iframe"
            title="Spline 3D Time Interaction"
            loading="lazy"
          />
        )}

        <div className="clock-widget-ui">
          <div className="clock-widget-time">{formattedTime}</div>
          <div className="clock-widget-date">{formattedDate}</div>
        </div>

        <div className="clock-visual-switcher">
          <button 
            className={`btn btn-xs ${viewMode === 'gears' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('gears')}
            style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <GearIcon size={10} strokeWidth={1.75} /> Canvas Gears
          </button>
          <button 
            className={`btn btn-xs ${viewMode === 'spline' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('spline')}
            style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <Box size={10} strokeWidth={1.75} /> Spline 3D
          </button>
        </div>
      </div>
    </div>
  );
}
