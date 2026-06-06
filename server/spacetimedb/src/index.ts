import { schema, table, t } from 'spacetimedb/server';
import { ScheduleAt } from 'spacetimedb';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUND_DURATION_US = 90_000_000n; // 90 seconds in microseconds
const TOKEN_BUDGET = 120;

const POWERUP_POOL = ['TOKEN_DRAIN', 'FREEZE', 'TOKEN_SHIELD', 'HINT', 'DOUBLE_POINTS', 'CATEGORY'];
const AVATARS = ['🦸', '🧙', '🤖', '👾', '🦊', '🐉', '🦅', '🐺', '🦁', '🐯'];

const IMAGE_HINTS: Record<string, string[]> = {
  'img-001': ['swirling', 'night sky', 'impasto'],
  'img-002': ['reflection', 'alpine', 'serene'],
  'img-003': ['neon', 'rain-slicked', 'futuristic'],
  'img-004': ['pink petals', 'soft light', 'spring'],
  'img-005': ['beam', 'rocky coast', 'dusk'],
  'img-006': ['colorful', 'sky', 'festival'],
  'img-007': ['coral reef', 'tropical fish', 'blue'],
  'img-008': ['golden sand', 'ripples', 'arid'],
  'img-009': ['nebula', 'cosmic', 'purple haze'],
  'img-010': ['orange leaves', 'forest path', 'fall'],
  'img-011': ['lanterns', 'busy street', 'evening'],
  'img-012': ['fluid', 'blue waves', 'abstract'],
  'img-013': ['stone walls', 'overgrown', 'medieval'],
  'img-014': ['white fur', 'snowy', 'wildlife'],
  'img-015': ['geometric', 'gold accents', '1920s'],
  'img-016': ['rows', 'colorful', 'Netherlands'],
  'img-017': ['gears', 'steam', 'Victorian'],
  'img-018': ['whitewashed', 'blue dome', 'Aegean'],
  'img-019': ['fragmented', 'geometric faces', 'Picasso'],
  'img-020': ['mist', 'lush green', 'tropical'],
};

const REFERENCE_IMAGES = [
  { id: 'img-001', filename: 'starry-night.jpg',    category: 'Fine Art',     difficulty: 'Hard',   title: 'Starry Night Style' },
  { id: 'img-002', filename: 'mountain-lake.jpg',   category: 'Photography',  difficulty: 'Medium', title: 'Mountain Lake' },
  { id: 'img-003', filename: 'neon-city.jpg',        category: 'Concept Art',  difficulty: 'Hard',   title: 'Neon Cityscape' },
  { id: 'img-004', filename: 'cherry-blossom.jpg',  category: 'Nature',       difficulty: 'Easy',   title: 'Cherry Blossoms' },
  { id: 'img-005', filename: 'lighthouse.jpg',       category: 'Architecture', difficulty: 'Medium', title: 'Lighthouse at Dusk' },
  { id: 'img-006', filename: 'hot-air-balloon.jpg', category: 'Photography',  difficulty: 'Medium', title: 'Hot Air Balloons' },
  { id: 'img-007', filename: 'underwater.jpg',       category: 'Nature',       difficulty: 'Hard',   title: 'Underwater Coral' },
  { id: 'img-008', filename: 'desert-dunes.jpg',    category: 'Photography',  difficulty: 'Easy',   title: 'Desert Dunes' },
  { id: 'img-009', filename: 'space-nebula.jpg',    category: 'Concept Art',  difficulty: 'Hard',   title: 'Space Nebula' },
  { id: 'img-010', filename: 'autumn-forest.jpg',   category: 'Nature',       difficulty: 'Easy',   title: 'Autumn Forest' },
  { id: 'img-011', filename: 'tokyo-street.jpg',    category: 'Photography',  difficulty: 'Medium', title: 'Tokyo Street' },
  { id: 'img-012', filename: 'abstract-waves.jpg',  category: 'Fine Art',     difficulty: 'Hard',   title: 'Abstract Waves' },
  { id: 'img-013', filename: 'castle-ruins.jpg',    category: 'Architecture', difficulty: 'Medium', title: 'Castle Ruins' },
  { id: 'img-014', filename: 'arctic-fox.jpg',      category: 'Nature',       difficulty: 'Medium', title: 'Arctic Fox' },
  { id: 'img-015', filename: 'art-deco.jpg',        category: 'Architecture', difficulty: 'Hard',   title: 'Art Deco Interior' },
  { id: 'img-016', filename: 'tulip-fields.jpg',    category: 'Nature',       difficulty: 'Easy',   title: 'Tulip Fields' },
  { id: 'img-017', filename: 'steampunk.jpg',        category: 'Concept Art',  difficulty: 'Hard',   title: 'Steampunk City' },
  { id: 'img-018', filename: 'greek-island.jpg',    category: 'Photography',  difficulty: 'Easy',   title: 'Greek Island' },
  { id: 'img-019', filename: 'cubist-portrait.jpg', category: 'Fine Art',     difficulty: 'Hard',   title: 'Cubist Portrait' },
  { id: 'img-020', filename: 'waterfall.jpg',        category: 'Nature',       difficulty: 'Medium', title: 'Jungle Waterfall' },
];

