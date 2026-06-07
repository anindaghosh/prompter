'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';
import { onStdbConnected } from '@/lib/spacetimedb';
import { useProfile } from '@/hooks/useProfile';
import { ProfileModal } from '@/components/ProfileModal';
import { AVATARS } from '@/hooks/useGameSocket';
import type { DbConnection } from '@/module_bindings';

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
  const auth = useAuth();
  const { profile, loading: profileLoading, createProfile, updateProfile } = useProfile();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roundCount, setRoundCount] = useState<1 | 3 | 5>(3);
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const awaitingRoom = useRef(false);
  const connRef = useRef<InstanceType<typeof DbConnection> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const identityRef = useRef<any>(null);

  // Surface redirect errors from other pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'room-not-found') setError('Room not found — it may have expired or be on a different server.');
    if (err === 'game-in-progress') setError('That game is already in progress.');
  }, []);

  // Subscribe to my player row so we can detect room creation/join and redirect
  useEffect(() => {
    onStdbConnected((conn, identity) => {
      connRef.current = conn;
      const hex = identity.toHexString();
      identityRef.current = identity;

      setConnected(true);

      conn.subscriptionBuilder()
        .onApplied(() => {})
        .subscribe([`SELECT * FROM player WHERE identity = '${hex}'`]);

      const handlePlayerRoom = (player: { identity: { toHexString(): string }; roomCode: string }) => {
        if (player.identity.toHexString() !== hex) return;
        if (!awaitingRoom.current) return;
        awaitingRoom.current = false;
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        router.push(`/room/${player.roomCode}`);
      };

      conn.db.player.onInsert((_ctx, player) => handlePlayerRoom(player));
      conn.db.player.onUpdate((_ctx, _old, player) => handlePlayerRoom(player));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const failRoom = (msg: string) => {
    if (!awaitingRoom.current) return;
    awaitingRoom.current = false;
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setLoading(null);
    setError(msg);
  };

  const handleCreateRoom = async () => {
    setError(null);
    setLoading('create');
    try {
      const conn = connRef.current;
      if (!conn) throw new Error('Not connected');
      awaitingRoom.current = true;
      conn.reducers.createRoom({ totalRounds: roundCount })
        .catch((e: unknown) => failRoom(e instanceof Error ? e.message : 'Failed to create room'));
      timeoutRef.current = setTimeout(() => failRoom('Failed to create room — please try again'), 10_000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create room');
      awaitingRoom.current = false;
      setLoading(null);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { setError('Please enter a room code'); return; }
    setError(null);
    setLoading('join');
    try {
      const conn = connRef.current;
      if (!conn) throw new Error('Not connected');
      const code = joinCode.trim().toUpperCase();

      // Reconnect case: onConnect already set is_online=true server-side,
      // so joinRoom UPDATE triggers no onUpdate event. Detect via local cache.
      if (identityRef.current) {
        const myPlayer = conn.db.player.identity.find(identityRef.current);
        if (myPlayer && myPlayer.roomCode === code) {
          setLoading(null);
          router.push(`/room/${code}`);
          return;
        }
      }

      awaitingRoom.current = true;
      conn.reducers.joinRoom({ roomCode: code })
        .catch((e: unknown) => failRoom(e instanceof Error ? e.message : 'Failed to join room'));
      timeoutRef.current = setTimeout(() => failRoom('Failed to join room — check the code and try again'), 10_000);
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

  // ── Auth gating ──────────────────────────────────────────────────────────────
  if (auth.isLoading) {
    return <Splash text="Loading…" />;
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <SparkleField />
        <div className="page-content" style={{ paddingTop: 80, paddingBottom: 48, textAlign: 'center' }}>
          <LogoDisplay />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--black)', opacity: 0.6, maxWidth: 300, margin: '0 auto 32px', lineHeight: 1.5 }}>
            Race to recreate images using AI prompts. Sign in to create your profile and play.
          </p>
          <button className="btn btn-primary" onClick={() => auth.signinRedirect()}>
            Sign In ▶
          </button>
          {auth.error && (
            <p style={{ marginTop: 16, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--coral)' }}>
              {auth.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Authenticated: still connecting / loading profile
  const ready = !profileLoading;

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <SparkleField />

      <button
        onClick={() => auth.signoutRedirect()}
        aria-label="Sign out"
        title="Sign out"
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100,
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--white)', border: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 16, padding: 0,
          transition: 'background 120ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--track)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
      >
        ⏻
      </button>

      {ready && !profile && <ProfileModal onCreate={createProfile} />}
      {showEditProfile && profile && (
        <ProfileModal
          onUpdate={async (name, avatarId) => { await updateProfile(name, avatarId); setShowEditProfile(false); }}
          onClose={() => setShowEditProfile(false)}
          initialName={profile.displayName}
          initialAvatarId={profile.avatarId}
        />
      )}

      <div className="page-content" style={{ paddingTop: 60, paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 24 }} className="animate-slide-up">
          <LogoDisplay />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--black)', opacity: 0.6, maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
            Race to recreate images using AI prompts. Every token counts.
          </p>
        </div>

        {/* Profile widget */}
        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }} className="animate-slide-up stagger-1">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'var(--white)', border: 'var(--border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 38,
              }}>
                {AVATARS[profile.avatarId % AVATARS.length] ?? '🎨'}
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                aria-label="Edit profile"
                style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--white)', border: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 13, padding: 0,
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--track)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
              >
                ⚙️
              </button>
            </div>
            <span style={{
              marginTop: 10, fontFamily: 'var(--font-body)',
              fontWeight: 700, fontSize: 15,
            }}>
              {profile.displayName}
            </span>
          </div>
        )}

        {ready && !profile ? null : !ready ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-body)', opacity: 0.6 }}>Loading profile…</div>
        ) : (
          <>
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
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block', fontFamily: 'var(--font-body)', fontWeight: 700,
                    fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    Rounds
                  </label>
                  <div style={{
                    display: 'flex', background: 'var(--track)',
                    borderRadius: 'var(--radius-pill)', padding: 4, border: 'var(--border)',
                  }}>
                    {([1, 3, 5] as const).map(n => (
                      <button
                        key={n}
                        onClick={() => setRoundCount(n)}
                        style={{
                          flex: 1, padding: '10px 0',
                          border: roundCount === n ? 'var(--border)' : '2px solid transparent',
                          borderRadius: 'var(--radius-pill)',
                          background: roundCount === n ? 'var(--white)' : 'transparent',
                          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                          cursor: 'pointer',
                          boxShadow: roundCount === n ? 'var(--shadow-sm)' : 'none',
                          transition: 'all 120ms ease', color: 'var(--black)',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleCreateRoom} disabled={loading !== null} onKeyDown={handleKeyDown}>
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

            <div style={{ display: 'flex', gap: 10, marginTop: 24, width: '100%' }}>
              <button className="btn btn-ghost" style={{ flex: 1, width: 'auto', minWidth: 0 }} onClick={() => router.push('/leaderboard')}>🏆 Global Leaderboard</button>
              {connected && (
                <button className="btn btn-ghost" style={{ flex: 1, width: 'auto', minWidth: 0 }} onClick={() => router.push('/stats')}>📊 My Stats</button>
              )}
            </div>
          </>
        )}

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

function Splash({ text }: { text: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, opacity: 0.7 }}>{text}</p>
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
