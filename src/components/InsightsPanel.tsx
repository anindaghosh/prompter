'use client';

import { useInsights } from '@/hooks/useInsights';
import type { UserStatsRow, GameHistoryRow } from '@/hooks/useStats';

const MIN_GAMES = 5;

const SECTIONS: { key: 'strengths' | 'weaknesses' | 'improvements'; title: string; chipClass: string }[] = [
  { key: 'strengths',    title: 'Strengths',    chipClass: 'po-chip--acid' },
  { key: 'weaknesses',   title: 'Weaknesses',   chipClass: 'po-chip--danger' },
  { key: 'improvements', title: 'Improvements', chipClass: 'po-chip--ink' },
];

const SECTION_ACCENT: Record<string, string> = {
  strengths:    'var(--acid)',
  weaknesses:   'var(--danger)',
  improvements: 'var(--ink)',
};

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
        <div>
          <div className="po-kicker" style={{ marginBottom: 2 }}>AI Coaching</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--black)' }}>
            Insights
          </h2>
        </div>
        {gamesPlayed >= MIN_GAMES && (
          <button
            className="btn btn-ghost btn-sm btn-auto"
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
        <div className="po-panel" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div className="po-kicker" style={{ color: 'var(--acid)', opacity: 1, marginBottom: 8 }}>Locked</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.7, color: 'var(--paper)' }}>
            Play {MIN_GAMES - gamesPlayed} more game{MIN_GAMES - gamesPlayed !== 1 ? 's' : ''} to unlock AI insights
          </p>
        </div>
      ) : error && !insights ? (
        <div className="po-card" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-sm btn-dark btn-auto" onClick={refresh} disabled={refreshing}>Retry</button>
        </div>
      ) : refreshing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map(s => (
            <div key={s.key} className="po-card" style={{ borderLeft: `4px solid ${SECTION_ACCENT[s.key]}` }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 12, opacity: 0.5, color: 'var(--black)' }}>
                {s.title}
              </div>
              <div className="skeleton-bar" style={{ height: 10, width: '92%', marginBottom: 7 }} />
              <div className="skeleton-bar" style={{ height: 10, width: '78%', marginBottom: 7 }} />
              <div className="skeleton-bar" style={{ height: 10, width: '85%' }} />
            </div>
          ))}
        </div>
      ) : !insights ? (
        <div className="po-card" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.6, color: 'var(--black)' }}>
            Generate AI insights to see your personalized coaching.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)' }}>{error}</p>
          )}
          {SECTIONS.map(s => {
            const items = insights[s.key];
            if (items.length === 0) return null;
            return (
              <div key={s.key} className="po-card" style={{ borderLeft: `4px solid ${SECTION_ACCENT[s.key]}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className={`po-chip ${s.chipClass}`}>{s.title}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((item, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.45, color: 'var(--black)' }}>{item}</li>
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
