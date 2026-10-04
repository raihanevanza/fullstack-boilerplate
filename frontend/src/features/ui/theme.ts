import { useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'theme';

function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Until the user picks a theme, the OS setting applies (see the inline script in index.html).
// An explicit choice is stored in localStorage.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage blocked: the theme still applies for this session
    }
    setTheme(next);
  };

  return { theme, toggle };
}
