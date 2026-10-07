import { useEffect, useRef } from 'react';

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * Single-key shortcuts, plus two-key "g then x" sequences.
 * `map` is { n: fn, '/': fn, 'g d': fn }. Ignored while typing or when a
 * modifier is held, so they never fight browser/OS shortcuts.
 */
export default function useHotkeys(map) {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    let pendingG = 0;

    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector('dialog[open]')) return;

      const key = e.key.toLowerCase();
      const handlers = mapRef.current;

      if (pendingG && Date.now() - pendingG < 900) {
        pendingG = 0;
        const combo = handlers[`g ${key}`];
        if (combo) {
          e.preventDefault();
          combo(e);
          return;
        }
      }
      if (key === 'g') {
        pendingG = Date.now();
        return;
      }
      if (handlers[key]) {
        e.preventDefault();
        handlers[key](e);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
