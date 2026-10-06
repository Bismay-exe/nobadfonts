import React from 'react';
import { Info, Lightbulb, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'success';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const CONFIG: Record<
  CalloutType,
  {
    borderColor: string;
    bgVar: string;
    iconColor: string;
    defaultTitle: string;
    Icon: React.ElementType;
  }
> = {
  note: {
    borderColor: '#3b82f6',
    bgVar: 'rgba(59,130,246,0.06)',
    iconColor: '#3b82f6',
    defaultTitle: 'Note',
    Icon: Info,
  },
  tip: {
    borderColor: 'var(--color-success)',
    bgVar: 'color-mix(in srgb, var(--color-success) 6%, transparent)',
    iconColor: 'var(--color-success)',
    defaultTitle: 'Tip',
    Icon: Lightbulb,
  },
  warning: {
    borderColor: 'var(--color-warning)',
    bgVar: 'color-mix(in srgb, var(--color-warning) 6%, transparent)',
    iconColor: 'var(--color-warning)',
    defaultTitle: 'Warning',
    Icon: AlertTriangle,
  },
  danger: {
    borderColor: 'var(--color-warning)',
    bgVar: 'color-mix(in srgb, var(--color-warning) 6%, transparent)',
    iconColor: 'var(--color-warning)',
    defaultTitle: 'Important',
    Icon: AlertOctagon,
  },
  success: {
    borderColor: 'var(--color-success)',
    bgVar: 'color-mix(in srgb, var(--color-success) 6%, transparent)',
    iconColor: 'var(--color-success)',
    defaultTitle: 'Success',
    Icon: CheckCircle2,
  },
};

export const Callout: React.FC<CalloutProps> = ({ type = 'note', title, children }) => {
  const cfg = CONFIG[type] || CONFIG.note;
  const { Icon } = cfg;

  return (
    <div
      role="alert"
      className="my-6 rounded-xl p-4 not-prose transition-colors"
      style={{
        backgroundColor: cfg.bgVar,
        borderLeft: `4px solid ${cfg.borderColor}`,
        border: `1px solid ${cfg.borderColor}30`,
        borderLeftWidth: '4px',
        borderLeftColor: cfg.borderColor,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: cfg.iconColor }} />
        <div className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--color-foreground)' }}>
          <div className="font-semibold mb-1" style={{ color: cfg.iconColor }}>
            {title || cfg.defaultTitle}
          </div>
          <div style={{ color: 'var(--color-secondary)' }}>{children}</div>
        </div>
      </div>
    </div>
  );
};
