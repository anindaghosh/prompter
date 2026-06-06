'use client';

import { AuthProvider, type AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import { AuthBridge } from '@/components/AuthBridge';

const isBrowser = typeof window !== 'undefined';

const oidcConfig: AuthProviderProps = {
  authority: process.env.NEXT_PUBLIC_SPACETIMEAUTH_AUTHORITY ?? 'https://auth.spacetimedb.com/oidc',
  client_id: process.env.NEXT_PUBLIC_SPACETIMEAUTH_CLIENT_ID ?? '',
  redirect_uri: isBrowser ? `${window.location.origin}/callback` : '',
  post_logout_redirect_uri: isBrowser ? window.location.origin : '',
  scope: 'openid profile email',
  response_type: 'code',
  automaticSilentRenew: true,
  // Persist the session in localStorage so it survives reloads / new sessions.
  userStore: isBrowser ? new WebStorageStateStore({ store: window.localStorage }) : undefined,
  // Strip the OAuth ?code/&state params from the URL after the redirect completes.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider {...oidcConfig}>
      <AuthBridge />
      {children}
    </AuthProvider>
  );
}
