'use client';

import { ProfileForm } from './ProfileForm';

interface ProfileModalProps {
  onCreate?: (displayName: string, avatarId: number) => Promise<void>;
  onUpdate?: (displayName: string, avatarId: number) => Promise<void>;
  onClose?: () => void;
  initialName?: string;
  initialAvatarId?: number;
}

export function ProfileModal({ onCreate, onUpdate, onClose, initialName, initialAvatarId }: ProfileModalProps) {
  const isEdit = !!onUpdate;
  const handleSubmit = isEdit ? onUpdate! : onCreate!;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(14,14,8,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={isEdit ? onClose : undefined}
    >
      <div
        className="po-card"
        style={{ width: '100%', maxWidth: 420, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {isEdit && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 16, lineHeight: 1,
              opacity: 0.45, padding: 4, color: 'var(--black)',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        )}
        <div className="po-kicker" style={{ marginBottom: 6 }}>Profile</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--black)' }}>
          {isEdit ? 'Edit profile' : 'Create your profile'}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.65, marginBottom: 20, color: 'var(--black)' }}>
          {isEdit ? 'Update your display name or avatar.' : 'Pick a display name and avatar. This is how other players will see you.'}
        </p>
        <ProfileForm
          submitLabel={isEdit ? 'Save Changes' : 'Create Profile'}
          submittingLabel={isEdit ? 'Saving…' : 'Creating…'}
          onSubmit={handleSubmit}
          successMessage={isEdit ? 'Saved!' : undefined}
          initialName={initialName}
          initialAvatarId={initialAvatarId}
        />
      </div>
    </div>
  );
}
