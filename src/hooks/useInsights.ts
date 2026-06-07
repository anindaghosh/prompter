'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStdbConnection, onStdbConnected } from '@/lib/spacetimedb';
import type { DbConnection } from '@/module_bindings';
import type { UserStatsRow, GameHistoryRow } from '@/hooks/useStats';

type PlayerInsightsRow = InstanceType<typeof DbConnection>['db']['playerInsights'] extends { iter(): Iterable<infer R> } ? R : never;

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface Insights {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}

function parseArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Subscribes to the current identity's `player_insights` row and exposes a
 * `refresh()` that asks the AI for fresh insights (built from the rows
 * `useStats` already holds) and persists them via the `saveInsights` reducer.
 */
export function useInsights({ stats, history }: { stats: UserStatsRow | null; history: GameHistoryRow[] }) {
  const [row, setRow] = useState<PlayerInsightsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStdbConnected((conn, identity) => {
      const hex = identity.toHexString();
      const rebuild = () => {
        setRow(conn.db.playerInsights.identity.find(identity) ?? null);
        setLoading(false);
      };

      conn.subscriptionBuilder()
        .onApplied(() => rebuild())
        .subscribe([`SELECT * FROM player_insights WHERE identity = '${hex}'`]);

      conn.db.playerInsights.onInsert((_ctx, r) => { if (r.identity.toHexString() === hex) rebuild(); });
      conn.db.playerInsights.onUpdate((_ctx, _old, r) => { if (r.identity.toHexString() === hex) rebuild(); });
    });
  }, []);

  const insights: Insights | null = row
    ? { strengths: parseArray(row.strengths), weaknesses: parseArray(row.weaknesses), improvements: parseArray(row.improvements) }
    : null;

  const generatedAt = row ? Number(row.generatedAt.microsSinceUnixEpoch / 1000n) : null;
  const canRefresh = generatedAt === null || Date.now() - generatedAt >= COOLDOWN_MS;

  const refresh = useCallback(async () => {
    const conn = getStdbConnection();
    if (!conn || !stats) return;
    setRefreshing(true);
    setError(null);
    try {
      const games = history.slice(0, 10).map(g => ({
        playedAt: new Date(Number(g.playedAt.microsSinceUnixEpoch / 1000n)).toISOString().slice(0, 10),
        rank: g.finalRank,
        playerCount: g.playerCount,
        totalScore: g.totalScore,
        avgSimilarity: g.avgSimilarity,
        rounds: g.roundsPlayed,
        summaries: parseRoundSummaries(g.roundSummaries),
      }));

      const payload = {
        stats: {
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          bestScore: stats.bestScore,
          avgSimilarity: stats.gamesPlayed > 0 ? Math.round(Number(stats.totalSimilarity) / stats.gamesPlayed) : 0,
          avgTokens: stats.totalRounds > 0 ? Math.round(Number(stats.totalTokens) / stats.totalRounds) : 0,
        },
        games,
      };

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to generate insights.');
      }
      const data = (await res.json()) as Insights;

      await conn.reducers.saveInsights({
        strengths: JSON.stringify(data.strengths),
        weaknesses: JSON.stringify(data.weaknesses),
        improvements: JSON.stringify(data.improvements),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate insights.');
    } finally {
      setRefreshing(false);
    }
  }, [stats, history]);

  return { insights, generatedAt, loading, refreshing, error, canRefresh, refresh };
}

interface RoundSummary { s: number; t: number; tip: string; b: string }
function parseRoundSummaries(json: string): RoundSummary[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
