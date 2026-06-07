'use client';

import { useState, useRef, useEffect } from 'react';

const TOKEN_BUDGET = 120;

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function getBarState(remaining: number, budget: number): 'safe' | 'warning' | 'danger' {
  const pct = remaining / budget;
  if (pct > 0.5) return 'safe';
  if (pct > 0.2) return 'warning';
  return 'danger';
}

interface PromptEditorProps {
  budget?: number;
  onSubmit: (prompt: string, tokensUsed: number) => void;
  disabled?: boolean;
  generating?: boolean;
}

export default function PromptEditor({
  budget = TOKEN_BUDGET,
  onSubmit,
  disabled = false,
  generating = false,
}: PromptEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tokensUsed = countTokens(prompt);
  const tokensRemaining = budget - tokensUsed;
  const barState = getBarState(tokensRemaining, budget);
  const barPct = Math.max(0, Math.min(100, (tokensRemaining / budget) * 100));
  const overBudget = tokensUsed > budget;

  const meterClass = barState === 'safe' ? '' : barState === 'warning' ? 'warn' : 'danger';

  useEffect(() => {
    if (overBudget && !isShaking) {
      setIsShaking(true);
      const t = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(t);
    }
  }, [overBudget, isShaking]);

  const handleSubmit = () => {
    if (!prompt.trim() || overBudget || disabled || generating) return;
    onSubmit(prompt.trim(), tokensUsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Token counter + meter */}
      <div className="po-meter">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="po-kicker">Token Budget</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: '-0.02em',
            color: barState === 'danger' ? 'var(--danger)' : barState === 'warning' ? 'var(--warn)' : 'var(--black)',
            transition: 'color 0.3s ease',
            animation: isShaking ? 'shake 0.5s ease forwards' : undefined,
          }}>
            {String(tokensRemaining).padStart(3, '0')}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 13, color: 'var(--black)', opacity: 0.45 }}>
              &nbsp;/ {budget}
            </span>
          </span>
        </div>
        <div className="po-meter-track">
          <div className={`po-meter-fill ${meterClass}`} style={{ width: `${barPct}%` }} />
        </div>
      </div>

      {/* Terminal prompt box */}
      <div
        className="po-terminal"
        style={{
          animation: isShaking ? 'shake 0.5s ease forwards' : undefined,
          borderColor: overBudget ? 'var(--danger)' : undefined,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="tok" style={{ flexShrink: 0, userSelect: 'none' }}>&gt;_</span>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="describe the image you see... be precise but budget your tokens wisely."
            disabled={disabled || generating}
            rows={5}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              lineHeight: 1.55,
              padding: 0,
              cursor: disabled || generating ? 'not-allowed' : 'text',
            }}
          />
          {!disabled && !generating && prompt.length === 0 && (
            <span className="po-cursor on-dark" />
          )}
        </div>
        {prompt.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="tok" style={{ fontSize: 13 }}>{tokensUsed} tok</span>
            {!overBudget && tokensRemaining > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.55, color: 'var(--paper)' }}>
                {tokensRemaining} to spare
              </span>
            )}
            {overBudget && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', fontWeight: 700 }}>
                over by {-tokensRemaining}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!prompt.trim() || overBudget || disabled || generating}
      >
        {generating ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InlineSpinner /> Generating...
          </span>
        ) : (
          <span>Generate <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 4 }}>▸</span></span>
        )}
      </button>

      <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.4, color: 'var(--black)' }}>
        ⌘ + Enter to submit
      </p>
    </div>
  );
}

function InlineSpinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 14,
      height: 14,
      border: '2px solid rgba(14,14,8,0.3)',
      borderTopColor: 'var(--ink)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
