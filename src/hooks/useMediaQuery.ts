import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Matches Tailwind's `lg` breakpoint, consistent with the desktop/mobile
// split already used by AppShell/Sidebar/Header (`lg:hidden`, `hidden lg:flex`).
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
