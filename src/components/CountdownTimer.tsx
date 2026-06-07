'use client';

interface CountdownTimerProps {
  timeRemaining: number;
  totalSeconds: number;
}

export default function CountdownTimer({ timeRemaining, totalSeconds: _ }: CountdownTimerProps) {
  const isWarning = timeRemaining <= 30 && timeRemaining > 10;
  const isDanger  = timeRemaining <= 10;

  const numberColor = isDanger ? 'var(--danger)' : isWarning ? 'var(--warn)' : 'var(--black)';

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const display = minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')}`
    : String(seconds);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        background: 'var(--white)',
        border: isDanger ? `2px solid var(--danger)` : 'var(--bd)',
        borderRadius: 'var(--r)',
        padding: '4px 14px',
        boxShadow: isDanger ? 'var(--sh-xs)' : 'none',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 22,
          color: numberColor,
          transition: 'color 0.4s ease',
        }}>
          {display}
        </span>
      </div>
      <span className="po-kicker" style={{ opacity: 0.5 }}>
        {minutes > 0 ? 'remaining' : 'seconds'}
      </span>
    </div>
  );
}
