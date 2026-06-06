'use client';

import { DbConnection } from '@/module_bindings';
import type { Identity } from 'spacetimedb';

type Conn = InstanceType<typeof DbConnection>;
type ConnectedFn = (conn: Conn, identity: Identity) => void;

let _conn: Conn | null = null;
let _identity: Identity | null = null;
const _pendingCallbacks: ConnectedFn[] = [];

/**
 * Build the SpacetimeDB connection using an OIDC id_token (from SpacetimeAuth).
 * Idempotent: returns the existing connection if one is already established/connecting.
 * The auth bridge owns this lifecycle — call it once the user is authenticated.
 */
export function connectStdb(idToken: string): Conn {
  if (_conn) return _conn;

  const uri = process.env.NEXT_PUBLIC_SPACETIMEDB_URL ?? 'wss://maincloud.spacetimedb.com';

  _conn = DbConnection.builder()
    .withUri(uri)
    .withDatabaseName(process.env.NEXT_PUBLIC_SPACETIMEDB_MODULE ?? 'prompter-hack')
    .withToken(idToken)
    .onConnect((_ctx: Conn, identity: Identity) => {
      _identity = identity;
      _pendingCallbacks.splice(0).forEach(fn => fn(_conn!, identity));
    })
    .onDisconnect(() => {
      _conn = null;
      _identity = null;
    })
    .build();

  return _conn;
}

/** Tear down the connection (on logout). Safe to call when not connected. */
export function disconnectStdb(): void {
  _conn?.disconnect();
  _conn = null;
  _identity = null;
}

/** The current connection, or null if not yet connected (auth pending). */
export function getStdbConnection(): Conn | null {
  return _conn;
}

/** Fires immediately if already connected; otherwise defers until connection. */
export function onStdbConnected(fn: ConnectedFn): void {
  if (_identity && _conn) {
    fn(_conn, _identity);
  } else {
    _pendingCallbacks.push(fn);
  }
}

export function getMyIdentity(): Identity | null {
  return _identity;
}
