'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        background: accent ? 'var(--gold)' : 'var(--white)',
        padding: '14px 16px',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 600,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 22,
      }}>
        {value}
      </div>
    </div>
  );
}
