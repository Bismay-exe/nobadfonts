import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface FontPlaygroundEmbedProps {
  primaryFont?: string;
  defaultText?: string;
}

export const FontPlaygroundEmbed: React.FC<FontPlaygroundEmbedProps> = ({
  primaryFont = 'Geist, sans-serif',
  defaultText = 'Typography is the art and technique of arranging type to make written language legible, readable, and appealing.',
}) => {
  const [text, setText] = useState(defaultText);
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState(400);
  const [letterSpacing, setLetterSpacing] = useState(0);

  const resetAll = () => {
    setText(defaultText);
    setFontSize(24);
    setFontWeight(400);
    setLetterSpacing(0);
  };

  return (
    <div
      className="my-8 rounded-2xl overflow-hidden not-prose transition-all"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'color-mix(in srgb, var(--color-card-background) 50%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b font-inter-tight"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-foreground) 3%, transparent)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* macOS traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
          </div>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-1 text-[11px] font-medium transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-foreground)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Controls */}
      <div
        className="px-3 py-3 border-b flex items-center gap-6 text-xs font-inter-tight"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-foreground) 2%, transparent)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        {[
          { label: 'Size', value: fontSize, min: 14, max: 48, step: 1, unit: 'px', onChange: setFontSize },
          { label: 'Weight', value: fontWeight, min: 300, max: 800, step: 100, unit: '', onChange: setFontWeight },
          { label: 'Tracking', value: letterSpacing, min: -2, max: 5, step: 0.5, unit: 'px', onChange: setLetterSpacing },
        ].map(({ label, value, min, max, step, unit, onChange }) => (
          <div key={label} className="flex w-full items-center gap-2">
            <span className="text-[11px] font-medium">{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(Number(e.target.value) as any)}
              className="w-full h-0.5 bg-foreground/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 sm:[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-2 sm:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-grab [&::-moz-range-thumb]:w-2 sm:[::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-2 sm:[::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab"
              style={{ accentColor: 'var(--color-foreground)' }}
            />
            <span className="hidden sm:block font-mono text-[11px] text-right">
              {value}{unit}
            </span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="p-4">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something to preview this font..."
          style={{
            fontFamily: primaryFont,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight,
            letterSpacing: `${letterSpacing}px`,
            lineHeight: 1.4,
            backgroundColor: 'transparent',
            color: 'var(--color-foreground)',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
};
