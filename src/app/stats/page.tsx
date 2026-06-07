'use client';

import { useRouter } from 'next/navigation';
import { useStats } from '@/hooks/useStats';
import StatCard from '@/components/StatCard';
import InsightsPanel from '@/components/InsightsPanel';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(ts: { microsSinceUnixEpoch: bigint }): string {
  const ms = Number(ts.microsSinceUnixEpoch / 1000n);
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StatsPage() {
  const router = useRouter();
  const { stats, history, loading } = useStats();

  const avgSimilarity = stats && stats.gamesPlayed > 0
    ? Math.round(Number(stats.totalSimilarity) / stats.gamesPlayed)
    : 0;

  const winRate = stats && stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

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
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, marginBottom: 8 }}>
            My Stats
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.6 }}>
            Your performance across all games
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', opacity: 0.5 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading…</div>
          </div>
        ) : !stats || stats.gamesPlayed === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎮</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.6 }}>
              Play your first game to see stats here
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 32 }}>
              <StatCard label="Games Played" value={stats.gamesPlayed} />
              <StatCard label="Wins" value={`${stats.gamesWon} (${winRate}%)`} accent />
              <StatCard label="Best Score" value={`${stats.bestScore} pts`} />
              <StatCard label="Avg Similarity" value={`${avgSimilarity}%`} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
                Recent Games
              </h2>

              {history.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.5 }}>No history yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map((entry, i) => {
                    const isTop3 = entry.finalRank <= 3;
                    return (
                      <div
                        key={entry.id.toString()}
                        className={`player-row animate-slide-up`}
                        style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                      >
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          fontSize: isTop3 ? 20 : 14,
                          width: 32,
                          textAlign: 'center',
                          flexShrink: 0,
                        }}>
                          {isTop3 ? RANK_MEDALS[entry.finalRank - 1] : `#${entry.finalRank}`}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>
                            {formatDate(entry.playedAt)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.45, marginTop: 1 }}>
                            {entry.playerCount} player{entry.playerCount !== 1 ? 's' : ''} · {entry.roundsPlayed} round{entry.roundsPlayed !== 1 ? 's' : ''} · {entry.avgSimilarity}% similarity
                          </div>
                        </div>

                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          fontSize: 18,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          {entry.totalScore}
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 11, opacity: 0.6 }}>
                            pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <InsightsPanel stats={stats} history={history} />
          </>
        )}
      </div>
    </div>
  );
}
