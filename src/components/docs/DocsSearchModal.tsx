import React, { useState, useEffect, useRef } from 'react';
import { Search, Hash, CornerDownLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllDocItems } from '../../config/docsNav';

interface DocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsSearchModal: React.FC<DocsSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const allItems = getAllDocItems();

  const filteredItems = query.trim()
    ? allItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.toLowerCase().includes(q))
        );
      })
    : allItems.slice(0, 6);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      navigate(`/docs/${target.slug === 'introduction' ? '' : target.slug}`);
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-foreground) 50%, transparent)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden z-10 font-inter-tight"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-card-background) 50%, transparent)',
            borderColor: 'var(--color-border)',
          }}
        >
          <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--color-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation, guides, CLI commands..."
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--color-foreground)' }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md transition-colors"
              style={{ color: 'var(--color-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded"
              style={{
                backgroundColor: 'var(--color-muted)',
                color: 'var(--color-muted)',
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
              No documentation pages found for{' '}
              <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
                "{query}"
              </span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.slug}
                  onClick={() => {
                    navigate(`/docs/${item.slug === 'introduction' ? '' : item.slug}`);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'color-mix(in srgb, var(--color-foreground) 6%, transparent)' : 'transparent',
                    color: 'var(--color-foreground)',
                  }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="p-2 rounded-lg mt-0.5 shrink-0"
                      style={{
                        backgroundColor: isSelected
                          ? 'color-mix(in srgb, var(--color-foreground) 10%, transparent)'
                          : 'var(--color-card-background)',
                        color: 'var(--color-muted)',
                      }}
                    >
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {item.category}
                        </span>
                        {item.badge && (
                          <span
                            className="text-[10px] font-bold px-1.5 rounded"
                            style={{
                              backgroundColor: 'var(--color-muted)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div
                        className="text-xs truncate"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CornerDownLeft
                      className="w-4 h-4 shrink-0 ml-2"
                      style={{ color: 'var(--color-muted)' }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2.5 border-t flex items-center justify-between text-[11px] select-none"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-card-background) 50%, transparent)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              {['↑', '↓'].map((k) => (
                <kbd
                  key={k}
                  className="px-1 py-0.5 font-mono text-[9px] rounded"
                  style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted)' }}
                >
                  {k}
                </kbd>
              ))}
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className="px-1 py-0.5 font-mono text-[9px] rounded"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted)' }}
              >
                ↵
              </kbd>
              select
            </span>
          </div>
          <span>NoBadFonts Docs</span>
        </div>
      </div>
    </div>
  );
};