// ─── Tables ───────────────────────────────────────────────────────────────────

const room = table(
  { name: 'room', public: true },
  {
    code:             t.string().primaryKey(),
    phase:            t.string(), // lobby|countdown|playing|scoring|reveal|leaderboard
    host_identity:    t.identity(),
    current_round:    t.u32(),
    total_rounds:     t.u32(),
    current_image_id: t.string(),
    round_start_us:   t.u64(), // microseconds since epoch (0 when not playing)
    token_budget:     t.u32(),
    used_image_ids:   t.string(), // JSON string[]
    countdown_value:  t.u32(),
  }
);

const player = table(
  {
    name: 'player',
    public: true,
    indexes: [{ accessor: 'by_room', algorithm: 'btree', columns: ['room_code'] }],
  },
  {
    identity:    t.identity().primaryKey(),
    room_code:   t.string(),
    name:        t.string(),
    is_ready:    t.bool(),
    is_host:     t.bool(),
    avatar_index: t.u32(),
    is_online:   t.bool(),
    total_score: t.u32(),
    round_scores: t.string(), // JSON number[]
  }
);

const submission = table(
  {
    name: 'submission',
    public: true,
    indexes: [
      { accessor: 'by_room',       algorithm: 'btree', columns: ['room_code'] },
      { accessor: 'by_room_round', algorithm: 'btree', columns: ['room_code', 'round'] },
    ],
  },
  {
    id:                 t.u64().primaryKey().autoInc(),
    identity:           t.identity(),
    room_code:          t.string(),
    round:              t.u32(),
    prompt:             t.string(),
    tokens_used:        t.u32(),
    submitted_at_us:    t.u64(),
    submission_time_ms: t.u64(),
  }
);

const roundResult = table(
  {
    name: 'round_result',
    public: true,
    indexes: [
      { accessor: 'by_room',       algorithm: 'btree', columns: ['room_code'] },
      { accessor: 'by_room_round', algorithm: 'btree', columns: ['room_code', 'round'] },
    ],
  },
  {
    id:               t.u64().primaryKey().autoInc(),
    identity:         t.identity(),
    room_code:        t.string(),
    round:            t.u32(),
    player_name:      t.string(),
    avatar_index:     t.u32(),
    prompt:           t.string(),
    image_data:       t.string(), // base64 for reveal display
    tokens_used:      t.u32(),
    similarity_score: t.u32(),
    round_score:      t.u32(),
    placement:        t.u32(),
    reasoning:        t.string(),
  }
);

// Per-player powerup state (one row per player, overwritten each round)
const playerPowerup = table(
  {
    name: 'player_powerup',
    public: true,
    indexes: [{ accessor: 'by_room', algorithm: 'btree', columns: ['room_code'] }],
  },
  {
    identity:          t.identity().primaryKey(),
    room_code:         t.string(),
    round:             t.u32(),
    powerup_id:        t.string(),
    is_used:           t.bool(),
    has_shield:        t.bool(),
    has_double_points: t.bool(),
    token_drain_amount: t.u32(),
    is_frozen:         t.bool(),
    frozen_until_ms:   t.u64(), // ms since epoch; 0 = not frozen
    hint_keywords:     t.string(), // JSON string[]
    revealed_category: t.string(),
  }
);

// Global leaderboard: one row per player name, ranked by wins
const globalLeaderboard = table(
  { name: 'global_leaderboard', public: true },
  {
    player_name:   t.string().primaryKey(),
    wins:          t.u32(),
    games_played:  t.u32(),
    best_score:    t.u32(), // tiebreaker
    updated_at_us: t.u64(),
  }
);

