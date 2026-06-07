'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

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
  const [cursorPos, setCursorPos] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncCursor = useCallback(() => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart ?? 0);
    }
  }, []);

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
    syncCursor();
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
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => { setPrompt(e.target.value); syncCursor(); }}
              onKeyDown={handleKeyDown}
              onKeyUp={syncCursor}
              onClick={syncCursor}
              onSelect={syncCursor}
              onFocus={() => { setIsFocused(true); syncCursor(); }}
              onBlur={() => setIsFocused(false)}
              disabled={disabled || generating}
              rows={5}
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: 'transparent',
                caretColor: 'transparent',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                lineHeight: 1.55,
                padding: 0,
                cursor: disabled || generating ? 'not-allowed' : 'text',
              }}
            />
            {/* Mirror overlay — renders text + custom block cursor */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                lineHeight: 1.55,
                color: 'var(--paper)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                padding: 0,
                zIndex: 0,
              }}
            >
              {prompt.length === 0 && !isFocused ? (
                <span style={{ opacity: 0.38 }}>
                  describe the image you see... be precise but budget your tokens wisely.
                </span>
              ) : (
                <>
                  {prompt.slice(0, cursorPos)}
                  {isFocused && !(disabled || generating) && (
                    <span className="po-cursor on-dark" />
                  )}
                  {prompt.slice(cursorPos)}
                </>
              )}
            </div>
          </div>
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
