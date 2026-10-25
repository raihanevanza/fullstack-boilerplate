import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'theme';

const root = document.documentElement;
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// data-theme is "light", "dark" or "system" (the Rupa tokens resolve "system" with the OS setting)
function currentTheme(): Theme {
  const set = root.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return darkQuery.matches ? 'dark' : 'light';
}

// Until the user picks a theme, the OS setting applies (see the inline script in index.html).
// An explicit choice is stored in localStorage.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  // Follow OS changes while no explicit choice is stored
  useEffect(() => {
    const onChange = () => setTheme(currentTheme());
    darkQuery.addEventListener('change', onChange);
    return () => darkQuery.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage blocked: the theme still applies for this session
    }
    setTheme(next);
  };

  return { theme, toggle };
}
