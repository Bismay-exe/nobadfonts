import React, { useState } from 'react';
import { Type, Sliders, RotateCcw } from 'lucide-react';

interface FontPlaygroundEmbedProps {
  primaryFont?: string;
  secondaryFont?: string;
  defaultText?: string;
  title?: string;
  category?: string;
}

export const FontPlaygroundEmbed: React.FC<FontPlaygroundEmbedProps> = ({
  primaryFont = 'Geist, sans-serif',
  secondaryFont = 'Playfair Display, serif',
  defaultText = 'Typography is the art and technique of arranging type to make written language legible, readable, and appealing.',
  title = 'Typography Pairing Live Preview',
  category = 'Curated Pair',
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
        border: '1px solid rgb(var(--color-border))',
        backgroundColor: 'rgb(var(--color-card)/0.5)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b font-inter-tight"
        style={{
          backgroundColor: 'rgb(var(--color-card)/0.3)',
          borderColor: 'rgb(var(--color-border))',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{
              backgroundColor: 'rgb(var(--color-highlight)/0.1)',
              color: 'rgb(var(--color-highlight))',
            }}
          >
            <Type className="w-4 h-4" />
          </div>
          <div>
            <div
              className="text-xs font-semibold flex items-center gap-2"
              style={{ color: 'rgb(var(--color-foreground))' }}
            >
              {title}
              <span
                className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: 'rgb(var(--color-muted))',
                  color: 'rgb(var(--color-muted-foreground))',
                }}
              >
                {category}
              </span>
            </div>
            <div
              className="text-[11px] font-mono"
              style={{ color: 'rgb(var(--color-muted-foreground))' }}
            >
              Primary: {primaryFont.split(',')[0]} · Secondary: {secondaryFont.split(',')[0]}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-1 text-[11px] font-medium transition-colors"
          style={{ color: 'rgb(var(--color-muted-foreground))' }}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'rgb(var(--color-foreground))'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'rgb(var(--color-muted-foreground))'}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Controls */}
      <div
        className="px-5 py-3 border-b flex flex-wrap items-center gap-6 text-xs font-inter-tight"
        style={{
          backgroundColor: 'rgb(var(--color-foreground)/0.02)',
          borderColor: 'rgb(var(--color-border))',
          color: 'rgb(var(--color-muted-foreground))',
        }}
      >
        {[
          { label: 'Size', value: fontSize, min: 14, max: 48, step: 1, unit: 'px', onChange: setFontSize },
          { label: 'Weight', value: fontWeight, min: 300, max: 800, step: 100, unit: '', onChange: setFontWeight },
          { label: 'Tracking', value: letterSpacing, min: -2, max: 5, step: 0.5, unit: 'px', onChange: setLetterSpacing },
        ].map(({ label, value, min, max, step, unit, onChange }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[11px] font-medium w-12">{label}:</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(Number(e.target.value) as any)}
              className="w-20 cursor-pointer"
              style={{ accentColor: 'rgb(var(--color-foreground))' }}
            />
            <span className="font-mono text-[11px] w-10 text-right">
              {value}{unit}
            </span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="p-6">
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
            color: 'rgb(var(--color-foreground))',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            width: '100%',
          }}
        />
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2.5 border-t flex items-center justify-between text-[11px] font-inter-tight"
        style={{
          backgroundColor: 'rgb(var(--color-foreground)/0.02)',
          borderColor: 'rgb(var(--color-border))',
          color: 'rgb(var(--color-muted-foreground))',
        }}
      >
        <span className="flex items-center gap-1.5">
          <Sliders className="w-3 h-3" />
          Click and edit the text above to test contrast &amp; legibility
        </span>
        <span className="font-mono text-[10px]">
          font-family: '{primaryFont.split(',')[0].trim()}';
        </span>
      </div>
    </div>
  );
};
