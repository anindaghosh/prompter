'use client';

import { DbConnection } from '@/module_bindings';
import type { Identity } from 'spacetimedb';

type Conn = InstanceType<typeof DbConnection>;
type ConnectedFn = (conn: Conn, identity: Identity) => void;

let _conn: Conn | null = null;
let _identity: Identity | null = null;
const _pendingCallbacks: ConnectedFn[] = [];

export function getStdbConnection(): Conn {
  if (_conn) return _conn;

  const uri = process.env.NEXT_PUBLIC_SPACETIMEDB_URL ?? 'wss://maincloud.spacetimedb.com';
  const tokenKey = `stdb_token_${uri}`;
  const savedToken =
    typeof window !== 'undefined' ? (localStorage.getItem(tokenKey) ?? undefined) : undefined;

  _conn = DbConnection.builder()
    .withUri(uri)
    .withDatabaseName(process.env.NEXT_PUBLIC_SPACETIMEDB_MODULE ?? 'prompter-hack')
    .withToken(savedToken)
    .onConnect((_ctx: Conn, identity: Identity, token: string) => {
      _identity = identity;
      if (typeof window !== 'undefined') localStorage.setItem(tokenKey, token);
      _pendingCallbacks.splice(0).forEach(fn => fn(_conn!, identity));
    })
    .build();

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
