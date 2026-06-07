'use client';

import { useState } from 'react';
import { AVATARS, avatarUrl } from '@/hooks/useGameSocket';

interface ProfileFormProps {
  initialName?: string;
  initialAvatarId?: number;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (displayName: string, avatarId: number) => Promise<void>;
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
      <div className="po-kicker" style={{ marginBottom: 8 }}>Display Name</div>
      <input
        className="po-input"
        type="text"
        placeholder="3–20 characters"
        value={name}
        maxLength={NAME_MAX}
        autoFocus
        onChange={e => { setName(e.target.value); setError(null); setDone(false); }}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        style={{ marginBottom: 4 }}
      />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.5, margin: '6px 2px 18px', color: 'var(--black)' }}>
        {trimmed.length}/{NAME_MAX}
        {trimmed.length > 0 && !valid ? ' — must be 3–20 characters' : ''}
      </p>

      <div className="po-kicker" style={{ marginBottom: 8 }}>Avatar</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
        {AVATARS.map((seed, id) => (
          <button
            key={id}
            type="button"
            onClick={() => { setAvatarId(id); setDone(false); }}
            aria-label={`Avatar ${id + 1}`}
            style={{
              padding: 4,
              aspectRatio: '1',
              borderRadius: 'var(--r)',
              cursor: 'pointer',
              background: avatarId === id ? 'var(--acid)' : 'var(--paper-2)',
              border: avatarId === id ? 'var(--bd)' : '2px solid transparent',
              boxShadow: avatarId === id ? 'var(--sh-xs)' : 'none',
              transform: avatarId === id ? 'translate(-1px,-1px)' : 'none',
              transition: 'all 120ms ease',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl(seed)} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--danger)', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--white)' }}>
          {error}
        </div>
      )}
      {done && successMessage && !error && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--acid)', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
          {successMessage}
        </div>
      )}

      <button className="btn btn-dark" onClick={handleSubmit} disabled={!valid || submitting} style={{ width: '100%' }}>
        {submitting ? submittingLabel : <span>{submitLabel} <span style={{ fontFamily: 'var(--font-mono)' }}>▸</span></span>}
      </button>
    </div>
  );
}
