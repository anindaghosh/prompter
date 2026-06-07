# Handoff: Prompt-Off — New Design Language

## Overview
This package defines a **new visual design language for Prompt-Off** (formerly *Promptinary*) — the token-budgeted AI image-prompt game. It replaces the old pastel "Playful Bold" system with an **acid-lime + black "Arcade Terminal"** language derived from the new Prompt-Off logo.

The goal of the implementation work is to **re-skin the existing Next.js app** (the `src/` codebase) with this new design language: swap the design tokens and component styles in `globals.css`, and restyle the existing screens/components to match the mockups here. The app's logic, routing, SpaceTimeDB bindings, and component structure stay as-is — **this is a visual/CSS reskin, not a rewrite.**

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — prototypes showing the intended look and feel. They are **not** production code to drop in. The existing app is **Next.js + React + TypeScript** with a global stylesheet (`src/app/globals.css`) and per-screen components under `src/app/*` and `src/components/*`.

**Your task:** port the design tokens and component patterns from `promptoff.css` into the app's `globals.css`, then update the existing screen/component JSX to use the new classes and structure shown in the mockups. Use the app's established patterns (CSS custom properties, `className`, the existing component files) — do not introduce a new styling library.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and shadows are all specified below with exact values. Recreate pixel-faithfully. The HTML mockups are mobile-first at ~332–390px width (the app is mobile-first, `max-width: 420px` centered).

---

## Design Tokens

Port these into `:root` in `globals.css`, **replacing** the old palette. (Old → new mapping notes in parentheses.)

### Color
| Token | Value | Usage |
|---|---|---|
| `--paper` | `#F5F4ED` | Base background for all light screens (kept from old `--fantasy`) |
| `--paper-2` | `#ECEBE1` | Recessed surfaces, meter tracks |
| `--line` | `#E0DFD4` | Hairline dividers on paper |
| `--ink` | `#0E0E08` | Text, borders, shadows, button fills (was `--black #100F06`) |
| `--ink-2` | `#15150D` | Dark "terminal" panels (room code, prompt box) |
| `--white` | `#FFFFFF` | Card surfaces, inputs |
| `--acid` | `#B8EA38` | **The one brand accent** — sampled from the logo. Also "go/success" |
| `--acid-dim` | `#9ECB2A` | Acid pressed state / borders on acid |
| `--warn` | `#FF9F1C` | Caution (timer mid, warnings) |
| `--danger` | `#FF4D3D` | Errors, depleted token budget |
| `--info` | `#6CC4FF` | Rare: live/online dot |

> **Discipline:** the old system had 7 pastels (gold/teal/lavender/sky/pink/coral/orange). The new system is **acid + ink on paper, plus a tight functional signal set** (warn/danger/info). Do not reintroduce the pastels.

### Shadows — hard offset, ZERO blur (the one element carried over from the old system)
```css
--sh-xs: 2px 2px 0 var(--ink);
--sh-sm: 3px 3px 0 var(--ink);
--sh:    4px 4px 0 var(--ink);
--sh-lg: 6px 6px 0 var(--ink);
--sh-xl: 10px 10px 0 var(--ink);   /* logo-style long cast, hero only */
--sh-acid: 4px 4px 0 var(--acid);  /* used on dark surfaces */
```
Never use blurred shadows.

### Radius — sharpened vs. old system (old was 12–28px)
```css
--r-xs: 3px;   --r-sm: 5px;   --r: 8px;   --r-lg: 12px;
```
Pills (`999px`) are mostly retired in favor of squared shapes; the UI should read sharper/more arcade.

### Spacing
8px base grid (unchanged from old system): 4 / 8 / 16 / 24 / 32 / 48.

### Borders
```css
--bd:  2px solid var(--ink);
--bd1: 1.5px solid var(--ink);
```

---

## Typography

