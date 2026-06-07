'use client';

import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
      style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--r)',
        border: 'var(--bd)',
        background: 'var(--white)',
        boxShadow: 'var(--sh-xs)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 16,
        padding: 0,
        color: 'var(--black)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = 'var(--sh-sm)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh-xs)'; }}
      onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh-xs)'; }}
    >
      {theme === 'light' ? '◑' : '◐'}
    </button>
  );
}
