'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';
import { useProfile } from '@/hooks/useProfile';
import { disconnectStdb } from '@/lib/spacetimedb';
import { ProfileForm } from '@/components/ProfileForm';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) router.replace('/');
  }, [auth.isLoading, auth.isAuthenticated, router]);

  const handleLogout = async () => {
    disconnectStdb();
    await auth.signoutRedirect();
  };

  const busy = auth.isLoading || loading;

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh' }}>
      <div className="page-content" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <button
            className="btn btn-ghost btn-sm btn-auto"
            onClick={handleLogout}
            style={{ color: 'var(--danger)' }}
          >
            Log out
          </button>
        </div>

        <div className="po-kicker" style={{ marginBottom: 6 }}>Account</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, letterSpacing: '-0.02em', marginBottom: 24, color: 'var(--black)' }}>
          Profile
        </h1>

        {busy ? (
          <p className="po-mono" style={{ opacity: 0.6, color: 'var(--black)' }}>Loading…</p>
        ) : !profile ? (
          <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6, color: 'var(--black)' }}>
            No profile yet — head back home to create one.
          </p>
        ) : (
          <div className="po-card">
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
      <BottomNav />
    </div>
  );
}
