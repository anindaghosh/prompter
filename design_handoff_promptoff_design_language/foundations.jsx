/* Prompt-Off — Foundations board content (no DCArtboard wrappers) */

function Swatch({ name, hexv, bg, fg, sub }) {
  return (
    <div style={{ border: '2px solid var(--ink)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
      <div style={{ background: bg, height: 76 }} />
      <div style={{ padding: '8px 10px', background: 'var(--white)', borderTop: '2px solid var(--ink)' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13 }}>{name}</div>
        <div className="po-mono" style={{ fontSize: 11, opacity: 0.6 }}>{hexv}{sub ? ' · ' + sub : ''}</div>
      </div>
    </div>
  );
}

function LogoBoard() {
  return (
    <div className="po" style={{ padding: 30 }}>
      <div className="po-kicker">Brand · wordmark</div>
      <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
        {/* primary lockup with long cast shadow, on acid like the source */}
        <div style={{ background: 'var(--acid)', border: '2px solid var(--ink)', borderRadius: 'var(--r-lg)', padding: '40px 46px', boxShadow: 'var(--sh)' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'baseline', gap: '0.18em',
            fontFamily: 'var(--display)', fontWeight: 900, fontSize: 52, letterSpacing: '-0.04em',
            color: 'var(--ink)', textShadow: '7px 8px 0 rgba(14,14,8,0.22)',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 40 }}>&gt;_</span>Prompt<span style={{ opacity: 0.5 }}>-</span>Off
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="po-wordmark" style={{ fontSize: 26 }}><span className="seg-prompt">&gt;_</span>Prompt-Off</span>
          <span className="po-wordmark" style={{ fontSize: 26, background: 'var(--ink)', color: 'var(--acid)' }}><span className="seg-prompt" style={{ color: 'var(--acid)' }}>&gt;_</span>Prompt-Off</span>
          {/* compact app mark */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'var(--acid)', border: '2px solid var(--ink)', borderRadius: 'var(--r)', boxShadow: 'var(--sh-xs)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 24 }}>&gt;_</span>
            <span className="po-mono" style={{ fontSize: 12, opacity: 0.6, maxWidth: 160 }}>app icon — the prompt caret, the one element that always survives</span>
          </div>
        </div>
      </div>
      <p className="po-mono" style={{ fontSize: 12, opacity: 0.6, marginTop: 22, maxWidth: 560 }}>// the <b>&gt;_</b> terminal caret is the heart of the mark. heavy squared display, acid plate, hard offset shadow carried over from the old system — sharper corners, no candy.</p>
    </div>
  );
}

function ColorBoard() {
  return (
    <div className="po" style={{ padding: 30 }}>
      <div className="po-kicker">Palette · disciplined</div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <Swatch name="Paper" hexv="#F5F4ED" bg="var(--paper)" sub="base" />
        <Swatch name="Ink" hexv="#0E0E08" bg="var(--ink)" sub="text/border" />
        <Swatch name="Acid" hexv="#B8EA38" bg="var(--acid)" sub="the one accent" />
        <Swatch name="Terminal" hexv="#15150D" bg="var(--ink-2)" sub="dark panel" />
      </div>
      <div className="po-kicker" style={{ marginTop: 22 }}>Functional signals</div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <Swatch name="Go" hexv="#B8EA38" bg="var(--go)" sub="safe" />
        <Swatch name="Warn" hexv="#FF9F1C" bg="var(--warn)" sub="caution" />
        <Swatch name="Danger" hexv="#FF4D3D" bg="var(--danger)" sub="depleted" />
        <Swatch name="Info" hexv="#6CC4FF" bg="var(--info)" sub="live dot" />
      </div>
      <p className="po-mono" style={{ fontSize: 12, opacity: 0.6, marginTop: 20, maxWidth: 560 }}>// from 7 pastels down to two-plus-signals. acid is hero + "go". everything structural is ink on paper.</p>
    </div>
  );
}

function TypeBoard() {
  return (
    <div className="po" style={{ padding: 30 }}>
      <div className="po-kicker">Type system · 3 families</div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ borderBottom: '1.5px solid var(--line)', paddingBottom: 16 }}>
          <div className="po-mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 6 }}>ARCHIVO — display / titles / scores</div>
          <div className="po-display" style={{ fontSize: 46 }}>EVERY TOKEN COUNTS</div>
          <div className="po-display" style={{ fontSize: 64, color: 'var(--ink)', marginTop: 4 }}>87<span style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700 }}>%</span></div>
        </div>
        <div style={{ borderBottom: '1.5px solid var(--line)', paddingBottom: 16 }}>
          <div className="po-mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 6 }}>SPACE GROTESK — body / buttons / labels</div>
          <div style={{ fontFamily: 'var(--body)', fontSize: 17, fontWeight: 500, maxWidth: 520, lineHeight: 1.5 }}>Race to recreate a reference image with the tightest prompt you can write. Describe the lighting, or trust the model to infer it — every word spends from your budget.</div>
        </div>
        <div>
          <div className="po-mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 6 }}>SPACE MONO — tokens / codes / terminal</div>
          <div className="po-mono" style={{ fontSize: 16 }}>&gt;_ TOKENS 092/150 &nbsp;·&nbsp; ROOM ABC123 &nbsp;·&nbsp; 01:48</div>
        </div>
      </div>
    </div>
  );
}

