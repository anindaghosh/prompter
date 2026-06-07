'use client';

import { useInsights } from '@/hooks/useInsights';
import type { UserStatsRow, GameHistoryRow } from '@/hooks/useStats';

const MIN_GAMES = 5;

const SECTIONS: { key: 'strengths' | 'weaknesses' | 'improvements'; title: string; icon: string; color: string }[] = [
  { key: 'strengths',    title: 'Strengths',    icon: '💪', color: 'var(--teal)' },
  { key: 'weaknesses',   title: 'Weaknesses',   icon: '🎯', color: 'var(--coral)' },
  { key: 'improvements', title: 'Improvements', icon: '🚀', color: 'var(--sky)' },
];

function formatCooldown(generatedAt: number): string {
  const remaining = generatedAt + 24 * 60 * 60 * 1000 - Date.now();
  if (remaining <= 0) return '';
  const h = Math.floor(remaining / (60 * 60 * 1000));
  const m = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function InsightsPanel({ stats, history }: { stats: UserStatsRow | null; history: GameHistoryRow[] }) {
  const { insights, generatedAt, refreshing, error, canRefresh, refresh } = useInsights({ stats, history });

  const gamesPlayed = stats?.gamesPlayed ?? 0;

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
          ✨ AI Insights
        </h2>
        {gamesPlayed >= MIN_GAMES && (
          <button
            className="btn btn-sm btn-gold"
            onClick={refresh}
            disabled={refreshing || !canRefresh}
            title={!canRefresh && generatedAt !== null ? `Available in ${formatCooldown(generatedAt)}` : undefined}
          >
            {refreshing
              ? 'Analyzing…'
              : !canRefresh && generatedAt !== null
                ? `Refresh in ${formatCooldown(generatedAt)}`
                : insights ? 'Refresh' : 'Generate'}
          </button>
        )}
      </div>

      {gamesPlayed < MIN_GAMES ? (
        <div className="card" style={{ background: 'var(--white)', padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.6 }}>
            Play {MIN_GAMES - gamesPlayed} more game{MIN_GAMES - gamesPlayed !== 1 ? 's' : ''} to unlock AI insights
          </p>
        </div>
      ) : error && !insights ? (
        <div className="card" style={{ background: 'var(--white)', padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--coral)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-sm btn-dark" onClick={refresh} disabled={refreshing}>Retry</button>
        </div>
      ) : refreshing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map(s => (
            <div key={s.key} className="card" style={{ background: 'var(--white)', padding: 16, borderLeft: `5px solid ${s.color}` }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 12, opacity: 0.5 }}>
                {s.icon} {s.title}
              </div>
              <div className="skeleton-bar" style={{ height: 10, width: '92%', marginBottom: 7 }} />
              <div className="skeleton-bar" style={{ height: 10, width: '78%', marginBottom: 7 }} />
              <div className="skeleton-bar" style={{ height: 10, width: '85%' }} />
            </div>
          ))}
        </div>
      ) : !insights ? (
        <div className="card" style={{ background: 'var(--white)', padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.6 }}>
            Generate AI insights to see your personalized coaching.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--coral)' }}>{error}</p>
          )}
          {SECTIONS.map(s => {
            const items = insights[s.key];
            if (items.length === 0) return null;
            return (
              <div key={s.key} className="card" style={{ background: 'var(--white)', padding: 16, borderLeft: `5px solid ${s.color}` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                  {s.icon} {s.title}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((item, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.45 }}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
