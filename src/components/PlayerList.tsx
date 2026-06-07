'use client';

import { Player, avatarUrl } from '@/hooks/useGameSocket';

interface PlayerListProps {
  players: Player[];
  myPlayerId: string | null;
  onToggleReady: (isReady: boolean) => void;
  canStart: boolean;
  onStartGame: () => void;
  isHost: boolean;
}

export default function PlayerList({
  players,
  myPlayerId,
  onToggleReady,
  canStart,
  onStartGame,
  isHost,
}: PlayerListProps) {
  const me = players.find(p => p.id === myPlayerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {players.map((player, i) => {
        const isMe = player.id === myPlayerId;
        return (
          <div
            key={player.id}
            className={`po-row${isMe ? ' you' : ''} animate-slide-up`}
            style={{ animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
          >
            {/* Avatar */}
            <div className="po-avatar" style={{ background: 'var(--paper-2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(player.avatar)} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>

            {/* Name + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isMe ? 'var(--ink)' : 'var(--black)',
                }}>
                  {player.name}
                </span>
                {isMe && (
                  <span className="po-chip po-chip--ink" style={{ fontSize: 10 }}>You</span>
                )}
                {player.isHost && (
                  <span className="po-chip" style={{ fontSize: 10 }}>Host</span>
                )}
              </div>
            </div>

            {/* Ready status */}
            <div>
              {isMe ? (
                <button
                  className={`btn btn-sm btn-auto ${me?.isReady ? 'btn-dark' : 'btn-ghost'}`}
                  onClick={() => onToggleReady(!me?.isReady)}
                  style={{ fontSize: 12 }}
                >
                  {me?.isReady ? '✓ Ready' : 'Ready Up'}
                </button>
              ) : (
                <span className={`po-chip ${player.isReady ? 'po-chip--acid' : ''}`}>
                  {player.isReady ? '✓ Ready' : 'Waiting'}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Waiting for more players */}
      {players.length < 2 && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          opacity: 0.5,
          color: 'var(--black)',
          border: '1.5px dashed var(--black)',
          borderRadius: 'var(--r)',
          marginTop: 4,
        }}>
          waiting for more players to join...
        </div>
      )}

      {/* Start game button (host only) */}
      {isHost && (
        <button
          className="btn btn-dark"
          onClick={onStartGame}
          disabled={!canStart}
          style={{ marginTop: 8 }}
        >
          {!canStart
            ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Waiting ({players.filter(p => p.isReady).length}/{players.length} ready)</span>
            : <span>Start Game <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span></span>
          }
        </button>
      )}
    </div>
  );
}
