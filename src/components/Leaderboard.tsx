'use client';

import { LeaderboardEntry } from '@/hooks/useGameSocket';

const RANK_LABELS = ['01', '02', '03'];

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  myPlayerId: string | null;
  currentRound: number;
  totalRounds: number;
  isHost: boolean;
  onNextRound: () => void;
  onPlayAgain: () => void;
  isGameOver: boolean;
}

export default function Leaderboard({
  entries,
  myPlayerId,
  currentRound,
  totalRounds,
  isHost,
  onNextRound,
  onPlayAgain,
  isGameOver,
}: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="po-kicker" style={{ marginBottom: 6 }}>
          {isGameOver ? 'Final Scores' : `Round ${currentRound} / ${totalRounds}`}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {isGameOver ? 'Game Over' : 'Leaderboard'}
        </h2>
        {!isGameOver && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.6, color: 'var(--black)' }}>
            {totalRounds - currentRound} round{totalRounds - currentRound !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Top 3 dark panel */}
      {top3.length > 0 && (
        <div className="po-panel" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="po-kicker" style={{ color: 'var(--acid)', opacity: 1, marginBottom: 12 }}>Top Players</div>
          {top3.map((entry, i) => {
            const isMe = entry.playerId === myPlayerId;
            const initials = entry.playerName.slice(0, 2).toUpperCase();
            return (
              <div
                key={entry.playerId}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < top3.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 900,
                    fontSize: entry.rank === 1 ? 20 : 16,
                    color: entry.rank === 1 ? 'var(--acid)' : 'var(--paper)',
                    width: 28, textAlign: 'center', flexShrink: 0,
                  }}>
                    {RANK_LABELS[entry.rank - 1]}
                  </span>
                  <div className="po-avatar" style={{ background: isMe ? 'var(--acid)' : 'rgba(255,255,255,0.1)', color: isMe ? 'var(--ink)' : 'var(--paper)', borderColor: isMe ? 'var(--acid)' : 'rgba(255,255,255,0.2)' }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--paper)' }}>
                      {entry.playerName}
                      {isMe && <span style={{ fontWeight: 400, opacity: 0.6, fontFamily: 'var(--font-mono)', fontSize: 11 }}> (you)</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: entry.rank === 1 ? 'var(--acid)' : 'var(--paper)' }}>
                    {entry.totalScore}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, opacity: 0.5 }}> pts</span>
                  </div>
                </div>
                {entry.roundScores && entry.roundScores.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 10, paddingLeft: 40 }}>
                    {entry.roundScores.map((score, ri) => (
                      <span key={ri} className="po-chip po-chip--ink" style={{ fontSize: 10 }}>
                        R{ri + 1}: {score}{entry.roundDoublePoints?.[ri] ? ' ⭐' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((entry, i) => {
            const isMe = entry.playerId === myPlayerId;
            const initials = entry.playerName.slice(0, 2).toUpperCase();
            return (
              <div
                key={entry.playerId}
                className="animate-slide-up"
                style={{ animationDelay: `${(top3.length + i) * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className={`po-row${isMe ? ' you' : ''}`}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 14, width: 28, textAlign: 'center', flexShrink: 0, color: isMe ? 'var(--ink)' : 'var(--black)' }}>
                    #{entry.rank}
                  </span>
                  <div className="po-avatar" style={{ background: isMe ? 'var(--ink)' : 'var(--paper-2)', color: isMe ? 'var(--acid)' : 'var(--ink)' }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: isMe ? 'var(--ink)' : 'var(--black)' }}>
                    {entry.playerName}
                    {isMe && <span style={{ fontWeight: 400, opacity: 0.6 }}> (you)</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: isMe ? 'var(--ink)' : 'var(--black)' }}>
                    {entry.totalScore}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, opacity: 0.6 }}> pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {!isGameOver && isHost && (
          <button className="btn btn-dark" onClick={onNextRound}>
            Next Round <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span>
          </button>
        )}
        {!isGameOver && !isHost && (
          <div style={{ textAlign: 'center', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.5, color: 'var(--black)' }}>
            waiting for host to start next round...
          </div>
        )}
        {isGameOver && (
          <>
            {isHost && (
              <button className="btn btn-dark" onClick={onPlayAgain}>
                Play Again <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span>
              </button>
            )}
            {!isHost && (
              <div style={{ textAlign: 'center', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.5, color: 'var(--black)' }}>
                waiting for host to restart...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
