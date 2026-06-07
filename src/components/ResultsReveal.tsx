'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayerResult, ReferenceImage, avatarUrl } from '@/hooks/useGameSocket';

interface ResultsRevealProps {
  results: PlayerResult[];
  referenceImage: ReferenceImage | null;
  myPlayerId: string | null;
}

export default function ResultsReveal({ results, referenceImage, myPlayerId }: ResultsRevealProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { setActiveIndex(0); }, [results]);

  const active = results[activeIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--black)' }}>
          Round Results
        </h2>
        <span className="po-chip">{activeIndex + 1} / {results.length}</span>
      </div>

      {/* Avatar nav */}
      <AvatarNav results={results} activeIndex={activeIndex} onSelect={setActiveIndex} />

      {/* Active card */}
      {active && (
        <div key={active.playerId} style={{ animation: 'slide-in-card 350ms cubic-bezier(0.34,1.56,0.64,1)', marginTop: 16 }}>
          <PlayerResultCard
            result={active}
            referenceImage={referenceImage}
            isMe={active.playerId === myPlayerId}
          />
        </div>
      )}
    </div>
  );
}

function AvatarNav({ results, activeIndex, onSelect }: {
  results: PlayerResult[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
      {results.map((r, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={r.playerId}
            onClick={() => onSelect(i)}
            title={r.playerName}
            className="po-avatar"
            style={{
              width: 42,
              height: 42,
              cursor: 'pointer',
              background: active ? 'var(--acid)' : 'var(--paper-2)',
              opacity: active ? 1 : 0.5,
              boxShadow: active ? 'var(--sh)' : 'none',
              border: active ? 'var(--bd)' : 'var(--bd1)',
              transform: active ? 'translate(-1px,-1px)' : 'none',
              transition: 'all 150ms ease',
              padding: 0,
            }}
          >
            {r.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl(r.avatar)} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
              : r.playerName.slice(0, 2).toUpperCase()
            }
          </button>
        );
      })}
    </div>
  );
}

function PlayerResultCard({
  result,
  referenceImage,
  isMe,
}: {
  result: PlayerResult;
  referenceImage: ReferenceImage | null;
  isMe: boolean;
}) {
  const isWinner = result.rank === 1;
  const cardTextColor = isMe ? 'var(--ink)' : isWinner ? 'var(--paper)' : 'var(--black)';
  const cardClass = isMe ? 'po-card card-acid' : isWinner ? 'po-panel' : 'po-card';

  return (
    <div
      className={cardClass}
      style={{ position: 'relative', overflow: 'visible' }}
    >
      {/* Winner badge */}
      {isWinner && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: 14,
        }}>
          <span className="po-chip po-chip--acid">★ Winner</span>
        </div>
      )}

      {/* Player header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="po-avatar" style={{
          background: isMe ? 'var(--ink)' : isWinner ? 'rgba(255,255,255,0.1)' : 'var(--paper-2)',
          width: 38, height: 38,
        }}>
          {result.avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarUrl(result.avatar)} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            : result.playerName.slice(0, 2).toUpperCase()
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: cardTextColor }}>
            {result.playerName} {isMe && <span style={{ opacity: 0.6, fontWeight: 400 }}>(You)</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.55, marginTop: 1, color: cardTextColor }}>
            {result.tokensUsed} tok used
          </div>
        </div>
        <AnimatedScore value={result.roundScore ?? result.totalScore ?? 0} color={cardTextColor} />
      </div>

      {/* Score breakdown */}
      {result.simScore !== undefined && (
        <ScoreStrip
          simScore={result.simScore}
          effScore={result.effScore}
          speedScore={result.speedScore}
          hadDoublePoints={result.hadDoublePoints}
          onDark={isWinner && !isMe}
          onAcid={isMe}
        />
      )}

      {/* Image comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <ImageCard label="Target" src={referenceImage?.url} onDark={isWinner} />
        <ImageCard label="Your AI" src={result.imageData || undefined} placeholder={!result.imageData} onDark={isWinner} />
      </div>

      {/* Similarity score */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: isMe ? 'rgba(14,14,8,0.12)' : isWinner ? 'rgba(255,255,255,0.06)' : 'var(--paper-2)',
        border: 'var(--bd)',
        borderRadius: 'var(--r)',
        marginBottom: 10,
      }}>
        <span className="po-kicker" style={{ opacity: 1 }}>Similarity</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 16,
          letterSpacing: '-0.02em',
          background: result.similarityScore >= 70 ? 'var(--acid)' : result.similarityScore >= 40 ? 'var(--warn)' : 'var(--danger)',
          color: 'var(--ink)',
          padding: '2px 8px',
          borderRadius: 4,
        }}>
          {result.similarityScore}%
        </span>
      </div>

      {/* Prompt used */}
      <div className="po-terminal" style={{ borderRadius: 'var(--r-sm)' }}>
        <div className="po-kicker" style={{ color: 'var(--acid)', opacity: 1, marginBottom: 6 }}>
          {isMe ? 'your prompt' : `${result.playerName}'s prompt`}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.55, color: 'var(--paper)' }}>
          &ldquo;{result.prompt}&rdquo;
        </div>
      </div>

      {/* Game tip */}
      {result.reasoning && !['Scoring failed', 'Did not submit'].includes(result.reasoning) && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: isMe ? 'rgba(14,14,8,0.1)' : isWinner ? 'rgba(255,255,255,0.05)' : 'var(--paper-2)',
          borderRadius: 'var(--r)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: 1.45,
          color: cardTextColor,
        }}>
          💡 {result.reasoning}
        </div>
      )}
    </div>
  );
}