// Event table: targeted powerup notifications (not stored in client cache)
const powerupEvent = table(
  { name: 'powerup_event', event: true, public: true },
  {
    id:              t.u64().primaryKey().autoInc(),
    target_identity: t.identity(), // client filters: only react if target === myIdentity
    room_code:       t.string(),
    event_type:      t.string(), // powerup-received | powerup-blocked | powerup-self
    powerup_id:      t.string(),
    caster_name:     t.string(),
    amount:          t.u32(),
    duration_ms:     t.u32(),
    hints:           t.string(), // JSON string[]
    category:        t.string(),
    difficulty:      t.string(),
  }
);

// Scheduled: countdown tick (3, 2, 1)
const countdownTimer = table(
  { name: 'countdown_timer', scheduled: (): any => handleCountdownTick },
  {
    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
    room_code:    t.string(),
    tick_value:   t.u32(), // 3, 2, or 1
  }
);

// Scheduled: transition to 'playing' phase after countdown
const roundStartTimer = table(
  { name: 'round_start_timer', scheduled: (): any => handleRoundStart },
  {
    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
    room_code:    t.string(),
    round:        t.u32(),
  }
);

// Scheduled: auto-end round when time expires
const roundEndTimer = table(
  { name: 'round_end_timer', scheduled: (): any => handleRoundEnd },
  {
    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
    room_code:    t.string(),
    round:        t.u32(),
  }
);

const spacetimedb = schema({
  room, player, submission, roundResult, playerPowerup, powerupEvent,
  countdownTimer, roundStartTimer, roundEndTimer, globalLeaderboard,
});
export default spacetimedb;

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export const init = spacetimedb.init(_ctx => {});

export const onConnect = spacetimedb.clientConnected(ctx => {
  // Restore online status if player already exists
  const existing = ctx.db.player.identity.find(ctx.sender);
  if (existing) {
    ctx.db.player.identity.update({ ...existing, is_online: true });
  }
});

