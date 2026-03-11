import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts
 * All shortcuts only fire when no input element is focused
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const handler = useCallback((e) => {
    // Don't fire when typing in inputs
    const tag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case 'a':
        navigate('/analytics');
        break;
      case 'f':
        navigate('/favorites');
        break;
      case 'c':
        navigate('/compare');
        break;
      case 'h':
        navigate('/');
        break;
      case '?':
        // Could show keyboard shortcut help
        break;
      default:
        break;
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
