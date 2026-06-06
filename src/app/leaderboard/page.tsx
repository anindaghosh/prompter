'use client';

import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const router = useRouter();
  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, opacity: 0.6, padding: '4px 0' }}>
            ← Home
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, marginBottom: 8 }}>Global Leaderboard</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.6 }}>Coming soon — persistent global rankings powered by SpacetimeDB.</p>
        </div>
      </div>
    </div>
  );
}
