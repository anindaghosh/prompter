'use client';

import { useEffect, useState } from 'react';
import { onStdbConnected } from '@/lib/spacetimedb';
import type { DbConnection } from '@/module_bindings';
import BottomNav from '@/components/BottomNav';
import { AVATARS, avatarUrl } from '@/hooks/useGameSocket';

type GlobalLeaderboard = InstanceType<typeof DbConnection>['db']['globalLeaderboard'] extends { iter(): Iterable<infer R> } ? R : never;
type UserProfile = InstanceType<typeof DbConnection>['db']['userProfile'] extends { iter(): Iterable<infer R> } ? R : never;

function formatDate(updatedAtUs: bigint): string {
  const ms = Number(updatedAtUs / 1000n);
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<GlobalLeaderboard[]>([]);
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onStdbConnected((conn) => {
      const rebuildEntries = () => {
        const rows = [...conn.db.globalLeaderboard.iter()];
        rows.sort((a, b) => b.wins - a.wins || b.bestScore - a.bestScore);
        setEntries(rows);
      };
      const rebuildProfiles = () => {
        const map = new Map<string, UserProfile>();
        for (const p of conn.db.userProfile.iter()) map.set(p.identity.toHexString(), p);
        setProfiles(map);
      };

      conn.subscriptionBuilder()
        .onApplied(() => {
          setConnected(true);
          rebuildEntries();
          rebuildProfiles();
        })
        .subscribe(['SELECT * FROM global_leaderboard', 'SELECT * FROM user_profile']);

      conn.db.globalLeaderboard.onInsert(() => rebuildEntries());
      conn.db.globalLeaderboard.onUpdate(() => rebuildEntries());
      conn.db.globalLeaderboard.onDelete(() => rebuildEntries());
      conn.db.userProfile.onInsert(() => rebuildProfiles());
      conn.db.userProfile.onUpdate(() => rebuildProfiles());
    });
  }, []);

  const avatarForEntry = (entry: GlobalLeaderboard) => {
    const profile = profiles.get(entry.identity.toHexString());
    if (profile) return avatarUrl(AVATARS[profile.avatarId % AVATARS.length]);
    return null;
  };

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 96 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="po-kicker" style={{ marginBottom: 6 }}>Global · Season 01</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, letterSpacing: '-0.03em', color: 'var(--black)' }}>
            ▦ Leaderboard
          </h1>
        </div>

        {!connected ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', opacity: 0.5 }}>
            <div className="po-mono" style={{ fontSize: 14, color: 'var(--black)' }}>connecting...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="po-panel" style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div className="po-kicker" style={{ color: 'var(--acid)', opacity: 1, marginBottom: 8 }}>Empty</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.7, color: 'var(--paper)' }}>
              No scores yet. Play a full game to appear here!
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {entries.length >= 1 && (
              <div className="po-panel" style={{ marginBottom: 12 }}>
                <div className="po-kicker" style={{ color: 'var(--acid)', opacity: 1, marginBottom: 12 }}>Top Players</div>
                {entries.slice(0, 3).map((entry, i) => {
                  const rank = i + 1;
                  return (
                    <div
                      key={entry.playerName}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0',
                        borderBottom: i < Math.min(entries.length - 1, 2) ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      }}
                      className="animate-slide-up"
                    >
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 900,
                        fontSize: rank === 1 ? 20 : 15,
                        color: rank === 1 ? 'var(--acid)' : 'var(--paper)',
                        width: 28, textAlign: 'center', flexShrink: 0,
                      }}>
                        {String(rank).padStart(2, '0')}
                      </span>
                      <div className="po-avatar" style={{ background: rank === 1 ? 'var(--acid)' : 'rgba(255,255,255,0.1)', color: rank === 1 ? 'var(--ink)' : 'var(--paper)', borderColor: rank === 1 ? 'var(--acid)' : 'rgba(255,255,255,0.2)' }}>
                        {avatarForEntry(entry)
                          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={avatarForEntry(entry)!} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
                          : entry.playerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--paper)' }}>
                          {entry.playerName}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5, marginTop: 1, color: 'var(--paper)' }}>
                          {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? 's' : ''} · {formatDate(entry.updatedAtUs)}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: rank === 1 ? 'var(--acid)' : 'var(--paper)' }}>
                        {entry.wins}
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, opacity: 0.5 }}> W</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Remaining entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.slice(3).map((entry, i) => {
                const rank = i + 4;
                return (
                  <div
                    key={entry.playerName}
                    className="po-row animate-slide-up"
                    style={{ animationDelay: `${(i + 3) * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 13, width: 28, textAlign: 'center', flexShrink: 0, color: 'var(--black)' }}>
                      #{rank}
                    </span>
                    <div className="po-avatar">
                      {avatarForEntry(entry)
                        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={avatarForEntry(entry)!} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
                        : entry.playerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--black)' }}>
                        {entry.playerName}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.45, marginTop: 1, color: 'var(--black)' }}>
                        {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? 's' : ''} · {entry.bestScore} pts best
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--black)' }}>
                      {entry.wins}
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, opacity: 0.6 }}> W</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
