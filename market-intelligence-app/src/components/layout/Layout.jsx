import { useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import CompareBar from '../common/CompareBar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export default function Layout() {
  useKeyboardShortcuts();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);
  const handleSearchOpen = useCallback(() => setSearchOpen(true), []);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  const location = useLocation();

  // Homepage is immersive — no sidebar, no header, full bleed
  const isHome = location.pathname === '/' || location.pathname === '';

  if (isHome) {
    return (
      <div className="h-screen w-screen overflow-hidden relative" style={{ background: '#050410' }}>
        {/* === TOP RIGHT: Search bar === */}
        <div className="fixed top-5 right-6 z-50">
          <button
            onClick={handleSearchOpen}
            className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              color: 'rgba(200,210,230,0.6)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(150,180,255,0.3)'; e.currentTarget.style.color = 'rgba(220,230,255,0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(200,210,230,0.6)'; }}
          >
            <Search size={14} />
            <span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Search banks, people...</span>
            <kbd style={{ fontSize: 10, opacity: 0.5, marginLeft: 8, fontFamily: 'monospace' }}>⌘K</kbd>
          </button>
        </div>

        {/* === LEFT: Galaxy sidebar trigger === */}
        <div
          className="fixed left-0 top-0 h-full z-50 flex items-center"
          style={{ width: 40 }}
          onMouseEnter={() => setSidebarHover(true)}
        >
          {/* Galaxy indicator — 3 concentric rings + dots */}
          {!sidebarHover && (
            <div className="ml-1.5 flex flex-col items-center gap-2.5" style={{ opacity: 0.7, transition: 'opacity 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}>
              <svg width="36" height="36" viewBox="0 0 36 36">
                {/* Outer ring */}
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(180,200,255,0.4)" strokeWidth="1.2" />
                {/* Middle ring */}
                <circle cx="18" cy="18" r="9.5" fill="none" stroke="rgba(180,200,255,0.5)" strokeWidth="1.2" />
                {/* Inner ring */}
                <circle cx="18" cy="18" r="4.5" fill="none" stroke="rgba(200,215,255,0.6)" strokeWidth="1.2" />
                {/* Core glow */}
                <circle cx="18" cy="18" r="2.5" fill="rgba(220,230,255,0.85)">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Orbiting dot 1 */}
                <circle cx="18" cy="3" r="1.5" fill="rgba(200,215,255,0.8)">
                  <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="8s" repeatCount="indefinite" />
                </circle>
                {/* Orbiting dot 2 */}
                <circle cx="33" cy="18" r="1.2" fill="rgba(180,200,255,0.6)">
                  <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="12s" repeatCount="indefinite" />
                </circle>
              </svg>
              {/* Navigation dots — menu hint */}
              <div className="flex flex-col gap-[5px] items-center">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(180,200,255,0.55)' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(180,200,255,0.45)' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(180,200,255,0.35)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar slides in on hover */}
        <div
          className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${sidebarHover ? 'translate-x-0' : '-translate-x-full'}`}
          onMouseLeave={() => setSidebarHover(false)}
        >
          <Sidebar onSearchOpen={handleSearchOpen} />
        </div>

        {/* Full-screen content */}
        <Outlet />

        {/* Search overlay (reuse Header's search) */}
        {searchOpen && (
          <div className="fixed inset-0 z-[60]">
            <Header searchOpen={searchOpen} onSearchOpen={handleSearchOpen} onSearchClose={handleSearchClose} minimal />
          </div>
        )}

        <CompareBar />
      </div>
    );
  }

  // All other pages — normal layout with sidebar
  return (
    <div className="min-h-screen bg-surface-2 text-fg flex">
      <Sidebar onSearchOpen={handleSearchOpen} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header searchOpen={searchOpen} onSearchOpen={handleSearchOpen} onSearchClose={handleSearchClose} minimal />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <CompareBar />
    </div>
  );
}
