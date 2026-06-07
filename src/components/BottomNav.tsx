'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/',            label: '>_ PLAY'   },
  { href: '/leaderboard', label: '▦ RANK'    },
  { href: '/stats',       label: '◆ STATS'   },
  { href: '/profile',     label: '○ PROFILE' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {ITEMS.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item${pathname === item.href ? ' active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
