'use client';

// ── Types used across game components ─────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  avatar: string;
}

export interface ReferenceImage {
  id: string;
  url: string;
  category: string;
  difficulty: string;
  title: string;
}

export interface ScoreBreakdown {
  composition: number;
  colorPalette: number;
  subjectContent: number;
  styleAtmosphere: number;
}

export interface PlayerResult {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  avatar?: string;
  prompt: string;
  imageData: string | null;
  tokensUsed: number;
  submissionTimeMs?: number;
  similarityScore: number;
  scoreBreakdown?: ScoreBreakdown;
  roundScore?: number;
  totalScore?: number;
  reasoning: string;
  rank?: number;
  hadDoublePoints?: boolean;
  simScore?: number;
  effScore?: number;
  speedScore?: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  avatar?: string;
  totalScore: number;
  rank: number;
  roundScores?: number[];
  roundDoublePoints?: boolean[];
}

export type GamePhase =
  | 'disconnected'
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'scoring'
  | 'reveal'
  | 'leaderboard';

export type PowerupId =
  | 'TOKEN_DRAIN'
  | 'FREEZE'
  | 'TOKEN_SHIELD'
  | 'HINT'
  | 'DOUBLE_POINTS'
  | 'CATEGORY';

export interface PowerupDefinition {
  id: PowerupId;
  name: string;
  type: 'offensive' | 'defensive' | 'utility';
  emoji: string;
  description: string;
  requiresTarget: boolean;
}

export const POWERUP_DEFS: Record<PowerupId, PowerupDefinition> = {
  TOKEN_DRAIN:   { id: 'TOKEN_DRAIN',   name: 'Token Drain',   type: 'offensive', emoji: '⚡', description: "Cut opponent's token budget by 20", requiresTarget: true },
  FREEZE:        { id: 'FREEZE',        name: 'Freeze',        type: 'offensive', emoji: '❄️',  description: "Pause a player's timer for 10 seconds", requiresTarget: true },
  TOKEN_SHIELD:  { id: 'TOKEN_SHIELD',  name: 'Token Shield',  type: 'defensive', emoji: '🛡️', description: 'Block drain attacks for one round', requiresTarget: false },
  HINT:          { id: 'HINT',          name: 'Hint',          type: 'utility',   emoji: '💡', description: 'Reveal 2 AI keyword suggestions', requiresTarget: false },
  DOUBLE_POINTS: { id: 'DOUBLE_POINTS', name: 'Double Points', type: 'utility',   emoji: '⭐', description: '2× your score this round', requiresTarget: false },
  CATEGORY:      { id: 'CATEGORY',      name: 'Category',      type: 'utility',   emoji: '🏷️', description: 'Reveal style tag of reference image', requiresTarget: false },
};

export interface GameState {
  phase: GamePhase;
  roomCode: string | null;
  myPlayerId: string | null;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  referenceImage: ReferenceImage | null;
  tokenBudget: number;
  roundDurationMs: number;
  timeRemaining: number;
  countdownValue: number;
  submittedThisRound: boolean;
  waitingForPlayers: number;
  results: PlayerResult[];
  leaderboard: LeaderboardEntry[];
  error: string | null;
  isConnected: boolean;
  myPowerup: PowerupId | null;
  powerupUsed: boolean;
  isFrozen: boolean;
  frozenSecondsLeft: number;
  hasShield: boolean;
  hasDoublePoints: boolean;
  hintKeywords: string[];
  revealedCategory: string | null;
  powerupNotification: { message: string; type: 'attack' | 'defend' | 'info' } | null;
  tokenDrainAmount: number;
}

export const DEFAULT_GAME_STATE: GameState = {
  phase: 'disconnected',
  roomCode: null,
  myPlayerId: null,
  players: [],
  currentRound: 0,
  totalRounds: 3,
  referenceImage: null,
  tokenBudget: 120,
  roundDurationMs: 90000,
  timeRemaining: 90,
  countdownValue: 3,
  submittedThisRound: false,
  waitingForPlayers: 0,
  results: [],
  leaderboard: [],
  error: null,
  isConnected: false,
  myPowerup: null,
  powerupUsed: false,
  isFrozen: false,
  frozenSecondsLeft: 0,
  hasShield: false,
  hasDoublePoints: false,
  hintKeywords: [],
  revealedCategory: null,
  powerupNotification: null,
  tokenDrainAmount: 0,
};
