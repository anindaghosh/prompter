'use client';

import { useEffect, useState } from 'react';
import { onStdbConnected } from '@/lib/spacetimedb';
import type { DbConnection } from '@/module_bindings';

type UserStatsRow = InstanceType<typeof DbConnection>['db']['userStats'] extends { iter(): Iterable<infer R> } ? R : never;
type GameHistoryRow = InstanceType<typeof DbConnection>['db']['gameHistory'] extends { iter(): Iterable<infer R> } ? R : never;
export type { UserStatsRow, GameHistoryRow };

export function useStats() {
  const [stats, setStats] = useState<UserStatsRow | null>(null);
  const [history, setHistory] = useState<GameHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onStdbConnected((conn, identity) => {
      const hex = identity.toHexString();

      const rebuild = () => {
        setStats(conn.db.userStats.identity.find(identity) ?? null);
        const rows = [...conn.db.gameHistory.by_identity.filter(identity)];
        rows.sort((a, b) => Number(b.playedAt.microsSinceUnixEpoch - a.playedAt.microsSinceUnixEpoch));
        setHistory(rows.slice(0, 20));
        setLoading(false);
      };

      conn.subscriptionBuilder()
        .onApplied(() => rebuild())
        .subscribe([
          `SELECT * FROM user_stats WHERE identity = '${hex}'`,
          `SELECT * FROM game_history WHERE identity = '${hex}'`,
        ]);

      conn.db.userStats.onInsert((_ctx, row) => { if (row.identity.toHexString() === hex) rebuild(); });
      conn.db.userStats.onUpdate((_ctx, _old, row) => { if (row.identity.toHexString() === hex) rebuild(); });
      conn.db.gameHistory.onInsert((_ctx, row) => { if (row.identity.toHexString() === hex) rebuild(); });
    });
  }, []);

  return { stats, history, loading };
}