function ScoreStrip({ simScore, effScore, speedScore, hadDoublePoints, onDark, onAcid }: {
  simScore?: number; effScore?: number; speedScore?: number; hadDoublePoints?: boolean; onDark?: boolean; onAcid?: boolean;
}) {
  const cells = [
    { label: 'Match',      value: simScore,   max: 60 },
    { label: 'Efficiency', value: effScore,   max: 25 },
    { label: 'Speed',      value: speedScore, max: 15 },
  ];

  const stripBg = onAcid
    ? 'rgba(14,14,8,0.18)'
    : onDark
      ? 'rgba(255,255,255,0.08)'
      : 'var(--paper-2)';

  const labelColor = onAcid ? 'var(--ink)' : onDark ? 'var(--acid)' : 'var(--ink)';
  const labelOpacity = onAcid ? 0.6 : onDark ? 0.9 : 0.55;
  const valueColor = onAcid ? 'var(--ink)' : onDark ? 'var(--paper)' : 'var(--black)';
  const denomColor = onAcid ? 'rgba(14,14,8,0.45)' : onDark ? 'rgba(240,239,232,0.45)' : 'rgba(14,14,8,0.4)';

  return (
    <div style={{
      background: stripBg,
      border: onAcid ? '1.5px solid rgba(14,14,8,0.25)' : 'var(--bd1)',
      borderRadius: 'var(--r)',
      padding: '12px 8px',
      marginBottom: 14,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {cells.map(cell => (
          <div key={cell.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span className="po-kicker" style={{ color: labelColor, opacity: labelOpacity }}>
              {cell.label}
            </span>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, lineHeight: 1,
              color: valueColor,
            }}>
              {cell.value ?? '—'}
              <span style={{ fontSize: 13, color: denomColor }}> / {cell.max}</span>
            </div>
          </div>
        ))}
      </div>
      {hadDoublePoints && (
        <div style={{ textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: onAcid ? 'var(--ink)' : 'var(--acid)' }}>
          ⭐ 2× was applied
        </div>
      )}
    </div>
  );
}

function ImageCard({ label, src, placeholder, onDark }: { label: string; src?: string; placeholder?: boolean; onDark?: boolean }) {
  return (
    <div style={{
      border: 'var(--bd)',
      borderRadius: 'var(--r)',
      overflow: 'hidden',
      boxShadow: 'var(--sh-xs)',
    }}>
      <div style={{
        padding: '4px 8px',
        background: 'var(--ink)',
        color: 'var(--acid)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        {label}
      </div>
      {src && !placeholder ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: onDark ? 'rgba(255,255,255,0.04)' : 'var(--paper-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          opacity: 0.4,
          flexDirection: 'column',
          gap: 4,
          color: onDark ? 'var(--paper)' : 'var(--black)',
        }}>
          <span>No image</span>
        </div>
      )}
    </div>
  );
}

function AnimatedScore({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(easeOutExpo(t) * value));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return (
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, lineHeight: 1, textAlign: 'right', color }}>
      {display}
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, opacity: 0.5, textAlign: 'center' }}>pts</div>
    </div>
  );
}
