/* Prompt-Off — six app screens in the new language. 360×780 frames. */

function Status({ label }) {
  return (
    <div className="po-statusbar">
      <span>9:41</span>
      <span style={{ opacity: 0.5 }}>{label}</span>
      <span>▮▮▮ 100</span>
    </div>
  );
}

function Mark({ size = 18 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3em', fontFamily: 'var(--display)', fontWeight: 900, fontSize: size, letterSpacing: '-0.03em' }}>
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--acid)', WebkitTextStroke: '0', background: 'var(--ink)', borderRadius: 3, padding: '0 3px' }}>&gt;_</span>
      Prompt-Off
    </span>
  );
}

/* ───────────────────────── 1 · LANDING ───────────────────────── */
function LandingScreen() {
  return (
    <div className="po-screen">
      <Status label="home" />
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span className="po-kicker">// prompt arena</span>
          <span style={{ width: 30, height: 30, border: 'var(--bd1)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13 }}>⏻</span>
        </div>

        {/* hero wordmark */}
        <div style={{ marginTop: 22, marginBottom: 8 }}>
          <div style={{ background: 'var(--acid)', border: 'var(--bd)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-lg)', padding: '22px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.14em', fontFamily: 'var(--display)', fontWeight: 900, fontSize: 38, letterSpacing: '-0.04em', color: 'var(--ink)', textShadow: '5px 6px 0 rgba(14,14,8,0.22)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 30 }}>&gt;_</span>Prompt-Off
            </div>
          </div>
          <p className="po-mono" style={{ fontSize: 12.5, opacity: 0.62, marginTop: 12, lineHeight: 1.5 }}>// race to recreate the image.<br />every token you spend costs you.</p>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 0, border: 'var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden', marginTop: 16 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '11px 0', background: 'var(--ink)', color: 'var(--acid)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13 }}>CREATE</div>
          <div style={{ flex: 1, textAlign: 'center', padding: '11px 0', background: 'var(--white)', borderLeft: 'var(--bd)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, opacity: 0.55 }}>JOIN</div>
        </div>

        {/* rounds */}
        <div style={{ marginTop: 16 }}>
          <div className="po-kicker" style={{ marginBottom: 9 }}>Rounds</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,3,5].map(n => (
              <div key={n} style={{ flex: 1, textAlign: 'center', padding: '13px 0', border: 'var(--bd)', borderRadius: 'var(--r)', fontFamily: 'var(--display)', fontWeight: 900, fontSize: 18, background: n===3?'var(--acid)':'var(--white)', boxShadow: n===3?'var(--sh-xs)':'none' }}>{n}</div>
            ))}
          </div>
        </div>

        <button className="po-btn po-btn--ink po-btn--block po-btn--lg" style={{ marginTop: 16 }}>CREATE ROOM <span className="ar">▸</span></button>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="po-btn po-btn--ghost" style={{ flex: 1, fontSize: 12.5, padding: '11px 8px' }}>▦ LEADERBOARD</button>
          <button className="po-btn po-btn--ghost" style={{ flex: 1, fontSize: 12.5, padding: '11px 8px' }}>◆ MY STATS</button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 18 }}>
          <div className="po-kicker" style={{ marginBottom: 8 }}>How to play</div>
          {['see the target image','write a prompt — mind the budget','generate · score on match + speed'].map((t,i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0' }}>
              <span className="po-mono" style={{ fontWeight: 700, color: 'var(--ink)', background: 'var(--acid)', border: '1.5px solid var(--ink)', borderRadius: 3, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{i+1}</span>
              <span style={{ fontFamily: 'var(--body)', fontSize: 13 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 2 · LOBBY ───────────────────────── */
function LobbyScreen() {
  const players = [['K','kenji',true,true],['M','mira',true,false],['R','rae',false,false],['—','waiting…',false,false]];
  return (
    <div className="po-screen">
      <Status label="lobby" />
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <span className="po-mono" style={{ fontSize: 12 }}>◂ back</span>
        </div>

        <div className="po-panel" style={{ marginTop: 14, textAlign: 'center' }}>
          <div className="po-kicker">Room code</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 46, letterSpacing: '0.08em', color: 'var(--acid)', marginTop: 6 }}>ABC123</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="po-btn po-btn--acid" style={{ flex: 1, padding: '11px 0', fontSize: 13 }}>⧉ COPY</button>
            <button className="po-btn po-btn--ghost" style={{ flex: 1, padding: '11px 0', fontSize: 13, background: 'transparent', color: 'var(--paper)', borderColor: 'var(--paper)', boxShadow: '3px 3px 0 var(--acid)' }}>⇪ SHARE</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, marginBottom: 10 }}>
          <span className="po-kicker">Players</span>
          <span className="po-mono" style={{ fontSize: 12, fontWeight: 700 }}>3/8</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {players.map(([a,n,ready,you],i) => (
            <div key={i} className={'po-row' + (you ? ' you' : '')} style={n==='waiting…'?{opacity:0.5, borderStyle:'dashed'}:{}}>
              <span className="po-avatar">{a}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{n}{you && ' (you)'}</div>
                {i===0 && <div className="po-mono" style={{ fontSize: 10.5, opacity: 0.7 }}>host</div>}
              </div>
              {n!=='waiting…' && (
                <span className="po-chip" style={ready?{background:'var(--acid)'}:{opacity:0.5}}>{ready?'▮ READY':'…'}</span>
              )}
            </div>
          ))}
        </div>

        <button className="po-btn po-btn--ink po-btn--block po-btn--lg" style={{ marginTop: 'auto' }}>START GAME <span className="ar">▸</span></button>
      </div>
    </div>
  );
}

/* ───────────────────────── 3 · GAME (hero) ───────────────────────── */
function GameScreen() {
  return (
    <div className="po-screen">
      <Status label="round 02/03" />
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span className="po-chip po-chip--ink">ROUND 02/03</span>
          <span className="po-mono" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22, color: 'var(--warn)' }}>01:48</span>
        </div>

        {/* target */}
        <div style={{ marginTop: 12, border: 'var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--sh)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><span className="po-chip po-chip--acid">▸ TARGET</span></div>
          <img src="assets/ref-neon-city.jpg" alt="target" style={{ width: '100%', height: 196, objectFit: 'cover', display: 'block' }} />
        </div>

        {/* token meter */}
        <div className="po-meter" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span className="po-kicker" style={{ opacity: 1 }}>Tokens left</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 24 }}>092<span style={{ fontSize: 13, opacity: 0.45 }}>/150</span></span>
          </div>
          <div className="po-meter-track"><div className="po-meter-fill" style={{ width: '61%' }} /></div>
        </div>

        {/* prompt terminal */}
        <div style={{ marginTop: 14 }}>
          <div className="po-kicker" style={{ marginBottom: 7 }}>Your prompt</div>
          <div className="po-terminal" style={{ minHeight: 92 }}>
            <span className="tok">&gt;_</span> neon tokyo street at night, rain reflections, cinematic teal glow<span className="po-cursor on-dark" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="po-mono" style={{ fontSize: 11.5, opacity: 0.6 }}>// this prompt = 58 tok</span>
            <span className="po-mono po-acid-text" style={{ fontSize: 11.5, fontWeight: 700 }}>34 to spare</span>
          </div>
        </div>

        <button className="po-btn po-btn--acid po-btn--block po-btn--lg" style={{ marginTop: 'auto' }}>GENERATE <span className="ar">▸</span></button>
      </div>
    </div>
  );
}

/* ───────────────────────── 4 · RESULTS ───────────────────────── */
function ResultsScreen() {
  return (
    <div className="po-screen">
      <Status label="result" />
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="po-kicker" style={{ textAlign: 'center', marginTop: 4 }}>Similarity</div>
        <div style={{ textAlign: 'center', lineHeight: 0.9, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 88, color: 'var(--ink)' }}>87</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 30 }}>%</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 2 }}><span className="po-chip po-chip--acid" style={{ fontSize: 12 }}>★ STRONG MATCH</span></div>

        {/* compare */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {[['TARGET','assets/ref-neon-city.jpg'],['YOURS','assets/ref-starry-night.jpg']].map(([t,src]) => (
            <div key={t} style={{ flex: 1 }}>
              <div className="po-mono" style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 5, opacity: 0.6 }}>{t}</div>
              <div style={{ border: 'var(--bd)', borderRadius: 'var(--r-sm)', overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
                <img src={src} alt={t} style={{ width: '100%', height: 104, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          ))}
        </div>

        {/* breakdown */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {[['MATCH','87%'],['EFFICIENCY','+24'],['SPEED','+11']].map(([k,v],i) => (
            <div key={k} className="po-card" style={{ flex: 1, padding: '12px 8px', textAlign: 'center', boxShadow: 'var(--sh-xs)' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20 }}>{v}</div>
              <div className="po-mono" style={{ fontSize: 9.5, opacity: 0.6, marginTop: 3 }}>{k}</div>
            </div>
          ))}
        </div>

        <div className="po-row you" style={{ marginTop: 16 }}>
          <span className="po-avatar">K</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>You</div><div className="po-mono" style={{ fontSize: 10.5, opacity: 0.7 }}>round winner</div></div>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20 }}>+122</span>
        </div>

        <button className="po-btn po-btn--ink po-btn--block po-btn--lg" style={{ marginTop: 'auto' }}>NEXT ROUND <span className="ar">▸</span></button>
      </div>
    </div>
  );
}

/* ───────────────────────── 5 · LEADERBOARD ───────────────────────── */
function LeaderboardScreen() {
  const rest = [['4','J','jules','1,180'],['5','S','sora','1,044'],['6','T','theo','980'],['7','A','ada','910']];
  return (
    <div className="po-screen">
      <Status label="ranking" />
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column', padding: '4px 0 18px' }}>
        <div style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="po-mono" style={{ fontSize: 12 }}>◂ back</span>
          <span className="po-kicker" style={{ marginLeft: 'auto' }}>Global · season 01</span>
        </div>

        {/* podium panel */}
        <div className="po-panel" style={{ margin: '12px 18px 0', borderRadius: 'var(--r-lg)' }}>
          {[['01','V','vex','2,310','var(--acid)'],['02','K','you','1,420',null],['03','N','nova','1,295',null]].map(([r,a,n,s,c],i) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i<2?'1.5px solid rgba(245,244,237,0.12)':'none' }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22, color: c||'var(--paper)', width: 34 }}>{r}</span>
              <span className="po-avatar" style={{ background: c?'var(--acid)':'var(--ink-2)', color: c?'var(--ink)':'var(--paper)', borderColor: 'var(--paper)' }}>{a}</span>
              <span style={{ flex: 1, fontFamily: 'var(--body)', fontWeight: 700, fontSize: 15, color: c||'var(--paper)' }}>{n}</span>
              <span className="po-mono" style={{ fontWeight: 700, color: c||'var(--paper)' }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 18px 0', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
          {rest.map(([r,a,n,s]) => (
            <div key={r} className={'po-row' + (n==='you'?' you':'')}>
              <span className="po-mono" style={{ fontWeight: 700, width: 22, opacity: 0.7 }}>{r}</span>
              <span className="po-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>{a}</span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{n}</span>
              <span className="po-mono" style={{ fontWeight: 700, fontSize: 13 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 6 · PROFILE / STATS ───────────────────────── */
function ProfileScreen() {
  const stats = [['GAMES','148'],['WIN RATE','42%'],['AVG MATCH','79%'],['BEST','98%']];
  const recent = [['ref-mountain-lake.jpg','91%','+140'],['ref-cherry-blossom.jpg','77%','+88'],['ref-greek-island.jpg','84%','+112']];
  return (
    <div className="po-screen">
      <Status label="profile" />
      <div className="po-screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <span className="po-avatar" style={{ width: 60, height: 60, fontSize: 28, borderRadius: 'var(--r)', boxShadow: 'var(--sh-xs)' }}>K</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 24 }}>kenji</div>
            <div className="po-mono" style={{ fontSize: 11.5, opacity: 0.6 }}>// prompt rank · gold tier</div>
          </div>
          <span style={{ width: 30, height: 30, border: 'var(--bd1)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⚙</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          {stats.map(([k,v],i) => (
            <div key={k} className="po-card" style={{ padding: '14px 16px', background: i===0?'var(--acid)':'var(--white)' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30 }}>{v}</div>
              <div className="po-mono" style={{ fontSize: 10.5, opacity: 0.65, marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>

        <div className="po-kicker" style={{ marginTop: 20, marginBottom: 10 }}>Recent matches</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {recent.map(([img,m,pts],i) => (
            <div key={i} className="po-row">
              <span style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: 'var(--bd1)', flexShrink: 0 }}>
                <img src={'assets/'+img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="po-mono" style={{ fontWeight: 700, fontSize: 13 }}>{m} match</div>
                <div className="po-mono" style={{ fontSize: 10.5, opacity: 0.6 }}>{pts} pts</div>
              </div>
              <span className="po-chip" style={{ background: parseInt(m)>85?'var(--acid)':'var(--white)' }}>{parseInt(m)>85?'WIN':'PLAYED'}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', paddingTop: 16 }}>
          <div className="po-nav">
            <span className="po-nav-item">&gt;_ PLAY</span>
            <span className="po-nav-item">▦ RANK</span>
            <span className="po-nav-item active">◆ STATS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LandingScreen, LobbyScreen, GameScreen, ResultsScreen, LeaderboardScreen, ProfileScreen });
