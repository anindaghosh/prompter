'use client';

import { useEffect, useState } from 'react';
import { getStdbConnection, onStdbConnected } from '@/lib/spacetimedb';
import type { UserProfile } from '@/module_bindings/types';

export interface UseProfile {
  profile: UserProfile | null;
  /** True until the user_profile subscription has applied at least once. */
  loading: boolean;
  createProfile: (displayName: string, avatarId: number) => Promise<void>;
  updateProfile: (displayName: string, avatarId: number) => Promise<void>;
}

/**
 * Subscribes to the current identity's row in `user_profile`.
 * `loading` distinguishes "still resolving" from "no profile yet" (profile === null
 * once loaded) so callers can avoid flashing the creation modal on return visits.
 */
export function useProfile(): UseProfile {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    onStdbConnected((conn, identity) => {
      if (cancelled) return;
      const hex = identity.toHexString();
      const refresh = () => {
        const row = conn.db.userProfile.identity.find(identity) ?? null;
        if (!cancelled) setProfile(row);
      };

      conn.subscriptionBuilder()
        .onApplied(() => {
          refresh();
          if (!cancelled) setLoading(false);
        })
        .subscribe([`SELECT * FROM user_profile WHERE identity = '${hex}'`]);

      conn.db.userProfile.onInsert((_ctx, row) => {
        if (row.identity.toHexString() === hex) refresh();
      });
      conn.db.userProfile.onUpdate((_ctx, _old, row) => {
        if (row.identity.toHexString() === hex) refresh();
      });
    });

    return () => { cancelled = true; };
  }, []);

  const createProfile = (displayName: string, avatarId: number): Promise<void> => {
    const conn = getStdbConnection();
    if (!conn) return Promise.reject(new Error('Not connected'));
    return conn.reducers.createProfile({ displayName, avatarId });
  };

  const updateProfile = (displayName: string, avatarId: number): Promise<void> => {
    const conn = getStdbConnection();
    if (!conn) return Promise.reject(new Error('Not connected'));
    return conn.reducers.updateProfile({ displayName, avatarId });
  };

  return { profile, loading, createProfile, updateProfile };
}