3 families (load from Google Fonts):
```
Archivo:wght@600;700;800;900       → display / titles / scores / big numbers
Space Grotesk:wght@400;500;600;700 → body, buttons, labels (KEPT from old system)
Space Mono:wght@400;700            → tokens, room codes, timers, terminal lines, kickers
```

| Element | Font | Weight | Size | Notes |
|---|---|---|---|---|
| Screen title / hero | Archivo | 900 | 24–46px | `letter-spacing: -0.02 to -0.04em` |
| Big score / similarity % | Archivo | 900 | 64–88px | `%` suffix in Space Mono |
| Token counter (092/150) | Archivo | 900 | 22–24px | `/150` part at ~13px, 45% opacity |
| Body / description | Space Grotesk | 400–500 | 13–17px | line-height 1.5 |
| Button label | Space Grotesk | 700 | 13–16px | |
| Kicker / section label | Space Mono | 700 | 11px | `letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.55` |
| Tokens / codes / timer | Space Mono | 700 | 11–16px | |
| Terminal / prompt text | Space Mono | 400 | 14px | line-height 1.55 |

**The `>_` terminal caret is the core brand motif** — used in the wordmark, the prompt input, and the app icon. Render with Space Mono. A blinking block cursor (`▮`) appears in the prompt terminal (see `.po-cursor`).

---

## Key Components

All component CSS is in **`promptoff.css`** (classes prefixed `po-`). Port these into `globals.css`. Highlights:

- **`.po-btn`** + modifiers `--acid` (acid fill, ink text), `--ink` (ink fill, acid text), `--ghost`, `--lg`, `--block`. Hard shadow; press = `translate(2px,2px)` + shadow gone; hover = `translate(-2px,-2px)` + bigger shadow. Trailing arrow uses Space Mono `▸`.
- **`.po-card`** — white, `--bd`, `--r-lg`, `--sh`. **`.po-panel`** — dark `--ink-2` terminal panel (acid kickers).
- **Token meter** — `.po-meter` / `.po-meter-track` / `.po-meter-fill` (+ `.warn` / `.danger` color states). The token budget is the visual centerpiece: a big Archivo-900 `092/150` counter above a chunky bordered bar. Optional `.po-pip` segmented variant.
- **`.po-terminal`** — dark prompt box: `>_` prefix in `.tok` (acid) + body text + `.po-cursor.on-dark` (blinking acid block). **`.po-input`** — light bordered input (room codes use Space Mono, letter-spacing 0.12em).
- **`.po-chip`** — mono uppercase badges: `--acid`, `--ink`, `--warn`, `--danger`. `.po-dot` for status dots.
- **`.po-row`** (+ `.you` = acid fill) for player/leaderboard rows; **`.po-avatar`** = squared (radius `--r-sm`) Archivo monogram, not a circle.
- **`.po-nav`** — floating ink bar, active item = acid pill, mono labels (`>_ PLAY`, `▦ RANK`, `◆ STATS`).
- **`.po-stripe`** — diagonal ink/acid hazard divider. **`.po-spark`** — the single sparkle ✦ mark (slow pulse), the one decorative flourish kept.

### ⚠️ Acid-text-on-light rule (important legibility fix)
Acid (`#B8EA38`) text on the paper base has almost no contrast. **Whenever acid-colored text sits on a light surface, wrap it in a black plate** via `.po-acid-text` (acid text on `--ink` background, small padding, `--r-xs`, `box-decoration-break: clone`). Use `.po-acid-text--lg` for large numbers. Acid text on dark surfaces (terminal, ink panels) needs no treatment.

---

## Screens / Views

Six screens, all in the new language. See the mockups in `Prompt-Off Design Language.html` (Section "Screens — redesigned"). Source markup in `screens.jsx`.

