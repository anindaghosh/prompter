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
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={isEdit ? onClose : undefined}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 420, background: 'var(--white)', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {isEdit && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, opacity: 0.45, padding: 4,
              fontFamily: 'var(--font-body)',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        )}
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 6, letterSpacing: '-0.02em' }}>
          {isEdit ? 'Edit profile' : 'Create your profile'}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.65, marginBottom: 20 }}>
          {isEdit ? 'Update your display name or avatar.' : 'Pick a display name and avatar. This is how other players will see you.'}
        </p>
        <ProfileForm
          submitLabel={isEdit ? 'Save Changes ▶' : 'Create Profile ▶'}
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