export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  const pl = ctx.db.player.identity.find(ctx.sender);
  if (!pl) return;

  ctx.db.player.identity.update({ ...pl, is_online: false });

  const rm = ctx.db.room.code.find(pl.room_code);
  if (!rm) return;

  // Transfer host to next online player if needed
  if (rm.host_identity.equals(ctx.sender)) {
    const next = [...ctx.db.player.by_room.filter(pl.room_code)]
      .find(p => p.is_online && !p.identity.equals(ctx.sender));
    if (next) {
      ctx.db.player.identity.update({ ...next, is_host: true });
      ctx.db.room.code.update({ ...rm, host_identity: next.identity });
    }
  }

  // Check if all remaining active players submitted → early scoring
  if (rm.phase === 'playing') {
    const active = [...ctx.db.player.by_room.filter(pl.room_code)].filter(p => p.is_online);
    const subs = [...ctx.db.submission.by_room_round.filter([pl.room_code, rm.current_round])];
    if (active.length > 0 && subs.length >= active.length) {
      ctx.db.room.code.update({ ...rm, phase: 'scoring' });
    }
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarIndex(identity: any): number {
  const hex: string = identity.toHexString();
  let sum = 0;
  for (let i = 0; i < hex.length; i++) sum += hex.charCodeAt(i);
  return sum % AVATARS.length;
}

function startRound(ctx: any, roomCode: string, rm: any) {
  const players = [...ctx.db.player.by_room.filter(roomCode)];

  // Pick random image not yet used this game
  const usedIds: string[] = JSON.parse(rm.used_image_ids);
  const available = REFERENCE_IMAGES.filter(img => !usedIds.includes(img.id));
  const pool = available.length > 0 ? available : REFERENCE_IMAGES;
  const image = pool[ctx.random.integerInRange(0, pool.length - 1)];

  const newRound = rm.current_round + 1;
  const newUsedIds = JSON.stringify([...usedIds, image.id]);

  ctx.db.room.code.update({
    ...rm,
    phase: 'countdown',
    current_round: newRound,
    current_image_id: image.id,
    used_image_ids: newUsedIds,
    countdown_value: 3,
    round_start_us: 0n,
  });

  // Deal powerup + reset state for each player
  for (const pl of players) {
    const powerupId = POWERUP_POOL[ctx.random.integerInRange(0, POWERUP_POOL.length - 1)];
    const existing = ctx.db.playerPowerup.identity.find(pl.identity);
    if (existing) {
      ctx.db.playerPowerup.identity.update({
        ...existing,
        round: newRound,
        powerup_id: powerupId,
        is_used: false,
        has_shield: false,
        has_double_points: false,
        token_drain_amount: 0,
        is_frozen: false,
        frozen_until_ms: 0n,
        hint_keywords: '[]',
        revealed_category: '',
      });
    }
  }

  const nowUs: bigint = ctx.timestamp.microsSinceUnixEpoch;

  // Schedule countdown ticks: 3 at t=0, 2 at t+1s, 1 at t+2s
  for (let tick = 3; tick >= 1; tick--) {
    ctx.db.countdownTimer.insert({
      scheduled_id: 0n,
      scheduled_at: ScheduleAt.time(nowUs + BigInt(3 - tick) * 1_000_000n),
      room_code: roomCode,
      tick_value: tick,
    });
  }

  // Round starts 3 seconds after now
  ctx.db.roundStartTimer.insert({
    scheduled_id: 0n,
    scheduled_at: ScheduleAt.time(nowUs + 3_000_000n),
    room_code: roomCode,
    round: newRound,
  });

  // Round ends 90 seconds after round starts
  ctx.db.roundEndTimer.insert({
    scheduled_id: 0n,
    scheduled_at: ScheduleAt.time(nowUs + 3_000_000n + ROUND_DURATION_US),
    room_code: roomCode,
    round: newRound,
  });
}

function calcScore(similarityScore: number, tokensUsed: number, submissionTimeMs: number): number {
  const simScore = Math.min(100, Math.max(0, similarityScore)) * 0.60;
  const savedTokens = Math.max(0, TOKEN_BUDGET - tokensUsed);
  const effScore = (savedTokens / TOKEN_BUDGET) * 100 * 0.25;
  const roundDurationMs = Number(ROUND_DURATION_US / 1000n);
  const normalizedTime = Math.max(0, Math.min(1, submissionTimeMs / roundDurationMs));
  const speedScore = (1 - normalizedTime) * 100 * 0.15;
  return Math.round(simScore + effScore + speedScore);
}

// ─── Reducers ─────────────────────────────────────────────────────────────────

export const createRoom = spacetimedb.reducer(
  { playerName: t.string(), totalRounds: t.u32() },
  (ctx, { playerName, totalRounds }) => {
    if (![1, 3, 5].includes(totalRounds)) {
      throw new Error(`totalRounds must be 1, 3, or 5`);
    }
    // Evict any existing player row (stale from disconnect or prior session)
    const stale = ctx.db.player.identity.find(ctx.sender);
    if (stale) {
      ctx.db.player.identity.delete(ctx.sender);
      const stalePp = ctx.db.playerPowerup.identity.find(ctx.sender);
      if (stalePp) ctx.db.playerPowerup.identity.delete(ctx.sender);
      // Clean up old room if now empty
      const remaining = [...ctx.db.player.by_room.filter(stale.room_code)];
      if (remaining.length === 0) ctx.db.room.code.delete(stale.room_code);
    }

    // Generate 6-char room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[ctx.random.integerInRange(0, chars.length - 1)];
    }
    if (ctx.db.room.code.find(code)) {
      code = code.substring(0, 5) + chars[ctx.random.integerInRange(0, chars.length - 1)];
    }

    ctx.db.room.insert({
      code,
      phase: 'lobby',
      host_identity: ctx.sender,
      current_round: 0,
      total_rounds: totalRounds,
      current_image_id: '',
      round_start_us: 0n,
      token_budget: TOKEN_BUDGET,
      used_image_ids: '[]',
      countdown_value: 3,
    });

    ctx.db.player.insert({
      identity:     ctx.sender,
      room_code:    code,
      name:         playerName.trim() || 'Player 1',
      is_ready:     false,
      is_host:      true,
      avatar_index: avatarIndex(ctx.sender),
      is_online:    true,
      total_score:  0,
      round_scores: '[]',
    });

    ctx.db.playerPowerup.insert({
      identity:           ctx.sender,
      room_code:          code,
      round:              0,
      powerup_id:         '',
      is_used:            false,
      has_shield:         false,
      has_double_points:  false,
      token_drain_amount: 0,
      is_frozen:          false,
      frozen_until_ms:    0n,
      hint_keywords:      '[]',
      revealed_category:  '',
    });
  }
);

