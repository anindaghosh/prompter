'use client';

import { useState } from 'react';
import { AVATARS } from '@/hooks/useGameSocket';

interface ProfileFormProps {
  initialName?: string;
  initialAvatarId?: number;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (displayName: string, avatarId: number) => Promise<void>;
  /** Shown after a successful submit (e.g. "Saved!"). Cleared on next edit. */
  successMessage?: string;
}

const NAME_MIN = 3;
const NAME_MAX = 20;

export function ProfileForm({
  initialName = '',
  initialAvatarId = 0,
  submitLabel,
  submittingLabel,
  onSubmit,
  successMessage,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const trimmed = name.trim();
  const valid = trimmed.length >= NAME_MIN && trimmed.length <= NAME_MAX;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    setDone(false);
    try {
      await onSubmit(trimmed, avatarId);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <label style={labelStyle}>Display Name</label>
      <input
        className="input"
        type="text"
        placeholder="3–20 characters"
        value={name}
        maxLength={NAME_MAX}
        autoFocus
        onChange={e => { setName(e.target.value); setError(null); setDone(false); }}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
      />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.55, margin: '6px 2px 18px' }}>
        {trimmed.length}/{NAME_MAX}
        {trimmed.length > 0 && !valid ? ' — must be 3–20 characters' : ''}
      </p>

      <label style={labelStyle}>Avatar</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
        {AVATARS.map((emoji, id) => (
          <button
            key={id}
            type="button"
            onClick={() => { setAvatarId(id); setDone(false); }}
            aria-label={`Avatar ${id + 1}`}
            style={{
              fontSize: 26,
              padding: '8px 0',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: avatarId === id ? 'var(--white)' : 'var(--track)',
              border: avatarId === id ? 'var(--border)' : '2px solid transparent',
              boxShadow: avatarId === id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 120ms ease',
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--coral)', border: 'var(--border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--white)' }}>
          {error}
        </div>
      )}
      {done && successMessage && !error && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--track)', border: 'var(--border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>
          {successMessage}
        </div>
      )}

      <button className="btn btn-primary" onClick={handleSubmit} disabled={!valid || submitting} style={{ width: '100%' }}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
