'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStdbConnection, onStdbConnected } from '@/lib/spacetimedb';
import type { DbConnection } from '@/module_bindings';

type GlobalLeaderboard = InstanceType<typeof DbConnection>['db']['globalLeaderboard'] extends { iter(): Iterable<infer R> } ? R : never;

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(updatedAtUs: bigint): string {
  const ms = Number(updatedAtUs / 1000n);
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<GlobalLeaderboard[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const conn = getStdbConnection();

    onStdbConnected((conn) => {
      const rebuild = () => {
        const rows = [...conn.db.globalLeaderboard.iter()];
        rows.sort((a, b) => b.wins - a.wins || b.bestScore - a.bestScore);
        setEntries(rows);
      };

      conn.subscriptionBuilder()
        .onApplied(() => {
          setConnected(true);
          rebuild();
        })
        .subscribe(['SELECT * FROM global_leaderboard']);

      conn.db.globalLeaderboard.onInsert(() => rebuild());
      conn.db.globalLeaderboard.onUpdate(() => rebuild());
      conn.db.globalLeaderboard.onDelete(() => rebuild());
    });
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, opacity: 0.6, padding: '4px 0' }}
          >
            ← Home
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, marginBottom: 8 }}>
            Global Leaderboard
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.6 }}>
            Personal best scores across all games
          </p>
        </div>

        {!connected ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', opacity: 0.5 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Connecting…</div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎮</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.6 }}>
              No scores yet. Play a full game to appear here!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={entry.playerName}
                  className={`player-row ${isTop3 ? `rank-${rank}` : ''} animate-slide-up`}
                  style={{ animationDelay: `${i * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  {/* Rank */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: isTop3 ? 22 : 16,
                    width: 32,
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    {isTop3 ? RANK_MEDALS[rank - 1] : `#${rank}`}
                  </div>

                  {/* Name + secondary stats */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>
                      {entry.playerName}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.45, marginTop: 1 }}>
                      {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? 's' : ''} · {entry.bestScore} pts best · {formatDate(entry.updatedAtUs)}
                    </div>
                  </div>

                  {/* Wins */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    {entry.wins}
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 11, opacity: 0.6 }}>
                      W
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
