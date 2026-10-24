/**
 * RoutineGrid — the pattern builder for a routine's 1–20 day cycle.
 * Each day is a toggle button; scheduled days can carry a short label
 * (e.g. "Push", "Legs") edited in the list beneath the grid.
 */
export default function RoutineGrid({ pattern, onChange, defaultTime = null }) {
  if (!pattern || pattern.length === 0) return null;

  const toggleDay = (index) => {
    const next = [...pattern];
    const wasActive = next[index].active;
    next[index] = { ...next[index], active: !wasActive, label: wasActive ? '' : next[index].label, time: wasActive ? null : next[index].time || null };
    onChange(next);
  };

  const setTime = (index, time) => {
    const next = [...pattern];
    next[index] = { ...next[index], time: time || null };
    onChange(next);
  };

  const setLabel = (index, label) => {
    const next = [...pattern];
    next[index] = { ...next[index], label };
    onChange(next);
  };

  const applyPreset = (fn) => onChange(pattern.map((d, i) => ({ active: fn(i), label: fn(i) ? d.label : '', time: fn(i) ? d.time || null : null })));

  const activeDays = pattern.map((d, i) => ({ ...d, index: i })).filter(d => d.active);

  return (
    <div className="pattern-builder">
      <div className="pattern-presets" role="group" aria-label="Quick patterns">
        <button type="button" className="chip" onClick={() => applyPreset(() => true)}>Every day</button>
        {pattern.length > 1 && (
          <button type="button" className="chip" onClick={() => applyPreset(i => i % 2 === 0)}>Every other day</button>
        )}
        {pattern.length === 7 && (
          <button type="button" className="chip" onClick={() => applyPreset(i => i < 5)}>5 on, 2 off</button>
        )}
        <button type="button" className="chip" onClick={() => applyPreset(() => false)}>Clear</button>
      </div>

      <div className="pattern-grid" role="group" aria-label="Scheduled days in the cycle">
        {pattern.map((day, index) => (
          <button
            key={index}
            type="button"
            className={`pattern-cell ${day.active ? 'is-active' : ''}`}
            aria-pressed={day.active}
            aria-label={`Day ${index + 1}${day.label ? `, ${day.label}` : ''}`}
            onClick={() => toggleDay(index)}
          >
            <span className="pattern-cell-num t-num">{index + 1}</span>
            <span className="pattern-cell-mark" aria-hidden="true" />
          </button>
        ))}
      </div>

      {activeDays.length > 0 && (
        <div className="pattern-labels">
          <div className="t-meta">Day labels and times (optional) — e.g. “Long run” at 8:00</div>
          <div className="pattern-label-list">
            {activeDays.map(d => (
              <label key={d.index} className="pattern-label-row">
                <span className="pattern-label-day t-num">Day {d.index + 1}</span>
                <input
                  className="input input-sm"
                  value={d.label || ''}
                  onChange={e => setLabel(d.index, e.target.value)}
                  placeholder="Label"
                  aria-label={`Label for day ${d.index + 1}`}
                  maxLength={14}
                />
                <input
                  type="time"
                  className="input input-sm input-time pattern-day-time"
                  value={d.time || ''}
                  step={300}
                  onChange={e => setTime(d.index, e.target.value)}
                  aria-label={`Time for day ${d.index + 1}${defaultTime ? ' (leave empty for the usual time)' : ''}`}
                  title={defaultTime ? 'Leave empty to use the usual time' : 'Optional time for this day'}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
