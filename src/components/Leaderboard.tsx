'use client';

import { LeaderboardEntry } from '@/hooks/useGameSocket';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 26,
          marginBottom: 4,
        }}>
          {isGameOver ? '🏆 Final Scores' : `Round ${currentRound} / ${totalRounds}`}
        </h2>
        {!isGameOver && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.6 }}>
            {totalRounds - currentRound} round{totalRounds - currentRound !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Rank rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((entry, i) => {
          const isMe = entry.playerId === myPlayerId;
          const isTop3 = entry.rank <= 3;

          const hasRounds = entry.roundScores && entry.roundScores.length > 0;

          return (
            <div
              key={entry.playerId}
              className={`animate-slide-up`}
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div
                className={`player-row ${isMe ? 'is-you' : ''} ${isTop3 && !isMe ? `rank-${entry.rank}` : ''}`}
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
                {isTop3 ? RANK_MEDALS[entry.rank - 1] : `#${entry.rank}`}
              </div>

              {/* Avatar */}
              <div className="avatar" style={{ width: 36, height: 36, fontSize: 18 }}>
                {entry.playerAvatar ?? entry.avatar}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>
                  {entry.playerName}
                  {isMe && <span style={{ fontWeight: 400, opacity: 0.6 }}> (You)</span>}
                </div>
              </div>

              {/* Score */}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {entry.totalScore}
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 11, opacity: 0.6 }}>
                  pts
                </span>
              </div>
              </div>

              {/* Round breakdown */}
              {hasRounds && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  padding: '8px 12px',
                  marginTop: 4,
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  {entry.roundScores!.map((score, ri) => (
                    <span key={ri} style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 10px',
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: 'var(--radius-pill)',
                      whiteSpace: 'nowrap',
                    }}>
                      R{ri + 1}: {score}{entry.roundDoublePoints?.[ri] ? ' ⭐' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {!isGameOver && isHost && (
          <button className="btn btn-primary" onClick={onNextRound}>
            Next Round ▶
          </button>
        )}
        {!isGameOver && !isHost && (
          <div style={{
            textAlign: 'center',
            padding: '14px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            opacity: 0.6,
          }}>
            Waiting for host to start next round...
          </div>
        )}
        {isGameOver && (
          <>
            {isHost && (
              <button className="btn btn-primary" onClick={onPlayAgain}>
                Play Again ▶
              </button>
            )}
            {!isHost && (
              <div style={{
                textAlign: 'center',
                padding: '14px',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                opacity: 0.6,
              }}>
                Waiting for host to restart...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
