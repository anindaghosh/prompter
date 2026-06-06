'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';
import { useProfile } from '@/hooks/useProfile';
import { disconnectStdb } from '@/lib/spacetimedb';
import { ProfileForm } from '@/components/ProfileForm';

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  // Not signed in → send to landing (which hosts the sign-in screen).
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) router.replace('/');
  }, [auth.isLoading, auth.isAuthenticated, router]);

  const handleLogout = async () => {
    disconnectStdb();
    // Full federated sign-out: hits the OIDC end-session endpoint so the
    // SpacetimeAuth IdP session itself is terminated, not just the locally
    // stored tokens. Without this the IdP cookie survives and the next
    // "Sign In" silently redirects back as the same user. The browser
    // navigates to post_logout_redirect_uri (the homepage) on completion,
    // so no router.replace is needed here.
    await auth.signoutRedirect();
  };

  const busy = auth.isLoading || loading;

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh' }}>
      <div className="page-content" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/')}>← Home</button>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, letterSpacing: '-0.02em', marginBottom: 24 }}>
          Profile
        </h1>

        {busy ? (
          <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>Loading…</p>
        ) : !profile ? (
          <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>
            No profile yet — head back home to create one.
          </p>
        ) : (
          <div className="card" style={{ background: 'var(--white)' }}>
            <ProfileForm
              initialName={profile.displayName}
              initialAvatarId={profile.avatarId}
              submitLabel="Save Changes"
              submittingLabel="Saving…"
              successMessage="Saved!"
              onSubmit={updateProfile}
            />
          </div>
        )}
      </div>
    </div>
  );
}