export const joinRoom = spacetimedb.reducer(
  { roomCode: t.string(), playerName: t.string() },
  (ctx, { roomCode, playerName }) => {
    const code = roomCode.toUpperCase();
    const rm = ctx.db.room.code.find(code);
    if (!rm) throw new Error('Room not found!');

    // Idempotent: already in room (reconnect)
    const existing = ctx.db.player.identity.find(ctx.sender);
    if (existing && existing.room_code === code) {
      ctx.db.player.identity.update({ ...existing, is_online: true });
      return;
    }

    if (rm.phase !== 'lobby') throw new Error('Game already in progress!');

    const players = [...ctx.db.player.by_room.filter(code)];
    if (players.length >= 8) throw new Error('Room is full (8 players max)!');

    // Clean up stale row in a different room
    if (existing) {
      ctx.db.player.identity.delete(ctx.sender);
      const pp = ctx.db.playerPowerup.identity.find(ctx.sender);
      if (pp) ctx.db.playerPowerup.identity.delete(ctx.sender);
    }

    ctx.db.player.insert({
      identity:     ctx.sender,
      room_code:    code,
      name:         playerName.trim() || `Player ${players.length + 1}`,
      is_ready:     false,
      is_host:      false,
      avatar_index: avatarIndex(ctx.sender),
      is_online:    true,
      total_score:  0,
      round_scores: '[]',
    });

    ctx.db.playerPowerup.insert({
      identity:           ctx.sender,
      room_code:          code,
      round:              0,
      powerup_id:         '',
      is_used:            false,
      has_shield:         false,
      has_double_points:  false,
      token_drain_amount: 0,
      is_frozen:          false,
      frozen_until_ms:    0n,
      hint_keywords:      '[]',
      revealed_category:  '',
    });
  }
);

export const toggleReady = spacetimedb.reducer(ctx => {
  const pl = ctx.db.player.identity.find(ctx.sender);
  if (!pl) return;
  ctx.db.player.identity.update({ ...pl, is_ready: !pl.is_ready });
});

export const startGame = spacetimedb.reducer(
  { roomCode: t.string() },
  (ctx, { roomCode }) => {
    const rm = ctx.db.room.code.find(roomCode);
    if (!rm) throw new Error('Room not found');
    if (!rm.host_identity.equals(ctx.sender)) throw new Error('Only host can start');
    const players = [...ctx.db.player.by_room.filter(roomCode)];
    if (players.length < 1) throw new Error('Need at least 1 player');
    startRound(ctx, roomCode, rm);
  }
);

export const submitPrompt = spacetimedb.reducer(
  { roomCode: t.string(), round: t.u32(), prompt: t.string(), tokensUsed: t.u32() },
  (ctx, { roomCode, round, prompt, tokensUsed }) => {
    const rm = ctx.db.room.code.find(roomCode);
    if (!rm || rm.phase !== 'playing' || rm.current_round !== round) return;

    // Idempotent: already submitted
    const already = [...ctx.db.submission.by_room_round.filter([roomCode, round])]
      .find(s => s.identity.equals(ctx.sender));
    if (already) return;

    const nowUs: bigint = ctx.timestamp.microsSinceUnixEpoch;
    const submissionTimeMs = (nowUs - rm.round_start_us) / 1000n;

    // Apply token drain
    const pp = ctx.db.playerPowerup.identity.find(ctx.sender);
    const drainAmount = pp ? pp.token_drain_amount : 0;
    const effectiveBudget = Math.max(0, TOKEN_BUDGET - drainAmount);
    const clampedTokens = Math.min(tokensUsed, effectiveBudget);

    ctx.db.submission.insert({
      id:                 0n,
      identity:           ctx.sender,
      room_code:          roomCode,
      round,
      prompt,
      tokens_used:        clampedTokens,
      submitted_at_us:    nowUs,
      submission_time_ms: submissionTimeMs,
    });

    // Early scoring if all active players submitted
    const active = [...ctx.db.player.by_room.filter(roomCode)].filter(p => p.is_online);
    const subs = [...ctx.db.submission.by_room_round.filter([roomCode, round])];
    if (subs.length >= active.length) {
      ctx.db.room.code.update({ ...rm, phase: 'scoring' });
    }
  }
);

