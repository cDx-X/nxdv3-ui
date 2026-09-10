import React from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

/**
 * A dual-handle range slider (from–to) built from two overlaid <input type=range>
 * elements. The lower handle picks the start index, the upper handle the end index.
 */
export const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, value, onChange }) => {
  const [lo, hi] = value;
  const span = Math.max(1, max - min);
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  const handleLo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onChange([Math.max(min, Math.min(v, hi - 1)), hi]);
  };
  const handleHi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onChange([lo, Math.min(max, Math.max(v, lo + 1))]);
  };

  return (
    <div style={{ position: 'relative', height: '24px', width: '100%' }}>
      {/* Colored selected range track */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: `${loPct}%`,
          width: `${Math.max(0, hiPct - loPct)}%`,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.35)',
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={lo}
        onChange={handleLo}
        aria-label="Range start"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '24px',
          margin: '0',
          background: 'transparent',
          pointerEvents: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
        className="range-slider-input"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={hi}
        onChange={handleHi}
        aria-label="Range end"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '24px',
          margin: '0',
          background: 'transparent',
          pointerEvents: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
        className="range-slider-input"
      />
      <style>{`
        .range-slider-input {
          -webkit-appearance: none;
          appearance: none;
        }
        .range-slider-input::-webkit-slider-runnable-track {
          background: transparent;
          height: 4px;
        }
        .range-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fbbf24;
          border: 2px solid #0f0a19;
          cursor: pointer;
          margin-top: -5px;
          pointer-events: auto;
        }
        .range-slider-input::-moz-range-track {
          background: transparent;
          height: 4px;
        }
        .range-slider-input::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fbbf24;
          border: 2px solid #0f0a19;
          cursor: pointer;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
};
