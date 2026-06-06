'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';

/**
 * OIDC redirect target. react-oidc-context processes the auth code automatically;
 * once the session resolves we send the player back to the landing page.
 */
export default function CallbackPage() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading) {
      router.replace('/');
    }
  }, [auth.isLoading, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, opacity: 0.7 }}>
        {auth.error ? `Sign-in failed: ${auth.error.message}` : 'Signing you in…'}
      </p>
    </div>
  );
}
