'use client';

import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { connectStdb, disconnectStdb } from '@/lib/spacetimedb';

/**
 * Bridges the OIDC auth session (react-oidc-context) to the SpacetimeDB connection.
 * - On authentication, opens the connection using the OIDC id_token.
 * - On sign-out, tears the connection down.
 * The id_token rotates on silent renew; connectStdb is idempotent so re-running is a no-op.
 */
export function AuthBridge() {
  const auth = useAuth();
  const idToken = auth.user?.id_token;

  useEffect(() => {
    if (auth.isAuthenticated && idToken) {
      connectStdb(idToken);
    } else if (!auth.isLoading && !auth.isAuthenticated) {
      disconnectStdb();
    }
  }, [auth.isAuthenticated, auth.isLoading, idToken]);

  return null;
}
