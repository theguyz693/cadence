/**
 * Built-in ambient scenes. Pure markup + CSS (styles/ambient.css): nothing is
 * fetched, and every animation moves only transform and opacity.
 */

// Deterministic "random" so the fireflies don't jump around between renders.
function seeded(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const FIREFLIES = Array.from({ length: 34 }, (_, i) => ({
  '--x': `${(seeded(i, 1) * 100).toFixed(1)}%`,
  '--y': `${(seeded(i, 2) * 100).toFixed(1)}%`,
  '--s': `${(3 + seeded(i, 3) * 5).toFixed(1)}px`,
  '--d': `${(9 + seeded(i, 4) * 12).toFixed(1)}s`,
  '--delay': `${(-seeded(i, 5) * 20).toFixed(1)}s`,
  '--dx': `${((seeded(i, 6) - 0.5) * 160).toFixed(0)}px`,
  '--dy': `${(-40 - seeded(i, 7) * 140).toFixed(0)}px`,
}));

const WAVE = 'M0 60 C 120 20 240 20 360 60 S 600 100 720 60 S 960 20 1080 60 S 1320 100 1440 60 V 160 H 0 Z';

export default function AmbientScene({ id, mini = false }) {
  const cls = `scene scene-${id}${mini ? ' is-mini' : ''}`;
  switch (id) {
    case 'aurora':
      return (
        <div className={cls}>
          <i className="blob b1" /><i className="blob b2" /><i className="blob b3" /><i className="blob b4" />
        </div>
      );
    case 'dusk':
      return (
        <div className={cls}>
          <i className="sun" />
          <i className="cloud c1" /><i className="cloud c2" /><i className="cloud c3" />
          <i className="hills" />
        </div>
      );
    case 'tide':
      return (
        <div className={cls}>
          {[1, 2, 3].map(n => (
            <svg key={n} className={`wave w${n}`} viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
              <path d={WAVE} /><path d={WAVE} transform="translate(1440 0)" />
            </svg>
          ))}
        </div>
      );
    case 'fireflies':
      return (
        <div className={cls}>
          {(mini ? FIREFLIES.slice(0, 10) : FIREFLIES).map((style, i) => <i key={i} className="fly" style={style} />)}
        </div>
      );
    default:
      return null;
  }
}
