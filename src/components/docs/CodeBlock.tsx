import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  filename?: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  className = '',
  filename,
  language,
}) => {
  const [copied, setCopied] = useState(false);

  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (React.isValidElement(node) && node.props && (node.props as any).children) {
      return extractText((node.props as any).children);
    }
    return '';
  };

  const codeText = extractText(children).trim();
  const detectedLang = language || (className.match(/language-(\w+)/)?.[1] ?? '');
  const isTerminal = detectedLang === 'bash' || detectedLang === 'sh';

  const handleCopy = async () => {
    if (!codeText) return;
    try {
      await navigator.clipboard.writeText(codeText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = codeText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative my-5 overflow-hidden rounded-xl not-prose"
      style={{
        backgroundColor: 'rgb(var(--color-foreground)/0.05)',
        border: '1px solid rgb(var(--color-border))',
      }}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b font-mono text-xs select-none"
        style={{
          backgroundColor: 'rgb(var(--color-foreground)/0.03)',
          borderColor: 'rgb(var(--color-border))',
          color: 'rgb(var(--color-muted-foreground))',
        }}
      >
        <div className="flex items-center gap-2">
          {/* macOS traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
          </div>

          {filename ? (
            <span className="font-medium" style={{ color: 'rgb(var(--color-foreground))' }}>{filename}</span>
          ) : detectedLang ? (
            <span className="uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1">
              {isTerminal && <Terminal className="w-3 h-3" style={{ color: 'rgb(var(--color-success))' }} />}
              {detectedLang}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider">code</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-sans transition-colors"
          style={{ color: 'rgb(var(--color-muted-foreground))' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgb(var(--color-foreground)/0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgb(var(--color-foreground))';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgb(var(--color-muted-foreground))';
          }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" style={{ color: 'rgb(var(--color-success))' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgb(var(--color-success))' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div
        className="p-4 overflow-x-auto font-mono text-[13px] leading-relaxed"
        style={{ color: 'rgb(var(--color-foreground))' }}
      >
        <pre className="m-0 p-0 bg-transparent border-0">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
};