function ShadowBoard() {
  return (
    <div className="po" style={{ padding: 30 }}>
      <div className="po-kicker">Depth & shape · the bridge</div>
      <div style={{ marginTop: 20, display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[['xs','--sh-xs'],['sm','--sh-sm'],['md','--sh'],['lg','--sh-lg'],['xl','--sh-xl']].map(([k,v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ width: 66, height: 66, background: 'var(--white)', border: '2px solid var(--ink)', borderRadius: 'var(--r)', boxShadow: `var(${v})` }} />
            <div className="po-mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 12 }}>{k}</div>
          </div>
        ))}
      </div>
      <div className="po-kicker" style={{ marginTop: 28 }}>Radii — sharpened</div>
      <div style={{ marginTop: 14, display: 'flex', gap: 18, alignItems: 'flex-end' }}>
        {[['3','--r-xs'],['5','--r-sm'],['8','--r'],['12','--r-lg']].map(([k,v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ width: 58, height: 58, background: 'var(--acid)', border: '2px solid var(--ink)', borderRadius: `var(${v})` }} />
            <div className="po-mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 10 }}>{k}px</div>
          </div>
        ))}
      </div>
      <p className="po-mono" style={{ fontSize: 12, opacity: 0.6, marginTop: 22, maxWidth: 520 }}>// keep the hard zero-blur shadow — it's the one thing we carry forward. old radii (20–28px) drop to 3–12px so the UI reads sharper and more arcade.</p>
    </div>
  );
}

function ComponentsBoard() {
  return (
    <div className="po" style={{ padding: 30 }}>
      <div className="po-kicker">Components</div>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="po-btn po-btn--acid">GENERATE <span className="ar">▸</span></button>
            <button className="po-btn po-btn--ink">PLAY <span className="ar">▸</span></button>
            <button className="po-btn po-btn--ghost">BACK</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="po-chip po-chip--acid">EASY</span>
            <span className="po-chip po-chip--warn">MEDIUM</span>
            <span className="po-chip po-chip--danger">HARD</span>
            <span className="po-chip"><span className="po-dot" style={{ background: 'var(--go)' }} />ONLINE</span>
          </div>
          <div className="po-nav">
            <span className="po-nav-item active">&gt;_ PLAY</span>
            <span className="po-nav-item">▦ RANK</span>
            <span className="po-nav-item">◆ STATS</span>
          </div>
          <div className="po-row you">
            <span className="po-avatar">K</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>You</div><div className="po-mono" style={{ fontSize: 11, opacity: 0.7 }}>rank 02</div></div>
            <span className="po-mono" style={{ fontWeight: 700 }}>1,420</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* token meter */}
          <div className="po-meter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
              <span className="po-kicker" style={{ opacity: 1 }}>Tokens left</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22 }}>092<span style={{ fontSize: 13, opacity: 0.5 }}>/150</span></span>
            </div>
            <div className="po-meter-track"><div className="po-meter-fill" style={{ width: '61%' }} /></div>
          </div>
          {/* terminal input */}
          <div className="po-terminal">
            <span className="tok">&gt;_</span> neon tokyo street at night, rain, <br />reflections, cinematic<span className="po-cursor on-dark" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="po-input" placeholder="enter room code…" defaultValue="ABC123" style={{ fontFamily: 'var(--mono)', letterSpacing: '0.12em', fontWeight: 700 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LogoBoard, ColorBoard, TypeBoard, ShadowBoard, ComponentsBoard });
