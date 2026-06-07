'use client';

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('po-theme') as Theme) ?? 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('po-theme', next);
      return next;
    });
  };

  return { theme, toggle };
}
