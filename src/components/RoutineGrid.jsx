import { useState, useRef, useEffect } from 'react';

/**
 * RoutineGrid — The visual sequencer-style routine builder.
 *
 * Props:
 *   pattern: array of { active: bool, label?: string }
 *   onChange: (newPattern) => void
 *   readOnly: bool (for display-only mode)
 *   highlightIndex: number | null (to highlight current cycle position)
 */
export default function RoutineGrid({ pattern, onChange, readOnly = false, highlightIndex = null }) {
  const [editingLabel, setEditingLabel] = useState(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (editingLabel !== null && labelRef.current) {
      labelRef.current.focus();
      labelRef.current.select();
    }
  }, [editingLabel]);

  if (!pattern || pattern.length === 0) {
    return <div className="empty-state"><p>No pattern configured</p></div>;
  }

  const toggleDay = (index) => {
    if (readOnly) return;
    const newPattern = [...pattern];
    newPattern[index] = {
      ...newPattern[index],
      active: !newPattern[index].active,
      label: !newPattern[index].active ? newPattern[index].label : '',
    };
    onChange(newPattern);
  };

  const updateLabel = (index, label) => {
    if (readOnly) return;
    const newPattern = [...pattern];
    newPattern[index] = { ...newPattern[index], label };
    onChange(newPattern);
  };

  const handleLabelKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      setEditingLabel(null);
    } else if (e.key === 'Escape') {
      setEditingLabel(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Move to next active cell for label editing
      const nextActiveIndex = pattern.findIndex((p, i) => i > index && p.active);
      if (nextActiveIndex !== -1) {
        setEditingLabel(nextActiveIndex);
      } else {
        setEditingLabel(null);
      }
    }
  };

  return (
    <div className="sequencer-builder-grid">
      {pattern.map((day, index) => {
        const isHighlighted = highlightIndex === index;
        return (
          <div
            key={index}
            className={`sequencer-builder-cell ${day.active ? 'active' : ''} ${isHighlighted ? 'highlighted' : ''}`}
            onClick={() => toggleDay(index)}
            onDoubleClick={() => {
              if (!readOnly && day.active) {
                setEditingLabel(index);
              }
            }}
            title={readOnly ? (day.label || (day.active ? 'Active' : 'Rest')) : 'Click to toggle, double-click to label'}
          >
            <span className="cell-num">D{index + 1}</span>
            <span className="cell-dot-node" />
            {day.active && editingLabel === index ? (
              <input
                ref={labelRef}
                className="label-input-inline"
                value={day.label || ''}
                onChange={e => updateLabel(index, e.target.value)}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={e => handleLabelKeyDown(e, index)}
                onClick={e => e.stopPropagation()}
                maxLength={10}
                placeholder="label"
              />
            ) : (
              day.active && day.label && (
                <span className="cell-tag">{day.label}</span>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Mini version of the routine grid for dashboard display.
 */
export function RoutineMiniGrid({ pattern, currentIndex }) {
  if (!pattern || pattern.length === 0) return null;

  return (
    <div className="routine-mini-grid">
      {pattern.map((day, i) => (
        <div
          key={i}
          className={`routine-mini-cell ${day.active ? 'active' : ''} ${i === currentIndex ? 'current' : ''}`}
          title={`Day ${i + 1}: ${day.active ? (day.label || 'Active') : 'Rest'}`}
        />
      ))}
    </div>
  );
}