export const submitScore = spacetimedb.reducer(
  { roomCode: t.string(), round: t.u32(), similarityScore: t.u32(), imageData: t.string(), reasoning: t.string() },
  (ctx, { roomCode, round, similarityScore, imageData, reasoning }) => {
    const rm = ctx.db.room.code.find(roomCode);
    if (!rm || rm.phase !== 'scoring' || rm.current_round !== round) return;

    // Idempotent
    const alreadyScored = [...ctx.db.roundResult.by_room_round.filter([roomCode, round])]
      .find(r => r.identity.equals(ctx.sender));
    if (alreadyScored) return;

    const pl = ctx.db.player.identity.find(ctx.sender);
    if (!pl) return;

    const sub = [...ctx.db.submission.by_room_round.filter([roomCode, round])]
      .find(s => s.identity.equals(ctx.sender));
    if (!sub) return;

    const pp = ctx.db.playerPowerup.identity.find(ctx.sender);
    const hasDoublePoints = pp ? pp.has_double_points : false;

    let roundScore = calcScore(similarityScore, sub.tokens_used, Number(sub.submission_time_ms));
    if (hasDoublePoints) roundScore = roundScore * 2;

    // Update player cumulative score
    const roundScores: number[] = JSON.parse(pl.round_scores);
    roundScores.push(roundScore);
    ctx.db.player.identity.update({
      ...pl,
      total_score:  pl.total_score + roundScore,
      round_scores: JSON.stringify(roundScores),
    });

    ctx.db.roundResult.insert({
      id:               0n,
      identity:         ctx.sender,
      room_code:        roomCode,
      round,
      player_name:      pl.name,
      avatar_index:     pl.avatar_index,
      prompt:           sub.prompt,
      image_data:       imageData,
      tokens_used:      sub.tokens_used,
      similarity_score: similarityScore,
      round_score:      roundScore,
      placement:        0, // computed below after all results
      reasoning,
    });

    // Check if all submitting players have results
    const submitters = [...ctx.db.submission.by_room_round.filter([roomCode, round])];
    const results = [...ctx.db.roundResult.by_room_round.filter([roomCode, round])];

    if (results.length >= submitters.length) {
      // Assign placements
      const sorted = [...results].sort((a, b) => b.round_score - a.round_score);
      for (let i = 0; i < sorted.length; i++) {
        ctx.db.roundResult.id.update({ ...sorted[i], placement: i + 1 });
      }
      ctx.db.room.code.update({ ...rm, phase: 'reveal' });
    }
  }
);

