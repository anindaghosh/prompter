'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayerResult, ReferenceImage } from '@/hooks/useGameSocket';

interface ResultsRevealProps {
  results: PlayerResult[];
  referenceImage: ReferenceImage | null;
  myPlayerId: string | null;
}

export default function ResultsReveal({ results, referenceImage, myPlayerId }: ResultsRevealProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset to first card when results change (new round)
  useEffect(() => { setActiveIndex(0); }, [results]);

  const active = results[activeIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
          Round Results
        </h2>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.45 }}>
          {activeIndex + 1} / {results.length}
        </span>
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
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 0, flexWrap: 'wrap' }}>
      {results.map((r, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={r.playerId}
            onClick={() => onSelect(i)}
            title={r.playerName}
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-pill)',
              border: active ? '2.5px solid var(--black)' : '2px solid transparent',
              background: 'var(--white)',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: active ? 1 : 0.45,
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: 'opacity 150ms, border-color 150ms, box-shadow 150ms',
              padding: 0,
            }}
          >
            {r.playerAvatar ?? r.avatar}
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

  return (
    <div
      className="card"
      style={{
        background: isMe ? 'var(--lavender)' : isWinner ? 'var(--gold)' : 'var(--white)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Rank + winner badge */}
      {isWinner && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: 16,
          background: 'var(--teal)',
          color: 'var(--white)',
          border: 'var(--border)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 12px',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 12,
          boxShadow: 'var(--shadow-sm)',
        }}>
          🏆 Winner
        </div>
      )}

      {/* Player header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-pill)',
          border: 'var(--border)',
          background: 'var(--white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
          boxShadow: 'var(--shadow-sm)',
        }}>
          {result.playerAvatar ?? result.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15 }}>
            {result.playerName} {isMe && <span style={{ opacity: 0.6, fontWeight: 400 }}>(You)</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.6, marginTop: 1 }}>
            {result.tokensUsed} tokens used
          </div>
        </div>
        <AnimatedScore value={result.roundScore ?? result.totalScore ?? 0} />
      </div>

      {/* Score breakdown strip */}
      {result.simScore !== undefined && (
        <ScoreStrip
          simScore={result.simScore}
          effScore={result.effScore}
          speedScore={result.speedScore}
          hadDoublePoints={result.hadDoublePoints}
        />
      )}

      {/* Image comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <ImageCard label="Target" src={referenceImage?.url} />
        <ImageCard label="Your AI" src={result.imageData || undefined} placeholder={!result.imageData} />
      </div>

      {/* Similarity score */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.6)',
        border: 'var(--border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 10,
      }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12 }}>
          Similarity
        </span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 18,
          color: result.similarityScore >= 70 ? 'var(--teal)' : result.similarityScore >= 40 ? 'var(--orange)' : 'var(--coral)',
        }}>
          {result.similarityScore}%
        </span>
      </div>


      {/* Prompt used */}
      <div style={{
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.5)',
        border: '1.5px dashed var(--black)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, opacity: 0.6, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isMe ? 'Your prompt' : `${result.playerName}'s prompt`}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5 }}>
          &ldquo;{result.prompt}&rdquo;
        </div>
      </div>

      {/* Game tip */}
      {result.reasoning && !['Scoring failed', 'Did not submit'].includes(result.reasoning) && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.5)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.4,
        }}>
          💡 {result.reasoning}
        </div>
      )}
    </div>
  );
}

function ScoreStrip({ simScore, effScore, speedScore, hadDoublePoints }: {
  simScore?: number; effScore?: number; speedScore?: number; hadDoublePoints?: boolean;
}) {
  const cells = [
    { emoji: '🎯', label: 'Similarity', value: simScore, max: 60 },
    { emoji: '✂️', label: 'Efficiency', value: effScore, max: 25 },
    { emoji: '⚡', label: 'Speed',      value: speedScore, max: 15 },
  ];
  return (
    <div style={{
      background: 'rgba(0,0,0,0.07)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 8px',
      marginBottom: 14,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {cells.map(cell => (
          <div key={cell.label} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}>
            <span style={{ fontSize: 16 }}>{cell.emoji}</span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              fontWeight: 600,
              opacity: 0.55,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {cell.label}
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, lineHeight: 1 }}>
              {cell.value ?? '—'}
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, opacity: 0.55 }}>
                {' '}/ {cell.max}
              </span>
            </div>
          </div>
        ))}
      </div>
      {hadDoublePoints && (
        <div style={{
          textAlign: 'center',
          marginTop: 10,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 700,
          color: '#b8860b',
        }}>
          ⭐ 2× was applied
        </div>
      )}
    </div>
  );
}

function ImageCard({ label, src, placeholder }: { label: string; src?: string; placeholder?: boolean }) {
  return (
    <div style={{
      border: 'var(--border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      background: 'var(--track)',
    }}>
      <div style={{
        padding: '4px 8px',
        background: 'var(--black)',
        color: 'var(--white)',
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
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
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          opacity: 0.4,
          flexDirection: 'column',
          gap: 4,
        }}>
          <span style={{ fontSize: 24 }}>🖼️</span>
          <span>No image</span>
        </div>
      )}
    </div>
  );
}

function AnimatedScore({ value }: { value: number }) {
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
    <div style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 28,
      lineHeight: 1,
      textAlign: 'right',
    }}>
      {display}
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 11, opacity: 0.5, textAlign: 'center' }}>
        pts
      </div>
    </div>
  );
}
