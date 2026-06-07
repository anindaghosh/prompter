/* Prompt-Off — three treatments of the hero (game) screen to choose tone. */

function GameDark() {
  return (
    <div className="po-screen" style={{ background: 'var(--ink-2)', color: 'var(--paper)' }}>
      <div className="po-statusbar" style={{ color: 'var(--paper)' }}>
        <span>9:41</span><span style={{ opacity: 0.5 }}>round 02/03</span><span style={{ color: 'var(--acid)' }}>▮▮▮ 100</span>
      </div>
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span className="po-chip po-chip--acid">ROUND 02/03</span>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22, color: 'var(--warn)' }}>01:48</span>
        </div>
        <div style={{ marginTop: 12, border: '2px solid var(--acid)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: '4px 4px 0 var(--acid)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><span className="po-chip po-chip--acid">▸ TARGET</span></div>
          <img src="assets/ref-neon-city.jpg" alt="target" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
        </div>
        <div className="po-meter" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span className="po-kicker" style={{ opacity: 1, color: 'var(--acid)' }}>Tokens left</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 24, color: 'var(--acid)' }}>092<span style={{ fontSize: 13, opacity: 0.5, color: 'var(--paper)' }}>/150</span></span>
          </div>
          <div className="po-meter-track" style={{ background: '#0a0a06', borderColor: 'var(--paper)' }}><div className="po-meter-fill" style={{ width: '61%' }} /></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="po-kicker" style={{ marginBottom: 7, color: 'var(--acid)', opacity: 1 }}>Your prompt</div>
          <div style={{ background: '#0a0a06', border: '2px solid var(--paper)', borderRadius: 'var(--r)', fontFamily: 'var(--mono)', fontSize: 14, lineHeight: 1.55, padding: 14, minHeight: 92, color: 'var(--paper)' }}>
            <span style={{ color: 'var(--acid)' }}>&gt;_</span> neon tokyo street at night, rain reflections, cinematic teal glow<span className="po-cursor on-dark" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="po-mono" style={{ fontSize: 11.5, opacity: 0.55 }}>// this prompt = 58 tok</span>
            <span className="po-mono" style={{ fontSize: 11.5, color: 'var(--go)', fontWeight: 700 }}>34 to spare</span>
          </div>
        </div>
        <button className="po-btn po-btn--acid po-btn--block po-btn--lg" style={{ marginTop: 'auto' }}>GENERATE <span className="ar">▸</span></button>
      </div>
    </div>
  );
}

function GameAcid() {
  return (
    <div className="po-screen" style={{ background: 'var(--acid)' }}>
      <div className="po-statusbar"><span>9:41</span><span style={{ opacity: 0.5 }}>round 02/03</span><span>▮▮▮ 100</span></div>
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span className="po-chip po-chip--ink">ROUND 02/03</span>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22, color: 'var(--ink)', background: 'var(--white)', border: 'var(--bd)', borderRadius: 5, padding: '2px 8px' }}>01:48</span>
        </div>
        <div style={{ marginTop: 12, border: 'var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--sh)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><span className="po-chip po-chip--ink">▸ TARGET</span></div>
          <img src="assets/ref-neon-city.jpg" alt="target" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
        </div>
        <div className="po-meter" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span className="po-kicker" style={{ opacity: 1 }}>Tokens left</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 24 }}>092<span style={{ fontSize: 13, opacity: 0.5 }}>/150</span></span>
          </div>
          <div className="po-meter-track" style={{ background: 'var(--white)' }}><div className="po-meter-fill" style={{ width: '61%', background: 'var(--ink)' }} /></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="po-kicker" style={{ marginBottom: 7 }}>Your prompt</div>
          <div className="po-terminal" style={{ minHeight: 92 }}>
            <span className="tok">&gt;_</span> neon tokyo street at night, rain reflections, cinematic teal glow<span className="po-cursor on-dark" />
          </div>
        </div>
        <button className="po-btn po-btn--ink po-btn--block po-btn--lg" style={{ marginTop: 'auto' }}>GENERATE <span className="ar">▸</span></button>
      </div>
    </div>
  );
}

Object.assign(window, { GameDark, GameAcid });
