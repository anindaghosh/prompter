'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';
import { onStdbConnected } from '@/lib/spacetimedb';
import { useProfile } from '@/hooks/useProfile';
import { ProfileModal } from '@/components/ProfileModal';
import BottomNav from '@/components/BottomNav';
import { AVATARS } from '@/hooks/useGameSocket';
import type { DbConnection } from '@/module_bindings';

function LogoDisplay() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="PromptOff" style={{ width: '100%', maxWidth: 320, height: 'auto', display: 'block' }} />
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
          <p className="po-mono" style={{ fontSize: 13, color: 'var(--black)', opacity: 0.55, maxWidth: 300, margin: '8px auto 32px', lineHeight: 1.5, letterSpacing: '0.02em' }}>
            &gt;_ race to recreate the image. every token you spend costs you.
          </p>
          <button className="btn btn-primary" onClick={() => auth.signinRedirect()}>
            Sign In <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 4 }}>▸</span>
          </button>
          {auth.error && (
            <p style={{ marginTop: 16, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--danger)' }}>
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

      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <button
          onClick={() => auth.signoutRedirect()}
          aria-label="Sign out"
          title="Sign out"
          style={{
            width: 36, height: 36, borderRadius: 'var(--r)',
            background: 'var(--white)', border: 'var(--bd)',
            boxShadow: 'var(--sh-xs)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15, padding: 0,
            color: 'var(--black)', fontFamily: 'var(--font-mono)',
            transition: 'transform 80ms ease, box-shadow 80ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = 'var(--sh-sm)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh-xs)'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh-xs)'; }}
        >
          ⏻
        </button>
      </div>

      {ready && !profile && <ProfileModal onCreate={createProfile} />}
      {showEditProfile && profile && (
        <ProfileModal
          onUpdate={async (name, avatarId) => { await updateProfile(name, avatarId); setShowEditProfile(false); }}
          onClose={() => setShowEditProfile(false)}
          initialName={profile.displayName}
          initialAvatarId={profile.avatarId}
        />
      )}

      <div className="page-content" style={{ paddingTop: 60, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 24 }} className="animate-slide-up">
          <LogoDisplay />
          <p className="po-mono" style={{ fontSize: 13, color: 'var(--black)', opacity: 0.55, maxWidth: 280, margin: '8px auto 0', lineHeight: 1.5, letterSpacing: '0.02em' }}>
            &gt;_ race to recreate the image. every token you spend costs you.
          </p>
        </div>

        {/* Profile widget */}
        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }} className="animate-slide-up stagger-1">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 'var(--r)',
                background: 'var(--paper-2)', border: 'var(--bd)',
                boxShadow: 'var(--sh)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
              }}>
                {AVATARS[profile.avatarId % AVATARS.length] ?? '🎨'}
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                aria-label="Edit profile"
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 26, height: 26, borderRadius: 'var(--r-sm)',
                  background: 'var(--white)', border: 'var(--bd)',
                  boxShadow: 'var(--sh-xs)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 13, padding: 0,
                  color: 'var(--black)',
                }}
              >
                ⚙
              </button>
            </div>
            <span style={{
              marginTop: 10, fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em',
              color: 'var(--black)',
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
            <div style={{ display: 'flex', background: 'var(--paper-2)', borderRadius: 'var(--r)', padding: 4, marginBottom: 20, border: 'var(--bd)' }} className="animate-slide-up stagger-2">
              <TabButton active={tab === 'create'} onClick={() => setTab('create')}>Create Room</TabButton>
              <TabButton active={tab === 'join'} onClick={() => setTab('join')}>Join Room</TabButton>
            </div>

            {tab === 'create' && (
              <div className="animate-slide-up" key="create">
                <div className="po-card" style={{ marginBottom: 16 }}>
                  <div className="po-kicker" style={{ marginBottom: 8 }}>Room Setup</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.7, lineHeight: 1.5 }}>A 6-character room code will be generated. Share it with friends to play together.</p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div className="po-kicker" style={{ marginBottom: 10 }}>Rounds</div>
                  <div style={{
                    display: 'flex', background: 'var(--paper-2)',
                    borderRadius: 'var(--r)', padding: 4, border: 'var(--bd)',
                  }}>
                    {([1, 3, 5] as const).map(n => (
                      <button
                        key={n}
                        onClick={() => setRoundCount(n)}
                        style={{
                          flex: 1, padding: '10px 0',
                          border: roundCount === n ? 'var(--bd)' : '2px solid transparent',
                          borderRadius: 'var(--r)',
                          background: roundCount === n ? 'var(--acid)' : 'transparent',
                          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16,
                          cursor: 'pointer',
                          boxShadow: roundCount === n ? 'var(--sh-xs)' : 'none',
                          transition: 'all 120ms ease',
                          color: roundCount === n ? 'var(--ink)' : 'var(--black)',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn btn-dark" onClick={handleCreateRoom} disabled={loading !== null} onKeyDown={handleKeyDown}>
                  {loading === 'create'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Creating...</span>
                    : <span>Create Room <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span></span>}
                </button>
              </div>
            )}

            {tab === 'join' && (
              <div className="animate-slide-up" key="join">
                <input className="po-input" type="text" placeholder="Enter room code (e.g. ABC123)"
                  value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown} maxLength={6}
                  style={{ marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', fontWeight: 700 }} />
                <button className="btn btn-dark" onClick={handleJoinRoom} disabled={loading !== null}>
                  {loading === 'join'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Joining...</span>
                    : <span>Join Room <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span></span>}
                </button>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--danger)', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--white)', boxShadow: 'var(--sh-xs)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, width: '100%' }}>
              <button className="btn btn-ghost" style={{ flex: 1, width: 'auto', minWidth: 0, fontSize: 13 }} onClick={() => router.push('/leaderboard')}>▦ Leaderboard</button>
              {connected && (
                <button className="btn btn-ghost" style={{ flex: 1, width: 'auto', minWidth: 0, fontSize: 13 }} onClick={() => router.push('/stats')}>◆ My Stats</button>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 28 }} className="animate-slide-up stagger-4">
          <div className="po-kicker" style={{ marginBottom: 12 }}>How to Play</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: '01', text: 'See a reference image you need to recreate' },
              { n: '02', text: 'Write an AI prompt within your token budget' },
              { n: '03', text: 'Submit — AI generates your image' },
              { n: '04', text: 'Score points for similarity, efficiency & speed' },
            ].map((step) => (
              <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--white)', border: 'var(--bd)', borderRadius: 'var(--r)', boxShadow: 'var(--sh-xs)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--acid)', background: 'var(--ink)', padding: '2px 6px', borderRadius: 'var(--r-xs)', flexShrink: 0 }}>{step.n}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--black)' }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
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
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 0',
      border: active ? 'var(--bd)' : '2px solid transparent',
      borderRadius: 'var(--r)',
      background: active ? 'var(--ink)' : 'transparent',
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
      cursor: 'pointer',
      boxShadow: active ? 'var(--sh-xs)' : 'none',
      transition: 'all 120ms ease',
      color: active ? 'var(--acid)' : 'var(--black)',
    }}>
      {children}
    </button>
  );
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}

function SparkleField() {
  const sparkles = [
    { top: '8%',  left: '6%',   size: 20, delay: 0 },
    { top: '15%', right: '8%',  size: 14, delay: 0.8 },
    { top: '35%', left: '3%',   size: 10, delay: 1.6 },
    { top: '28%', right: '5%',  size: 18, delay: 0.4 },
    { bottom: '25%', left: '8%',  size: 12, delay: 1.2 },
    { bottom: '35%', right: '4%', size: 16, delay: 2.0 },
  ];
  return (
    <>
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="po-spark"
          style={{
            position: 'fixed',
            ...(s.top    ? { top: s.top }       : {}),
            ...((s as Record<string, unknown>).bottom ? { bottom: (s as Record<string, unknown>).bottom as string } : {}),
            ...(s.left   ? { left: s.left }     : {}),
            ...((s as Record<string, unknown>).right ? { right: (s as Record<string, unknown>).right as string } : {}),
            fontSize: s.size,
            animationDelay: `${s.delay}s`,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          ✦
        </span>
      ))}
    </>
  );
}
