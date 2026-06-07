'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className={accent ? 'po-card card-acid' : 'po-card'}
      style={{ padding: '14px 16px' }}
    >
      <div className="po-kicker" style={{ color: accent ? 'var(--ink)' : 'var(--black)', opacity: accent ? 0.7 : 0.55, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: 22,
        letterSpacing: '-0.02em',
        color: accent ? 'var(--ink)' : 'var(--black)',
      }}>
        {value}
      </div>
    </div>
  );
}
