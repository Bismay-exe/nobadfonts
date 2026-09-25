import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DocsSidebar } from '../docs/DocsSidebar';
import { DocsTableOfContents } from '../docs/DocsTableOfContents';
import { DocsSearchModal } from '../docs/DocsSearchModal';
import Navbar from './Navbar';

export const DocsLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-bricolage-grotesque"
      style={{
        backgroundColor: 'rgb(var(--color-background))',
        color: 'rgb(var(--color-foreground))',
      }}
    >
      {/* Reuse existing app Navbar for visual consistency */}
      <Navbar />

      {/* Mobile menu toggle bar — visible on small screens below the fixed navbar */}
      {/* <div
        className="sticky top-0 z-30 flex zmd:hidden items-center justify-between px-4 py-3 border-b font-inter-tight"
        style={{
          backgroundColor: 'rgb(var(--color-background)/0.9)',
          borderColor: 'rgb(var(--color-border))',
          backdropFilter: 'blur(12px)',
          marginTop: '60px',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'rgb(var(--color-muted-foreground))' }}
          aria-label="Toggle docs navigation"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{mobileMenuOpen ? 'Close Menu' : 'Documentation'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl border transition-all"
          style={{
            color: 'rgb(var(--color-muted-foreground))',
            borderColor: 'rgb(var(--color-border))',
            backgroundColor: 'rgb(var(--color-card))',
          }}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd
            className="text-[10px] font-mono px-1 rounded"
            style={{ backgroundColor: 'rgb(var(--color-muted))', color: 'rgb(var(--color-muted-foreground))' }}
          >
            ⌘K
          </kbd>
        </button>
      </div> */}

      {/* Main 3-column layout container */}
      {/* We use padding-top to clear the fixed Navbar (~56px on mobile, ~72px on desktop) */}
      <div className="flex flex-1 max-w-400 w-full mx-auto" style={{ paddingTop: '72px' }}>

        {/* Desktop Left Sidebar */}
        <aside
          className="hidden md:flex flex-col w-64 shrink-0 sticky h-[calc(100vh-72px)] overflow-y-auto border-r"
          style={{
            top: '72px',
            borderColor: 'rgb(var(--color-border))',
            backgroundColor: 'rgb(var(--color-background))',
          }}
        >
          <DocsSidebar onOpenSearch={() => setSearchOpen(true)} />
        </aside>

        {/* Mobile sidebar drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 transition-opacity"
              style={{ backgroundColor: 'rgb(var(--color-foreground)/0.4)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className="relative w-72 max-w-[85vw] h-full border-r shadow-2xl z-10 flex flex-col pt-4"
              style={{
                backgroundColor: 'rgb(var(--color-background))',
                borderColor: 'rgb(var(--color-border))',
              }}
            >
              <DocsSidebar
                onItemClick={() => setMobileMenuOpen(false)}
                onOpenSearch={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Center content column */}
        <main className="flex-1 min-w-0 px-5 sm:px-10 py-10 max-w-3xl w-full mx-auto">
          <div id="docs-content-container">
            <Outlet />
          </div>
        </main>

        {/* Right column: Table of Contents */}
        <aside
          className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 sticky h-[calc(100vh-72px)] overflow-y-auto py-8 px-5 border-l"
          style={{
            top: '72px',
            borderColor: 'rgb(var(--color-border))',
            backgroundColor: 'rgb(var(--color-background))',
          }}
        >
          <DocsTableOfContents />
        </aside>
      </div>

      {/* Cmd+K Search Modal */}
      <DocsSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
