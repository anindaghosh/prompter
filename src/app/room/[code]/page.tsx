'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';
import { onStdbConnected } from '@/lib/spacetimedb';
import { useProfile } from '@/hooks/useProfile';
import CountdownTimer from '@/components/CountdownTimer';
import PlayerList from '@/components/PlayerList';
import PromptEditor from '@/components/PromptEditor';
import ResultsReveal from '@/components/ResultsReveal';
import Leaderboard from '@/components/Leaderboard';
import type { DbConnection } from '@/module_bindings';
import {
  DEFAULT_GAME_STATE,
  GameState,
  Player,
  ReferenceImage,
  PlayerResult,
  LeaderboardEntry,
  GamePhase,
  PowerupId,
  POWERUP_DEFS,
  AVATARS,
  avatarUrl,
} from '@/hooks/useGameSocket';


const REFERENCE_IMAGES = [
  { id: 'img-001', filename: 'starry-night.jpg',    category: 'Fine Art',     difficulty: 'Hard',   title: 'Dutch Floral Still Life' },
  { id: 'img-002', filename: 'mountain-lake.jpg',   category: 'Photography',  difficulty: 'Medium', title: 'Peaks Above the Clouds' },
  { id: 'img-003', filename: 'neon-city.jpg',        category: 'Photography',  difficulty: 'Easy',   title: 'Manhattan Sunset Canyon' },
  { id: 'img-004', filename: 'cherry-blossom.jpg',  category: 'Nature',       difficulty: 'Easy',   title: 'Cherry Blossoms' },
  { id: 'img-005', filename: 'lighthouse.jpg',       category: 'Photography',  difficulty: 'Hard',   title: 'Aurora Over Arctic Lake' },
  { id: 'img-006', filename: 'hot-air-balloon.png', category: 'Photography',  difficulty: 'Medium', title: 'Balloon Reflection' },
  { id: 'img-007', filename: 'underwater.jpg',       category: 'Nature',       difficulty: 'Medium', title: 'Coral Garden' },
  { id: 'img-008', filename: 'desert-dunes.jpg',    category: 'Photography',  difficulty: 'Medium', title: 'Monument Valley' },
  { id: 'img-009', filename: 'space-nebula.jpg',    category: 'Photography',  difficulty: 'Hard',   title: 'City Lights from Space' },
  { id: 'img-010', filename: 'autumn-forest.jpg',   category: 'Photography',  difficulty: 'Easy',   title: 'Studio Portrait' },
  { id: 'img-011', filename: 'tokyo-street.jpg',    category: 'Photography',  difficulty: 'Hard',   title: 'Neon City Street' },
  { id: 'img-012', filename: 'abstract-waves.png',  category: 'Concept Art',  difficulty: 'Hard',   title: 'Abstract Waves' },
  { id: 'img-013', filename: 'castle-ruins.jpg',    category: 'Nature',       difficulty: 'Easy',   title: 'Mountain Valley' },
  { id: 'img-014', filename: 'arctic-fox.jpg',       category: 'Nature',       difficulty: 'Easy',   title: 'Red Fox Portrait' },
  { id: 'img-015', filename: 'art-deco.jpg',        category: 'Photography',  difficulty: 'Medium', title: 'Industrial Cafe Interior' },
  { id: 'img-017', filename: 'steampunk.jpg',        category: 'Photography',  difficulty: 'Medium', title: 'Circuit Board Macro' },
  { id: 'img-018', filename: 'greek-island.jpg',    category: 'Photography',  difficulty: 'Easy',   title: 'Santorini Steps' },
  { id: 'img-019', filename: 'cubist-portrait.jpg', category: 'Concept Art',  difficulty: 'Medium', title: 'Street Art Portrait' },
  { id: 'img-020', filename: 'waterfall.jpg',        category: 'Nature',       difficulty: 'Easy',   title: 'Forest Waterfall' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface LocalState extends GameState { roomCode: string }

const INITIAL: GameState = {
  ...DEFAULT_GAME_STATE,
  phase: 'lobby' as GamePhase,
};

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const code = (params?.code as string ?? '').toUpperCase();

  // Auth gate: a profile is required to enter a room. Send unauthenticated players
  // (or authenticated players without a profile) back to the landing page.
  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated) { router.replace('/'); return; }
    if (!profileLoading && !profile) router.replace('/');
  }, [auth.isLoading, auth.isAuthenticated, profileLoading, profile, router]);

  const connRef = useRef<InstanceType<typeof DbConnection> | null>(null);
  const myHexRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSubmittedScoreRef = useRef(false);

  const [gs, setGs] = useState<GameState>(INITIAL);
  const [tips, setTips] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const generatedImageRef = useRef<string | null>(null); // stable ref for scoring
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [powerupTarget, setPowerupTarget] = useState<string | null>(null);

  const update = useCallback((patch: Partial<GameState>) => {
    setGs(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Rebuild state from DB cache ─────────────────────────────────────────────

  const rebuildFromDB = useCallback(() => {
    const conn = connRef.current;
    const myHex = myHexRef.current;
    if (!conn || !myHex) return;

    const room = conn.db.room.code.find(code);
    if (!room) return;

    const allPlayers = [...conn.db.player.by_room.filter(code)];
    const players: Player[] = allPlayers.map(pl => ({
      id: pl.identity.toHexString(),
      name: pl.name,
      isReady: pl.isReady,
      isHost: pl.isHost,
      avatar: AVATARS[pl.avatarIndex % AVATARS.length] ?? AVATARS[0],
    }));

    const currentRound = room.currentRound;

    const subs = currentRound > 0
      ? [...conn.db.submission.by_room_round.filter([code, currentRound])]
      : [];

    const submittedThisRound = subs.some(s => s.identity.toHexString() === myHex);
    const activePlayers = allPlayers.filter(p => p.isOnline);
    const waitingForPlayers = Math.max(0, activePlayers.length - subs.length);

    const resultsRows = currentRound > 0
      ? [...conn.db.roundResult.by_room_round.filter([code, currentRound])]
          .sort((a, b) => a.placement - b.placement)
      : [];

    const results: PlayerResult[] = resultsRows.map(r => ({
      playerId: r.identity.toHexString(),
      playerName: r.playerName,
      playerAvatar: AVATARS[r.avatarIndex % AVATARS.length],
      avatar: AVATARS[r.avatarIndex % AVATARS.length],
      prompt: r.prompt,
      imageData: r.imageData || null,
      tokensUsed: r.tokensUsed,
      similarityScore: r.similarityScore,
      roundScore: r.roundScore,
      reasoning: r.reasoning,
      rank: r.placement,
      scoreBreakdown: r.scoreBreakdown ? (() => { try { return JSON.parse(r.scoreBreakdown); } catch { return undefined; } })() : undefined,
      hadDoublePoints: r.hadDoublePoints,
      simScore: r.simScore,
      effScore: r.effScore,
      speedScore: r.speedScore,
    }));

    const allRoundResults = [...conn.db.roundResult.by_room.filter(code)];

    const leaderboard: LeaderboardEntry[] = allPlayers
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((pl, i) => {
        const playerHex = pl.identity.toHexString();
        const playerRoundResults = allRoundResults
          .filter(r => r.identity.toHexString() === playerHex)
          .sort((a, b) => a.round - b.round);
        return {
          playerId: playerHex,
          playerName: pl.name,
          playerAvatar: AVATARS[pl.avatarIndex % AVATARS.length],
          avatar: AVATARS[pl.avatarIndex % AVATARS.length],
          totalScore: pl.totalScore,
          rank: i + 1,
          roundScores: playerRoundResults.map(r => r.roundScore),
          roundDoublePoints: playerRoundResults.map(r => r.hadDoublePoints),
        };
      });

    // Reference image
    const imgMeta = REFERENCE_IMAGES.find(i => i.id === room.currentImageId);
    const referenceImage: ReferenceImage | null = imgMeta ? {
      id: imgMeta.id,
      url: `/reference-images/${imgMeta.filename}`,
      category: imgMeta.category,
      difficulty: imgMeta.difficulty,
      title: imgMeta.title,
    } : null;

    // My powerup state
    const myPp = [...conn.db.playerPowerup.by_room.filter(code)]
      .find(pp => pp.identity.toHexString() === myHex);

    const frozenUntilMs = myPp ? Number(myPp.frozenUntilMs) : 0;
    const isFrozen = (myPp?.isFrozen ?? false) && Date.now() < frozenUntilMs;
    const frozenSecondsLeft = isFrozen ? Math.max(0, Math.ceil((frozenUntilMs - Date.now()) / 1000)) : 0;

    setGs(prev => ({
      ...prev,
      phase: room.phase as GamePhase,
      roomCode: code,
      myPlayerId: myHex,
      players,
      currentRound,
      totalRounds: room.totalRounds,
      referenceImage,
      tokenBudget: room.tokenBudget,
      roundDurationMs: Number(room.roundDurationUs / 1000n),
      countdownValue: room.countdownValue,
      submittedThisRound,
      waitingForPlayers,
      results,
      leaderboard,
      isConnected: true,
      myPowerup: (myPp?.powerupId || null) as PowerupId | null,
      powerupUsed: myPp?.isUsed ?? false,
      hasShield: myPp?.hasShield ?? false,
      hasDoublePoints: myPp?.hasDoublePoints ?? false,
      tokenDrainAmount: myPp?.tokenDrainAmount ?? 0,
      hintKeywords: JSON.parse(myPp?.hintKeywords ?? '[]') as string[],
      revealedCategory: myPp?.revealedCategory || null,
      isFrozen,
      frozenSecondsLeft,
    }));
  }, [code]);

  // ── SpacetimeDB setup ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!code) return;

    onStdbConnected((conn, identity) => {
      connRef.current = conn;
      myHexRef.current = identity.toHexString();

      // Subscribe to all game tables for this room
      conn.subscriptionBuilder()
        .onApplied(() => {
          update({ isConnected: true });

          const room = conn.db.room.code.find(code);
          if (!room) {
            router.replace('/?error=room-not-found');
            return;
          }

          const myHex = myHexRef.current;
          const alreadyInRoom = myHex
            ? [...conn.db.player.by_room.filter(code)].some(p => p.identity.toHexString() === myHex)
            : false;

          if (!alreadyInRoom) {
            if (room.phase !== 'lobby') {
              router.replace('/?error=game-in-progress');
              return;
            }
            conn.reducers.joinRoom({ roomCode: code })
              .catch(() => router.replace('/?error=room-not-found'));
          }

          rebuildFromDB();
          setTips(
            [...conn.db.gameTip.iter()]
              .sort((a, b) => a.id - b.id)
              .map(r => r.text)
          );
        })
        .subscribe([
          `SELECT * FROM room WHERE code = '${code}'`,
          `SELECT * FROM player WHERE room_code = '${code}'`,
          `SELECT * FROM submission WHERE room_code = '${code}'`,
          `SELECT * FROM round_result WHERE room_code = '${code}'`,
          `SELECT * FROM player_powerup WHERE room_code = '${code}'`,
          `SELECT * FROM game_tip`,
        ]);

      // Table change listeners → rebuild full state
      conn.db.room.onUpdate((_ctx, _old, newRoom) => {
        if (newRoom.code !== code) return;
        // Reset score submission flag on new round
        if (newRoom.phase === 'playing') hasSubmittedScoreRef.current = false;
        rebuildFromDB();
      });
      conn.db.player.onInsert((_ctx, p)  => { if (p.roomCode === code) rebuildFromDB(); });
      conn.db.player.onUpdate((_ctx, _o, p) => { if (p.roomCode === code) rebuildFromDB(); });
      conn.db.player.onDelete((_ctx, p)  => { if (p.roomCode === code) rebuildFromDB(); });
      conn.db.submission.onInsert((_ctx, s) => { if (s.roomCode === code) rebuildFromDB(); });
      conn.db.roundResult.onInsert((_ctx, r) => { if (r.roomCode === code) rebuildFromDB(); });
      conn.db.roundResult.onUpdate((_ctx, _o, r) => { if (r.roomCode === code) rebuildFromDB(); });
      conn.db.playerPowerup.onUpdate((_ctx, _o, pp) => { if (pp.roomCode === code) rebuildFromDB(); });

      // Powerup event notifications
      conn.db.powerupEvent.onInsert((_ctx, event) => {
        if (event.roomCode !== code) return;
        const myHex = myHexRef.current;
        if (!myHex || event.targetIdentity.toHexString() !== myHex) return;

        if (event.eventType === 'powerup-received') {
          if (event.powerupId === 'TOKEN_DRAIN') {
            update({ powerupNotification: { message: `⚡ ${event.casterName} drained 20 tokens from you!`, type: 'attack' } });
            setTimeout(() => update({ powerupNotification: null }), 4000);
          } else if (event.powerupId === 'FREEZE') {
            update({ powerupNotification: { message: `❄️ ${event.casterName} froze your timer for ${event.durationMs / 1000}s!`, type: 'attack' } });
            setTimeout(() => update({ powerupNotification: null }), 4000);
          }
        } else if (event.eventType === 'powerup-blocked') {
          update({ powerupNotification: { message: `🛡️ Your shield blocked ${event.casterName}'s attack!`, type: 'defend' } });
          setTimeout(() => update({ powerupNotification: null }), 4000);
        } else if (event.eventType === 'powerup-self') {
          if (event.powerupId === 'TOKEN_SHIELD') {
            update({ powerupNotification: { message: '🛡️ Shield activated! Protected from the next attack.', type: 'defend' } });
            setTimeout(() => update({ powerupNotification: null }), 4000);
          } else if (event.powerupId === 'HINT') {
            const hints: string[] = JSON.parse(event.hints || '[]');
            update({ powerupNotification: { message: `💡 Hint revealed: ${hints.join(', ')}`, type: 'info' } });
            setTimeout(() => update({ powerupNotification: null }), 6000);
          } else if (event.powerupId === 'DOUBLE_POINTS') {
            update({ powerupNotification: { message: '⭐ Double Points active! Score will be doubled.', type: 'info' } });
            setTimeout(() => update({ powerupNotification: null }), 4000);
          } else if (event.powerupId === 'CATEGORY') {
            update({ powerupNotification: { message: `🏷️ Category revealed: ${event.category} (${event.difficulty})`, type: 'info' } });
            setTimeout(() => update({ powerupNotification: null }), 6000);
          }
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ── Timer: compute timeRemaining from roundStartUs ───────────────────────────

  useEffect(() => {
    if (gs.phase !== 'playing') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => {
      const conn = connRef.current;
      if (!conn) return;
      const room = conn.db.room.code.find(code);
      if (!room || room.phase !== 'playing') return;

      const roundStartMs = Number(room.roundStartUs / BigInt(1000));
      const elapsedMs = Date.now() - roundStartMs;
      const roundDurationMs = Number(room.roundDurationUs / 1000n);
      const remaining = Math.max(0, Math.ceil((roundDurationMs - elapsedMs) / 1000));

      const myHex = myHexRef.current;
      const myPp = myHex
        ? [...conn.db.playerPowerup.by_room.filter(code)].find(pp => pp.identity.toHexString() === myHex)
        : null;
      const frozenUntilMs = myPp ? Number(myPp.frozenUntilMs) : 0;
      const isFrozen = (myPp?.isFrozen ?? false) && Date.now() < frozenUntilMs;
      const frozenSecsLeft = isFrozen ? Math.max(0, Math.ceil((frozenUntilMs - Date.now()) / 1000)) : 0;

      update({ timeRemaining: remaining, isFrozen, frozenSecondsLeft: frozenSecsLeft });
    }, 1000);

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [gs.phase, code, update]);

  // ── Scoring: when phase = scoring and I submitted, call AI scoring API ────────

  useEffect(() => {
    if (gs.phase !== 'scoring') return;
    if (!gs.submittedThisRound) return;
    if (hasSubmittedScoreRef.current) return;

    hasSubmittedScoreRef.current = true;
    const conn = connRef.current;
    const room = conn ? conn.db.room.code.find(code) : null;
    if (!conn || !room) return;

    const currentRound = room.currentRound;
    const imageData = generatedImageRef.current ?? '';

    (async () => {
      try {
        const res = await fetch('/api/score-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceImageId: room.currentImageId,
            generatedImageBase64: imageData,
          }),
        });
        const data = await res.json();
        const similarityScore = Math.round(Math.min(100, Math.max(0, data.similarityScore ?? 0)));
        const reasoning = data.reasoning ?? '';
        const scoreBreakdown = JSON.stringify(data.breakdown ?? {});
        conn.reducers.submitScore({
          roomCode: code,
          round: currentRound,
          similarityScore,
          imageData,
          reasoning,
          scoreBreakdown,
        });
      } catch {
        // Submit 0 score so the round can progress
        conn.reducers.submitScore({
          roomCode: code,
          round: currentRound,
          similarityScore: 0,
          imageData: imageData,
          reasoning: 'Scoring failed',
          scoreBreakdown: '{}',
        });
      }
    })();
  }, [gs.phase, gs.submittedThisRound, code]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const roomCode = gs.roomCode ?? code;

  const setReady = () => {
    connRef.current?.reducers.toggleReady({});
  };

  const startGame = () => {
    connRef.current?.reducers.startGame({ roomCode });
  };

  const nextRound = () => {
    connRef.current?.reducers.nextRound({ roomCode });
  };

  const playAgain = () => {
    connRef.current?.reducers.playAgain({ roomCode });
    hasSubmittedScoreRef.current = false;
    setGeneratedImage(null);
    generatedImageRef.current = null;
    update({ phase: 'lobby', currentRound: 0, results: [], leaderboard: [], submittedThisRound: false });
  };

  // Generate image → store ref → submit prompt to SpacetimeDB
  const handlePromptSubmit = async (prompt: string, tokensUsed: number) => {
    setGenerating(true);
    setGenError(null);
    const conn = connRef.current;
    const room = conn ? conn.db.room.code.find(code) : null;
    if (!conn || !room) { setGenerating(false); return; }

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!data.success || !data.imageData) throw new Error(data.error || 'Image generation failed');

      setGeneratedImage(data.imageData);
      generatedImageRef.current = data.imageData;

      conn.reducers.submitPrompt({
        roomCode,
        round: room.currentRound,
        prompt,
        tokensUsed,
      });
      update({ submittedThisRound: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setGenError(message);
      // Submit without image so round can progress
      conn.reducers.submitPrompt({ roomCode, round: room.currentRound, prompt, tokensUsed });
      update({ submittedThisRound: true });
    } finally {
      setGenerating(false);
    }
  };

  const usePowerup = (powerupId: PowerupId, targetPlayerId?: string) => {
    connRef.current?.reducers.usePowerup({
      roomCode: code,
      powerupId,
      targetHex: targetPlayerId ?? '',
    });
    update({ myPowerup: null, powerupUsed: true });
    setPowerupTarget(null);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const myPlayer = gs.players.find(p => p.id === gs.myPlayerId);
  const isHost = myPlayer?.isHost ?? false;
  const allReady = gs.players.length >= 1 && gs.players.every(p => p.isReady);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--black)', opacity: 0.5, padding: '4px 0', letterSpacing: '0.08em' }}>
            ← Home
          </button>
        </div>

        {/* Error banner */}
        {gs.error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--danger)', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--sh-xs)' }}>
            <span>{gs.error}</span>
            <button onClick={() => update({ error: null })} style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
          </div>
        )}

        {gs.phase === 'lobby' && (
          <LobbyView gs={gs} isHost={isHost} allReady={allReady} onToggleReady={setReady} onStartGame={startGame} onCopyCode={copyRoomCode} />
        )}
        {gs.phase === 'countdown' && <CountdownView value={gs.countdownValue} />}
        {gs.phase === 'playing' && (
          <PlayingView gs={gs} generating={generating} generatedImage={generatedImage} genError={genError}
            onSubmit={handlePromptSubmit} onUsePowerup={usePowerup}
            powerupTarget={powerupTarget} onSetPowerupTarget={setPowerupTarget} tips={tips} />
        )}
        {gs.phase === 'scoring' && <ScoringView tips={tips} submitted={gs.submittedThisRound} />}
        {gs.phase === 'reveal' && (
          <div>
            <ResultsReveal results={gs.results} referenceImage={gs.referenceImage} myPlayerId={gs.myPlayerId} />
            {isHost && (
              <div style={{ marginTop: 24 }}>
                <button className="btn btn-dark" onClick={nextRound}>
                  {gs.currentRound >= gs.totalRounds
                    ? <span>Final Scores <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span></span>
                    : <span>Next Round <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span></span>}
                </button>
              </div>
            )}
            {!isHost && (
              <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.5, color: 'var(--black)' }}>
                waiting for host to continue...
              </div>
            )}
          </div>
        )}
        {gs.phase === 'leaderboard' && (
          <div>
            <Leaderboard entries={gs.leaderboard} myPlayerId={gs.myPlayerId}
              currentRound={gs.currentRound} totalRounds={gs.totalRounds}
              isHost={isHost} onNextRound={nextRound} onPlayAgain={playAgain}
              isGameOver={gs.currentRound >= gs.totalRounds} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost btn-auto" style={{ flex: 1, fontSize: 13 }} onClick={() => router.push('/')}>← Home</button>
              {gs.currentRound >= gs.totalRounds && (
                <button className="btn btn-ghost btn-auto" style={{ flex: 1, fontSize: 13 }} onClick={() => router.push('/stats')}>◆ My Stats</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function LobbyView({ gs, isHost, allReady, onToggleReady, onStartGame, onCopyCode }: {
  gs: GameState; isHost: boolean; allReady: boolean;
  onToggleReady: (ready: boolean) => void; onStartGame: () => void; onCopyCode: () => void;
}) {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Room code hero */}
      <div className="po-panel animate-slide-up" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <div className="po-kicker" style={{ color: 'var(--acid)', opacity: 1, marginBottom: 10 }}>Room Code</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 46, letterSpacing: '0.08em', color: 'var(--acid)', lineHeight: 1 }}>
          {gs.roomCode}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
          <button className="btn btn-primary btn-sm btn-auto" onClick={onCopyCode}>Copy</button>
          {canShare && (
            <button
              className="btn btn-ghost btn-sm btn-auto"
              style={{ color: 'var(--paper)', borderColor: 'rgba(245,244,237,0.4)' }}
              onClick={() => navigator.share({ title: 'PromptOff', text: `Join my room! Code: ${gs.roomCode}` })}
            >
              Share
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <LobbyStatCard label="Players" value={`${gs.players.length} / 8`} />
        <LobbyStatCard label="Rounds"  value={`${gs.totalRounds}`} accent />
      </div>

      <div className="po-stripe" />

      <PlayerList players={gs.players} myPlayerId={gs.myPlayerId} onToggleReady={onToggleReady}
        canStart={allReady && gs.players.length >= 1} onStartGame={onStartGame} isHost={isHost} />
    </div>
  );
}

function LobbyStatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={accent ? 'po-card card-acid' : 'po-card'} style={{ padding: '14px 16px' }}>
      <div className="po-kicker" style={{ color: accent ? 'var(--ink)' : 'var(--black)', opacity: accent ? 0.7 : 0.55, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.02em', color: accent ? 'var(--ink)' : 'var(--black)' }}>{value}</div>
    </div>
  );
}

function CountdownView({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div className="po-kicker" style={{ opacity: 0.6 }}>Get ready!</div>
      <div key={value} className="animate-bounce-in" style={{
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 120, lineHeight: 1,
        letterSpacing: '-0.04em',
        color: value <= 1 ? 'var(--danger)' : value <= 2 ? 'var(--warn)' : 'var(--acid)',
      }}>
        {value}
      </div>
      <div className="po-chip">Round starting...</div>
    </div>
  );
}

function PlayingView({ gs, generating, generatedImage, genError, onSubmit, onUsePowerup, powerupTarget, onSetPowerupTarget, tips }: {
  gs: GameState; generating: boolean; generatedImage: string | null; genError: string | null;
  onSubmit: (prompt: string, tokensUsed: number) => void;
  onUsePowerup: (powerupId: PowerupId, targetPlayerId?: string) => void;
  powerupTarget: string | null; onSetPowerupTarget: (id: string | null) => void;
  tips: string[];
}) {
  const totalSeconds = Math.ceil(gs.roundDurationMs / 1000);
  const effectiveBudget = Math.max(0, gs.tokenBudget - gs.tokenDrainAmount);
  const def = gs.myPowerup ? POWERUP_DEFS[gs.myPowerup] : null;
  const needsTarget = def?.requiresTarget ?? false;
  const opponents = gs.players.filter(p => p.id !== gs.myPlayerId);

  const handlePowerupActivate = () => {
    if (!gs.myPowerup) return;
    if (needsTarget) { onSetPowerupTarget(powerupTarget ? null : 'selecting'); }
    else { onUsePowerup(gs.myPowerup); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {gs.powerupNotification && (
        <div style={{
          padding: '10px 14px',
          background: gs.powerupNotification.type === 'attack' ? 'var(--danger)' : gs.powerupNotification.type === 'defend' ? 'var(--ink)' : 'var(--acid)',
          border: 'var(--bd)', borderRadius: 'var(--r)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
          color: gs.powerupNotification.type === 'attack' ? 'var(--white)' : gs.powerupNotification.type === 'defend' ? 'var(--acid)' : 'var(--ink)',
          boxShadow: 'var(--sh-xs)',
        }}>
          {gs.powerupNotification.message}
        </div>
      )}
      {gs.isFrozen && (
        <div style={{ padding: '12px 16px', background: 'var(--ink)', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--info)', textAlign: 'center', boxShadow: 'var(--sh-xs)' }}>
          ❄️ Timer frozen! {gs.frozenSecondsLeft}s remaining
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Round</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28 }}>{gs.currentRound} / {gs.totalRounds}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <CountdownTimer timeRemaining={gs.timeRemaining} totalSeconds={totalSeconds} />
          {gs.hasDoublePoints && <span className="po-chip po-chip--acid">⭐ 2× Points</span>}
          {gs.hasShield && <span className="po-chip po-chip--ink">🛡️ Shielded</span>}
        </div>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${gs.timeRemaining <= 10 ? 'danger' : gs.timeRemaining <= 30 ? 'warning' : 'safe'}`}
          style={{ width: `${(gs.timeRemaining / totalSeconds) * 100}%`, opacity: gs.isFrozen ? 0.4 : 1 }} />
      </div>
      {gs.referenceImage && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="po-kicker">Target</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className={`badge badge-${gs.referenceImage.difficulty.toLowerCase()}`}>{gs.referenceImage.difficulty}</span>
              <span className="badge badge-category">{gs.referenceImage.category}</span>
            </div>
          </div>
          <div style={{ border: 'var(--bd)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gs.referenceImage.url} alt={gs.referenceImage.title} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ marginTop: 6, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, opacity: 0.6, color: 'var(--black)', letterSpacing: '0.04em' }}>{gs.referenceImage.title}</div>
        </div>
      )}
      {gs.hintKeywords.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--white)', border: 'var(--bd)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', boxShadow: 'var(--sh-xs)' }}>
          <span className="po-kicker" style={{ opacity: 0.6 }}>Keywords:</span>
          {gs.hintKeywords.map(kw => (
            <span key={kw} className="po-chip po-chip--ink">{kw}</span>
          ))}
        </div>
      )}
      {!gs.submittedThisRound && (
        <PowerupTray powerup={gs.myPowerup} powerupUsed={gs.powerupUsed} def={def}
          needsTarget={needsTarget} isSelectingTarget={powerupTarget === 'selecting'}
          opponents={opponents} onActivate={handlePowerupActivate}
          onTargetSelect={id => onUsePowerup(gs.myPowerup!, id)}
          onCancelTarget={() => onSetPowerupTarget(null)} />
      )}
      {gs.submittedThisRound ? (
        <SubmittedView generatedImage={generatedImage} waitingFor={gs.waitingForPlayers} playerCount={gs.players.length} tips={tips} />
      ) : (
        <>
          <div className="po-card" style={{ padding: 16 }}>
            {gs.tokenDrainAmount > 0 && (
              <div className="po-chip po-chip--danger" style={{ marginBottom: 10 }}>
                ⚡ Budget reduced by {gs.tokenDrainAmount} tokens
              </div>
            )}
            <PromptEditor budget={effectiveBudget} onSubmit={onSubmit} disabled={gs.isFrozen} generating={generating} />
          </div>
          {gs.isFrozen && <div style={{ padding: '10px 14px', background: 'var(--ink)', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--info)', textAlign: 'center' }}>❄️ Frozen for {gs.frozenSecondsLeft}s...</div>}
          {genError && <div style={{ padding: '10px 14px', background: 'var(--danger)', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--white)', boxShadow: 'var(--sh-xs)' }}>⚠️ {genError}</div>}
        </>
      )}
    </div>
  );
}

const POWERUP_TYPE_CHIP: Record<string, string> = {
  offensive: 'po-chip--danger',
  defensive: 'po-chip--acid',
  utility:   'po-chip--ink',
};

function PowerupTray({ powerup, powerupUsed, def, needsTarget, isSelectingTarget, opponents, onActivate, onTargetSelect, onCancelTarget }: {
  powerup: PowerupId | null; powerupUsed: boolean;
  def: (typeof POWERUP_DEFS)[PowerupId] | null | undefined;
  needsTarget: boolean; isSelectingTarget: boolean; opponents: Player[];
  onActivate: () => void; onTargetSelect: (id: string) => void; onCancelTarget: () => void;
}) {
  if (!powerup && !powerupUsed) return null;
  const chipClass = def ? (POWERUP_TYPE_CHIP[def.type] ?? 'po-chip--ink') : 'po-chip--ink';
  return (
    <div className="po-card" style={{ transition: 'all 200ms ease', opacity: powerupUsed ? 0.5 : 1 }}>
      <div className="po-kicker" style={{ marginBottom: 8 }}>Your Powerup</div>
      {powerupUsed ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.5, color: 'var(--black)' }}>used this round</div>
      ) : def ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>{def.emoji}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className={`po-chip ${chipClass}`}>{def.type}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: 'var(--black)', letterSpacing: '-0.01em' }}>{def.name}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.6, marginTop: 2, color: 'var(--black)' }}>{def.description}</div>
            </div>
          </div>
          {isSelectingTarget ? (
            <div>
              <div className="po-kicker" style={{ marginBottom: 8 }}>Choose a target:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {opponents.map(p => (
                  <button key={p.id} onClick={() => onTargetSelect(p.id)} className="po-row" style={{ cursor: 'pointer', border: 'var(--bd)', background: 'var(--white)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl(p.avatar)} alt="" style={{ width: 28, height: 28, display: 'block', borderRadius: 4 }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--black)' }}>{p.name}</span>
                  </button>
                ))}
                <button onClick={onCancelTarget} className="btn btn-ghost btn-auto" style={{ marginTop: 4 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={onActivate} disabled={needsTarget && opponents.length === 0} className="btn btn-dark btn-auto" style={{ width: '100%', opacity: needsTarget && opponents.length === 0 ? 0.4 : 1, cursor: needsTarget && opponents.length === 0 ? 'not-allowed' : 'pointer' }}>
              {needsTarget ? `Use on opponent →` : `Activate ${def.emoji}`}
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}

function SubmittedView({ generatedImage, waitingFor, playerCount, tips }: { generatedImage: string | null; waitingFor: number; playerCount: number; tips: string[] }) {
  const tip = useMemo(
    () => (tips.length ? tips[Math.floor(Math.random() * tips.length)] : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tips.length]
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="po-panel" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <div className="po-chip po-chip--acid" style={{ margin: '0 auto 10px' }}>✓ Submitted</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--paper)', letterSpacing: '-0.02em' }}>Prompt Sent!</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 6, opacity: 0.6, color: 'var(--paper)' }}>
          waiting for {waitingFor} more player{waitingFor !== 1 ? 's' : ''}...
        </div>
      </div>
      {generatedImage && (
        <div>
          <div className="po-kicker" style={{ marginBottom: 8 }}>Your Generated Image</div>
          <div style={{ border: 'var(--bd)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generatedImage} alt="Your generated image" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--white)', border: 'var(--bd)', borderRadius: 'var(--r)', boxShadow: 'var(--sh-xs)' }}>
        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.15)', borderTopColor: 'var(--acid)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, opacity: 0.6, color: 'var(--black)' }}>AI scoring submissions...</span>
      </div>
      {!generatedImage && tip && (
        <div className="po-card">
          <div className="po-kicker" style={{ marginBottom: 6 }}>Tip</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--black)' }}>{tip}</div>
        </div>
      )}
    </div>
  );
}

function ScoringView({ tips, submitted }: { tips: string[]; submitted: boolean }) {
  const [idx, setIdx] = useState(() => tips.length ? Math.floor(Math.random() * tips.length) : 0);
  useEffect(() => {
    if (tips.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % tips.length), 4000);
    return () => clearInterval(t);
  }, [tips.length]);

  const tip = tips[idx];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 52, animation: 'pulse-ring 1.5s ease-in-out infinite' }}>🤖</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--black)', letterSpacing: '-0.02em' }}>{submitted ? 'Scoring...' : 'Round Over'}</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.6, maxWidth: 240, lineHeight: 1.5, color: 'var(--black)' }}>
        {submitted
          ? 'Gemini AI is analyzing and scoring all submissions'
          : "You didn't submit a prompt this round — waiting for results"}
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 10, height: 10, background: 'var(--acid)', borderRadius: '50%', animation: `pulse-ring 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      {submitted && tip && (
        <div className="po-card" style={{ maxWidth: 320, textAlign: 'left' }}>
          <div className="po-kicker" style={{ marginBottom: 6 }}>Tip</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--black)' }}>{tip}</div>
        </div>
      )}
    </div>
  );
}
