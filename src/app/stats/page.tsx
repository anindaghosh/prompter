'use client';

import { useStats } from '@/hooks/useStats';
import StatCard from '@/components/StatCard';
import InsightsPanel from '@/components/InsightsPanel';
import BottomNav from '@/components/BottomNav';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(ts: { microsSinceUnixEpoch: bigint }): string {
  const ms = Number(ts.microsSinceUnixEpoch / 1000n);
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StatsPage() {
  const { stats, history, loading } = useStats();

  const avgSimilarity = stats && stats.gamesPlayed > 0
    ? Math.round(Number(stats.totalSimilarity) / stats.gamesPlayed)
    : 0;

  const winRate = stats && stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 96 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="po-kicker" style={{ marginBottom: 6 }}>Performance</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, letterSpacing: '-0.03em', color: 'var(--black)' }}>
            ◆ My Stats
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', opacity: 0.5 }}>
            <div className="po-mono" style={{ fontSize: 14, color: 'var(--black)' }}>Loading…</div>
          </div>
        ) : !stats || stats.gamesPlayed === 0 ? (
          <div className="po-panel" style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div className="po-kicker" style={{ color: 'var(--acid)', opacity: 1, marginBottom: 8 }}>No Data</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.7, color: 'var(--paper)' }}>
              Play your first game to see stats here
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 32 }}>
              <StatCard label="Games" value={stats.gamesPlayed} />
              <StatCard label="Win Rate" value={`${winRate}%`} accent />
              <StatCard label="Best Score" value={`${stats.bestScore}`} />
              <StatCard label="Avg Similarity" value={`${avgSimilarity}%`} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="po-kicker" style={{ marginBottom: 12 }}>Recent Games</div>

              {history.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.5, color: 'var(--black)' }}>No history yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map((entry, i) => {
                    const isTop3 = entry.finalRank <= 3;
                    return (
                      <div
                        key={entry.id.toString()}
                        className="po-row animate-slide-up"
                        style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                      >
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          fontSize: isTop3 ? 20 : 13,
                          width: 32,
                          textAlign: 'center',
                          flexShrink: 0,
                          color: 'var(--black)',
                        }}>
                          {isTop3 ? RANK_MEDALS[entry.finalRank - 1] : `#${entry.finalRank}`}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--black)' }}>
                            {formatDate(entry.playedAt)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.45, marginTop: 1, color: 'var(--black)' }}>
                            {entry.playerCount} players · {entry.roundsPlayed} rounds · {entry.avgSimilarity}% match
                          </div>
                        </div>

                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--black)' }}>
                          {entry.totalScore}
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, opacity: 0.6 }}> pts</span>
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
      <BottomNav />
    </div>
  );
}