export const usePowerup = spacetimedb.reducer(
  { roomCode: t.string(), powerupId: t.string(), targetHex: t.string() },
  (ctx, { roomCode, powerupId, targetHex }) => {
    const rm = ctx.db.room.code.find(roomCode);
    if (!rm || rm.phase !== 'playing') return;

    const myPp = ctx.db.playerPowerup.identity.find(ctx.sender);
    if (!myPp || myPp.powerup_id !== powerupId || myPp.is_used) return;

    const caster = ctx.db.player.identity.find(ctx.sender);
    const casterName = caster ? caster.name : 'Someone';

    // Resolve target
    const targetPp = targetHex
      ? [...ctx.db.playerPowerup.by_room.filter(roomCode)]
          .find(pp => pp.identity.toHexString() === targetHex)
      : null;

    switch (powerupId) {
      case 'TOKEN_DRAIN':
      case 'FREEZE': {
        if (!targetPp) return;
        ctx.db.playerPowerup.identity.update({ ...myPp, powerup_id: '', is_used: true });

        if (targetPp.has_shield) {
          ctx.db.playerPowerup.identity.update({ ...targetPp, has_shield: false });
          ctx.db.powerupEvent.insert({
            id: 0n, target_identity: targetPp.identity, room_code: roomCode,
            event_type: 'powerup-blocked', powerup_id: powerupId, caster_name: casterName,
            amount: 0, duration_ms: 0, hints: '[]', category: '', difficulty: '',
          });
        } else if (powerupId === 'TOKEN_DRAIN') {
          ctx.db.playerPowerup.identity.update({ ...targetPp, token_drain_amount: targetPp.token_drain_amount + 20 });
          ctx.db.powerupEvent.insert({
            id: 0n, target_identity: targetPp.identity, room_code: roomCode,
            event_type: 'powerup-received', powerup_id: 'TOKEN_DRAIN', caster_name: casterName,
            amount: 20, duration_ms: 0, hints: '[]', category: '', difficulty: '',
          });
        } else {
          // FREEZE: client computes countdown from frozen_until_ms
          const freezeUntilMs = ctx.timestamp.microsSinceUnixEpoch / 1000n + 10_000n;
          ctx.db.playerPowerup.identity.update({ ...targetPp, is_frozen: true, frozen_until_ms: freezeUntilMs });
          ctx.db.powerupEvent.insert({
            id: 0n, target_identity: targetPp.identity, room_code: roomCode,
            event_type: 'powerup-received', powerup_id: 'FREEZE', caster_name: casterName,
            amount: 0, duration_ms: 10000, hints: '[]', category: '', difficulty: '',
          });
        }
        break;
      }
      case 'TOKEN_SHIELD': {
        ctx.db.playerPowerup.identity.update({ ...myPp, powerup_id: '', is_used: true, has_shield: true });
        ctx.db.powerupEvent.insert({
          id: 0n, target_identity: ctx.sender, room_code: roomCode,
          event_type: 'powerup-self', powerup_id: 'TOKEN_SHIELD', caster_name: casterName,
          amount: 0, duration_ms: 0, hints: '[]', category: '', difficulty: '',
        });
        break;
      }
      case 'HINT': {
        const hints = IMAGE_HINTS[rm.current_image_id] ?? ['detailed', 'vivid', 'artistic'];
        const i1 = ctx.random.integerInRange(0, hints.length - 1);
        const i2 = hints.length > 1
          ? (i1 + 1 + ctx.random.integerInRange(0, hints.length - 2)) % hints.length
          : i1;
        const picked = JSON.stringify([hints[i1], hints[i2]]);
        ctx.db.playerPowerup.identity.update({ ...myPp, powerup_id: '', is_used: true, hint_keywords: picked });
        ctx.db.powerupEvent.insert({
          id: 0n, target_identity: ctx.sender, room_code: roomCode,
          event_type: 'powerup-self', powerup_id: 'HINT', caster_name: casterName,
          amount: 0, duration_ms: 0, hints: picked, category: '', difficulty: '',
        });
        break;
      }
      case 'DOUBLE_POINTS': {
        ctx.db.playerPowerup.identity.update({ ...myPp, powerup_id: '', is_used: true, has_double_points: true });
        ctx.db.powerupEvent.insert({
          id: 0n, target_identity: ctx.sender, room_code: roomCode,
          event_type: 'powerup-self', powerup_id: 'DOUBLE_POINTS', caster_name: casterName,
          amount: 0, duration_ms: 0, hints: '[]', category: '', difficulty: '',
        });
        break;
      }
      case 'CATEGORY': {
        const img = REFERENCE_IMAGES.find(i => i.id === rm.current_image_id);
        const cat = img ? img.category : 'Unknown';
        const diff = img ? img.difficulty : 'Unknown';
        ctx.db.playerPowerup.identity.update({
          ...myPp, powerup_id: '', is_used: true, revealed_category: `${cat} · ${diff}`,
        });
        ctx.db.powerupEvent.insert({
          id: 0n, target_identity: ctx.sender, room_code: roomCode,
          event_type: 'powerup-self', powerup_id: 'CATEGORY', caster_name: casterName,
          amount: 0, duration_ms: 0, hints: '[]', category: cat, difficulty: diff,
        });
        break;
      }
    }
  }
);

