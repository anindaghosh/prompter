'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getStdbConnection, onStdbConnected } from '@/lib/spacetimedb';
import type { DbConnection } from '@/module_bindings';

const AVATARS = ['🦸', '🧙', '🤖', '👾', '🦊', '🐉', '🦅', '🐺', '🦁', '🐯'];
const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || '/logo.svg';

function LogoDisplay() {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <>
        <div style={{ fontSize: 56, marginBottom: 8, lineHeight: 1 }}>🎨</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: 'clamp(32px, 8vw, 44px)', letterSpacing: '-0.03em',
          color: 'var(--black)', lineHeight: 1.05, marginBottom: 12,
        }}>Promptinary</h1>
      </>
    );
  }
  return (
    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
      <Image src={LOGO_URL} alt="Logo" width={560} height={168}
        style={{ objectFit: 'contain', maxHeight: 168 }}
        onError={() => setImgError(true)} unoptimized />
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const awaitingRoom = useRef(false);
  const connRef = useRef<InstanceType<typeof DbConnection> | null>(null);

  // Restore saved name
  useEffect(() => {
    const saved = localStorage.getItem('promptinary_name');
    if (saved) setPlayerName(saved);
  }, []);

  // Connect to SpacetimeDB and subscribe to my player row
  useEffect(() => {
    const conn = getStdbConnection();
    connRef.current = conn;

    onStdbConnected((conn, identity) => {
      const hex = identity.toHexString();

      // Subscribe to my player row so we can detect room creation/join
      conn.subscriptionBuilder()
        .onApplied(() => {
          // If already in a room from previous session, don't auto-redirect
        })
        .subscribe([`SELECT * FROM player WHERE identity = '${hex}'`]);

      conn.db.player.onInsert((_ctx, player) => {
        if (player.identity.toHexString() !== hex) return;
        if (!awaitingRoom.current) return;
        awaitingRoom.current = false;
        router.push(`/room/${player.roomCode}`);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('promptinary_name', name);
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) { setError('Please enter your name first'); return; }
    setError(null);
    setLoading('create');
    try {
      const conn = connRef.current;
      if (!conn) throw new Error('Not connected');
      awaitingRoom.current = true;
      conn.reducers.createRoom({ playerName: playerName.trim() });
      // Navigation happens in player.onInsert callback
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create room');
      awaitingRoom.current = false;
      setLoading(null);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) { setError('Please enter your name first'); return; }
    if (!joinCode.trim()) { setError('Please enter a room code'); return; }
    setError(null);
    setLoading('join');
    try {
      const conn = connRef.current;
      if (!conn) throw new Error('Not connected');

      const code = joinCode.trim().toUpperCase();

      // Listen for player row appearing (means join succeeded)
      awaitingRoom.current = true;

      conn.reducers.joinRoom({ roomCode: code, playerName: playerName.trim() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join room');
      awaitingRoom.current = false;
      setLoading(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (tab === 'create') handleCreateRoom();
      else handleJoinRoom();
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <SparkleField />
      <div className="page-content" style={{ paddingTop: 60, paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="animate-slide-up">
          <LogoDisplay />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--black)', opacity: 0.6, maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
            Race to recreate images using AI prompts. Every token counts.
          </p>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 24 }} className="animate-slide-up stagger-1">
          <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your Name
          </label>
          <input className="input" type="text" placeholder="Enter your display name..."
            value={playerName} onChange={e => saveName(e.target.value)}
            onKeyDown={handleKeyDown} maxLength={20} autoFocus />
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--track)', borderRadius: 'var(--radius-pill)', padding: 4, marginBottom: 20, border: 'var(--border)' }} className="animate-slide-up stagger-2">
          <TabButton active={tab === 'create'} onClick={() => setTab('create')}>Create Room</TabButton>
          <TabButton active={tab === 'join'} onClick={() => setTab('join')}>Join Room</TabButton>
        </div>

        {tab === 'create' && (
          <div className="animate-slide-up" key="create">
            <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.7, marginBottom: 8 }}>A 6-character room code will be generated.</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.7 }}>Share it with friends to play together!</p>
            </div>
            <button className="btn btn-primary" onClick={handleCreateRoom} disabled={loading !== null}>
              {loading === 'create' ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Creating...</span> : <>Create Room ▶</>}
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="animate-slide-up" key="join">
            <input className="input" type="text" placeholder="Enter room code (e.g. ABC123)"
              value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown} maxLength={6}
              style={{ marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }} />
            <button className="btn btn-primary" onClick={handleJoinRoom} disabled={loading !== null}>
              {loading === 'join' ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Joining...</span> : <>Join Room ▶</>}
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--coral)', border: 'var(--border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/leaderboard')}>🏆 Global Leaderboard</button>
        </div>

        <div style={{ marginTop: 28 }} className="animate-slide-up stagger-4">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16, letterSpacing: '-0.01em' }}>How to Play</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '👁️', text: 'See a reference image you need to recreate' },
              { icon: '✍️', text: 'Write an AI prompt within your token budget' },
              { icon: '⚡', text: 'Submit — an AI generates your image' },
              { icon: '🏆', text: 'Score points for similarity, efficiency & speed' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--white)', border: 'var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: 20 }}>{step.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '10px 0', border: active ? 'var(--border)' : '2px solid transparent', borderRadius: 'var(--radius-pill)', background: active ? 'var(--white)' : 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: active ? 'var(--shadow-sm)' : 'none', transition: 'all 120ms ease', color: 'var(--black)' }}>
      {children}
    </button>
  );
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}

function SparkleField() {
  const sparkles = [
    { top: '8%', left: '6%', size: 20, delay: 0 },
    { top: '15%', right: '8%', size: 14, delay: 0.7 },
    { top: '35%', left: '3%', size: 10, delay: 1.3 },
    { top: '28%', right: '5%', size: 18, delay: 0.4 },
    { bottom: '25%', left: '8%', size: 12, delay: 0.9 },
    { bottom: '35%', right: '4%', size: 16, delay: 1.6 },
  ];
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sparkle-float {
          0%, 100% { opacity: 0.5; transform: scale(0.9) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.15) rotate(15deg); }
        }
      `}</style>
      {sparkles.map((s, i) => (
        <span key={i} style={{ position: 'fixed', ...(s.top ? { top: s.top } : {}), ...(s as any).bottom ? { bottom: (s as any).bottom } : {}, ...(s.left ? { left: s.left } : {}), ...((s as any).right ? { right: (s as any).right } : {}), fontSize: s.size, color: 'var(--gold)', animation: `sparkle-float 2.5s ease-in-out ${s.delay}s infinite`, userSelect: 'none', pointerEvents: 'none' }}>✦</span>
      ))}
    </>
  );
}