1. **Landing** (`src/app/page.tsx`) — wordmark hero on an acid plate with hard cast shadow; mono tagline; Create/Join tab pair (ink/white split, squared); rounds selector (1/3/5, active = acid); `CREATE ROOM ▸` ink button; ghost Leaderboard/Stats buttons; mono-numbered "How to play" list.
2. **Lobby** (`src/app/room/[code]`) — dark `.po-panel` with `ROOM CODE` kicker + huge acid Archivo room code; Copy (acid) / Share (ghost-on-dark) buttons; player `.po-row` list (you = acid, READY chips); ink `START GAME ▸`.
3. **Game** ★ (`src/app/room/[code]` + `PromptEditor`, `CountdownTimer`) — **the hero screen.** Round chip + timer (mono, warn-colored); `TARGET` reference image in a bordered framed card; **token meter** (Archivo counter + chunky bar); **prompt terminal** (`.po-terminal`, `>_`, blinking cursor); cost readout (`// this prompt = 58 tok` + `34 to spare` on a black plate); full-width acid `GENERATE ▸`.
4. **Results** (`ResultsReveal`) — giant Archivo similarity `87%`; `★ STRONG MATCH` chip; TARGET vs YOURS image pair; breakdown stat cards (MATCH / EFFICIENCY / SPEED); round-winner `.po-row.you` with `+122`; ink `NEXT ROUND ▸`.
5. **Leaderboard** (`src/app/leaderboard`, `Leaderboard`) — dark `.po-panel` podium for top 3 (Archivo ranks, #1 in acid), then `.po-row` list (you = acid).
6. **Profile / Stats** (`src/app/profile`, `src/app/stats`, `StatCard`) — squared avatar + Archivo name + mono rank line; 2×2 stat cards (first = acid); recent-matches `.po-row` list with thumbnails + WIN/PLAYED chips; floating `.po-nav` (Stats active).

### Directions to explore (a decision, not a deliverable)
The hero Game screen is shown three ways in the mockup — **A · Light** (paper base), **B · Terminal** (dark `--ink-2` base, acid-bordered), **C · Acid hero** (full acid background). The default/recommended is **A (Light)**, matching the rest of the app. The product team should pick one before implementation; B and C styles are in `directions.jsx`.

---

## Interactions & Behavior
Behavior is unchanged from the current app — only styling changes. Preserve the existing logic in the components. Visual interaction specs:
- **Button press:** `transform: translate(2px,2px)` + shadow removed, 80ms. Hover: `translate(-2px,-2px)` + larger shadow, 120ms.
- **Token meter:** fill width = `remaining/budget`; color shifts `acid → --warn → --danger` as budget depletes (keep the old thresholds, e.g. warn <40%, danger <20%).
- **Timer:** mono Archivo number; color `--ink → --warn → --danger` as time runs low.
- **Prompt cursor:** `.po-cursor` blinks at 1.05s steps (see `@keyframes po-blink`).
- **Sparkle:** `.po-spark` slow opacity/scale pulse, 2.4s.
- Reuse the app's existing entrance animations (slide-up/pop-in) — they're compatible.

## Design Tokens & Files Recap
- **`promptoff.css`** — the complete token + component stylesheet. **This is the primary artifact to port into `globals.css`.**
- **`Prompt-Off Design Language.html`** — the full design board (open in a browser to view foundations + all screens + directions). Loads the JSX files below via Babel.
- **`foundations.jsx`** — logo/wordmark, color, type, depth, components reference boards.
- **`screens.jsx`** — the six screen mockups (best source for exact per-screen markup).
- **`directions.jsx`** — the dark + acid Game-screen variants.
- **`design-canvas.jsx`** — presentation scaffold only (pan/zoom canvas); **not part of the design**, ignore for implementation.

## Assets
- **Logo:** the Prompt-Off wordmark is recreated in CSS/markup (`.po-wordmark` + the `>_` motif) — no image file needed. The original raster logo is the acid-green `>_Prompt-Off` lockup.
- **Reference images** (`assets/ref-*.jpg`): sample royalty-free images used as game "target" images in the mockups (mountain-lake, neon-city, starry-night, cherry-blossom, greek-island, autumn-forest). In production these come from the curated reference-image library — these are placeholders for layout only.