export const nextRound = spacetimedb.reducer(
  { roomCode: t.string() },
  (ctx, { roomCode }) => {
    const rm = ctx.db.room.code.find(roomCode);
    if (!rm) return;
    if (!rm.host_identity.equals(ctx.sender)) return;

    if (rm.current_round >= rm.total_rounds) {
      ctx.db.room.code.update({ ...rm, phase: 'leaderboard' });

      // Upsert global leaderboard: track wins and games played
      const nowUs: bigint = ctx.timestamp.microsSinceUnixEpoch;
      const allPlayers = [...ctx.db.player.by_room.filter(roomCode)];
      const topScore = allPlayers.reduce((max, p) => Math.max(max, p.total_score), 0);

      for (const pl of allPlayers) {
        const isWinner = pl.total_score === topScore;
        const existing = ctx.db.globalLeaderboard.player_name.find(pl.name);
        if (!existing) {
          ctx.db.globalLeaderboard.insert({
            player_name:   pl.name,
            wins:          isWinner ? 1 : 0,
            games_played:  1,
            best_score:    pl.total_score,
            updated_at_us: nowUs,
          });
        } else {
          ctx.db.globalLeaderboard.player_name.update({
            ...existing,
            wins:          existing.wins + (isWinner ? 1 : 0),
            games_played:  existing.games_played + 1,
            best_score:    Math.max(existing.best_score, pl.total_score),
            updated_at_us: nowUs,
          });
        }
      }
    } else {
      startRound(ctx, roomCode, rm);
    }
  }
);

export const playAgain = spacetimedb.reducer(
  { roomCode: t.string() },
  (ctx, { roomCode }) => {
    const rm = ctx.db.room.code.find(roomCode);
    if (!rm) return;
    if (!rm.host_identity.equals(ctx.sender)) return;

    // Reset room
    ctx.db.room.code.update({
      ...rm,
      phase: 'lobby',
      current_round: 0,
      current_image_id: '',
      round_start_us: 0n,
      used_image_ids: '[]',
      countdown_value: 3,
    });

    // Reset all players and their powerups
    for (const pl of [...ctx.db.player.by_room.filter(roomCode)]) {
      ctx.db.player.identity.update({ ...pl, is_ready: false, total_score: 0, round_scores: '[]' });
      const pp = ctx.db.playerPowerup.identity.find(pl.identity);
      if (pp) {
        ctx.db.playerPowerup.identity.update({
          ...pp, round: 0, powerup_id: '', is_used: false,
          has_shield: false, has_double_points: false, token_drain_amount: 0,
          is_frozen: false, frozen_until_ms: 0n, hint_keywords: '[]', revealed_category: '',
        });
      }
    }

    // Delete all submissions for this room
    for (const sub of [...ctx.db.submission.by_room.filter(roomCode)]) {
      ctx.db.submission.id.delete(sub.id);
    }

    // Delete all round results for this room
    for (const result of [...ctx.db.roundResult.by_room.filter(roomCode)]) {
      ctx.db.roundResult.id.delete(result.id);
    }
  }
);

// ─── Scheduled Reducers ───────────────────────────────────────────────────────

export const handleCountdownTick = spacetimedb.reducer(
  { timer: countdownTimer.rowType },
  (ctx, { timer }) => {
    const rm = ctx.db.room.code.find(timer.room_code);
    if (!rm || rm.phase !== 'countdown') return;
    ctx.db.room.code.update({ ...rm, countdown_value: timer.tick_value });
  }
);

export const handleRoundStart = spacetimedb.reducer(
  { timer: roundStartTimer.rowType },
  (ctx, { timer }) => {
    const rm = ctx.db.room.code.find(timer.room_code);
    if (!rm || rm.phase !== 'countdown' || rm.current_round !== timer.round) return;
    ctx.db.room.code.update({
      ...rm,
      phase: 'playing',
      round_start_us: ctx.timestamp.microsSinceUnixEpoch,
    });
  }
);

export const handleRoundEnd = spacetimedb.reducer(
  { timer: roundEndTimer.rowType },
  (ctx, { timer }) => {
    const rm = ctx.db.room.code.find(timer.room_code);
    if (!rm || rm.phase !== 'playing' || rm.current_round !== timer.round) return;

    // Insert 0-score results for players who never submitted
    const players = [...ctx.db.player.by_room.filter(timer.room_code)];
    const subs = [...ctx.db.submission.by_room_round.filter([timer.room_code, timer.round])];
    const submittedHexes = new Set(subs.map((s: any) => s.identity.toHexString()));

    for (const pl of players) {
      if (!submittedHexes.has(pl.identity.toHexString())) {
        ctx.db.roundResult.insert({
          id: 0n, identity: pl.identity, room_code: timer.room_code, round: timer.round,
          player_name: pl.name, avatar_index: pl.avatar_index,
          prompt: '', image_data: '', tokens_used: 0,
          similarity_score: 0, round_score: 0, placement: 0, reasoning: 'Did not submit',
        });
      }
    }

    ctx.db.room.code.update({ ...rm, phase: 'scoring' });
  }
);
