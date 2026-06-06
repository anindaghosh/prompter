# TODO

## Feature Template

Use this structure for every new feature entry:

```
### [FEATURE-###] <Short title>

**Status:** Draft | In Progress | Done | Blocked
**Priority:** High | Medium | Low
**Area:** Frontend | Backend | Both

**Goal**
One sentence describing what this feature does and why it matters.

**Acceptance criteria**
- [ ] Criterion 1
- [ ] Criterion 2

**Approach**
Brief notes on implementation strategy, affected files, or key decisions.

**Blocked by** (optional)
List any dependencies or blockers.
```

---

## Features

<!-- Add new features below using the template above -->

### [FEATURE-001] Persistent user profile creation

**Status:** Draft
**Priority:** High
**Area:** Both

**Goal**
Allow players to create and persist a named profile (display name + avatar) so their identity, stats, and history carry across sessions and devices.

**Acceptance criteria**
- [ ] Player can create a profile with a display name (3–20 characters) and an optional avatar selection
- [ ] Profile is persisted in SpacetimeDB and associated with the player's authenticated identity (`ctx.sender`)
- [ ] Display name is shown in the lobby player list, in-game HUD, and on the leaderboard
- [ ] On subsequent visits the player's profile is automatically loaded; no re-entry required
- [ ] Player can update their display name and avatar from a profile settings screen
- [ ] Display name uniqueness is enforced server-side (reducer returns an error on conflict)
- [ ] Profile page is accessible from the landing page and the post-game leaderboard

**Approach**
- **Backend (`server/spacetimedb/`)**: Add a `user_profile` table (`identity`, `display_name`, `avatar_id`, `created_at`, `updated_at`). Add `create_profile` and `update_profile` reducers; validate name length and uniqueness inside the reducer using `ctx.sender`.
- **Frontend (`src/`)**: Add a `useProfile` hook that subscribes to the `user_profile` table filtered by the current identity. On first load, if no profile exists, show a one-time profile-creation modal before entering the lobby. Persist the `identity` token in `localStorage` so it survives page reloads.
- **Affected files**: `server/spacetimedb/src/lib.ts`, `src/lib/spacetimedb.ts`, `src/hooks/useProfile.ts` (new), `src/app/page.tsx`, `src/app/room/[code]/page.tsx`, `src/components/ProfileModal.tsx` (new)
- After schema changes: run `npm run stdb:build`, `npm run stdb:publish`, `npm run stdb:generate`

**Blocked by**
None — can proceed independently of other features.

---

### [FEATURE-002] User authentication with SpacetimeDB identity

**Status:** Draft
**Priority:** High
**Area:** Both

**Goal**
Authenticate players using SpacetimeDB's built-in identity token so that each player has a stable, persistent identity across sessions without requiring a separate login system.

**Acceptance criteria**
- [ ] Player receives a SpacetimeDB identity token on first visit; token is saved to `localStorage` and reused on subsequent visits
- [ ] Identity token is automatically attached to every reducer call (`ctx.sender`) — no manual auth headers needed
- [ ] A `user_profile` table stores the canonical display name and avatar for each identity
- [ ] On first visit (no profile exists) a one-time profile-creation modal is shown before the player can create or join a room
- [ ] On return visits the profile is loaded automatically and the name/avatar fields are pre-filled
- [ ] `createProfile` reducer enforces display name length (3–20 characters) and uniqueness server-side, throwing a descriptive error on violation
- [ ] `updateProfile` reducer allows changing display name and avatar; same validations apply
- [ ] Clearing `localStorage` (or using a private window) results in a new anonymous identity and triggers the profile-creation modal again
- [ ] Reducer calls from unauthenticated clients (no token) are rejected — SpacetimeDB handles this automatically via `ctx.sender`

**Approach**

*Backend (`server/spacetimedb/src/index.ts`)*
- Add `user_profile` table:
  ```
  identity     identity  PK
  display_name string    UNIQUE
  avatar_id    u32
  created_at   u64       (microseconds since epoch via ctx.timestamp)
  updated_at   u64
  ```
- Add `createProfile` reducer: validate name length → check `displayName` uniqueness via index lookup → insert row using `ctx.sender`
- Add `updateProfile` reducer: find existing row by `ctx.sender` → validate → update

*Frontend (`src/`)*
- `src/hooks/useProfile.ts` (new): subscribe to `SELECT * FROM user_profile WHERE identity = '<myHex>'`; return `{ profile, loading, createProfile, updateProfile }`
- `src/components/ProfileModal.tsx` (new): modal shown when `profile === null`; displays name input + avatar picker (reuse the 10 existing emoji avatars); calls `conn.reducers.createProfile(...)`
- `src/app/page.tsx`: call `useProfile`; block create/join UI behind modal if no profile; pre-fill player name from `profile.displayName`
- `src/app/room/[code]/page.tsx`: pass `profile.displayName` as `playerName` when calling `createRoom` / `joinRoom` reducers

*Deploy steps after schema changes*
```bash
npm run stdb:build
npm run stdb:publish
npm run stdb:generate
```

**Blocked by**
None — can proceed independently of other features.

---

### [FEATURE-003] Persistent user game statistics and
  profile stats page
  
  **Status:** Draft
  **Priority:** High
  **Area:** Both

  **Goal**
  Automatically record each player's game result in
  SpacetimeDB after every game so stats accumulate across
  sessions, and display a lifetime summary plus recent game
  history on a `/profile` page.
  
  **Acceptance criteria**
  - [ ] After a game reaches the leaderboard phase, each
  player's result (rank, score, avg similarity, tokens used)
  is persisted automatically — no client action required
  - [ ] Cumulative stats are tracked per identity: games
  played, games won (1st place finishes), all-time total
  score, best single-game score, lifetime avg similarity,
  lifetime avg tokens used per round
  - [ ] A `/profile` page shows a stat summary card and a
  "Recent Games" table (up to 20 entries) with: date played,
  final rank, player count, total score, avg similarity
  - [ ] Profile page is reachable from the landing page
  (header link) and the post-game leaderboard ("View
  Profile" button)
  - [ ] Stats update immediately after each game ends — no
  page reload needed (subscription-driven)
  - [ ] A player with zero completed games sees a zero-state
  message ("Play your first game to see stats here")
  - [ ] Stats are scoped to the authenticated identity;
  players cannot read or mutate each other's records
  
  **Approach**
  
  *Backend (`server/spacetimedb/src/index.ts`)*
  
  Add two new tables:
  
  user_stats  — one row per identity (upserted after each
  game)
    identity          t.identity().primaryKey()
    games_played      t.u32()
    games_won         t.u32()          // 1st-place finishes
    total_score       t.u64()          // cumulative across
  all games
    best_score        t.u32()          // highest
  single-game total_score
    total_similarity  t.u64()          // sum of per-game
  avg_similarity (for lifetime avg)
    total_tokens      t.u64()          // sum of tokens_used
  across all rounds
    total_rounds      t.u32()          // total rounds
  played (denominator for avg tokens)
    updated_at        t.timestamp()

  game_history  — one row per player per game
    id                t.u64().primaryKey().autoInc()
    identity          t.identity().index('btree')
    room_code         t.string()
    played_at         t.timestamp()
    final_rank        t.u32()          // 1 = winner
    player_count      t.u32()
    total_score       t.u32()
    avg_similarity    t.u32()          // integer 0–100
    rounds_played     t.u32()

  Add a `stats_recorded: t.bool()` flag to the existing
  `room` table to prevent double-writes if the leaderboard
  phase is re-entered on reconnect.

  Add reducer `finalizeGameStats(roomCode: string)`:
  - Reject if `room.stats_recorded === true`
  - For each player in the room: read their `round_result`
  rows for `roomCode` to compute `avg_similarity` and total
  `tokens_used`; read their final `player.total_score`;
  derive `final_rank` from score ordering
  - Upsert `user_stats` (increment counters, update best
  score)
  - Insert one `game_history` row per player
  - Set `room.stats_recorded = true`
  - Embed this call at the end of the existing leaderboard
  phase transition reducer so it fires server-side
  automatically

  *Frontend (`src/`)*

  - `src/hooks/useStats.ts` (new): subscribes to
  `user_stats` and `game_history` filtered to the current
  identity; returns `{ stats, history, loading }`
  - `src/app/profile/page.tsx` (new): profile page with stat
  summary cards and a recent games table; handles
  zero-state and loading state; displays
  `user_profile.display_name` (from FEATURE-002) as the page
  heading
  - `src/components/StatCard.tsx` (new): small reusable card
  — label + formatted value
  - `src/app/page.tsx`: add a "Profile" link/button in the
  top-right corner (only shown when a profile exists)
  - `src/app/room/[code]/page.tsx`: add a "View Profile"
  button on the leaderboard screen

  *Deploy steps after schema changes*
  ```bash
  npm run stdb:build
  npm run stdb:publish
  npm run stdb:generate

  Blocked by
  FEATURE-002 (authentication / identity persistence) —
  stats are keyed to ctx.sender; without a stable identity
  token across sessions the records won't link up.
  FEATURE-001 (user profile) is needed for the display name
  on the profile page, but stat recording itself works
  independently.

  ---

### [FEATURE-004] AI-powered player insights

**Status:** Draft
**Priority:** Medium
**Area:** Both

**Goal**
Analyze a player's accumulated game history with Gemini to surface personalised strengths, weaknesses, and concrete improvement actions — turning raw stats into actionable coaching.

**Acceptance criteria**
- [ ] An "Insights" section is visible on the `/profile` page, below the stats summary
- [ ] Insights are only generated when the player has completed at least 5 games; otherwise a "Play more games to unlock insights" prompt is shown
- [ ] Insights contain three distinct sections returned from the AI:
  - **Strengths** — patterns where the player consistently performs above their own average (e.g. high similarity on nature scenes, strong token efficiency)
  - **Weaknesses** — patterns where performance is consistently below average (e.g. low similarity on abstract prompts, slow submission speed in later rounds)
  - **Improvement actions** — specific, actionable tips derived from the identified weaknesses (e.g. "Try leading with subject + lighting before adding style modifiers")
- [ ] Insights are generated server-side via a Next.js API route; the raw game history payload is never exposed to the client in a way that leaks other players' data
- [ ] A "Refresh insights" button lets the player regenerate insights on demand; the button is disabled for 24 hours after the last generation to avoid excessive API calls
- [ ] While insights are loading a skeleton/spinner state is shown; if generation fails a user-friendly error with a retry option is displayed
- [ ] Generated insights (text + timestamp) are persisted in SpacetimeDB so they survive page reloads without re-calling Gemini
- [ ] Insights are scoped strictly to the requesting player's identity — no cross-player data access

**Approach**

*Backend (`server/spacetimedb/src/index.ts`)*

Add a `player_insights` table to persist cached insights:
```
identity        t.identity().primaryKey()
strengths       t.string()   // JSON array of insight strings
weaknesses      t.string()   // JSON array of insight strings
improvements    t.string()   // JSON array of action strings
generated_at    t.timestamp()
```

Add reducer `saveInsights(strengths: string, weaknesses: string, improvements: string)`:
- Upserts the `player_insights` row for `ctx.sender`
- Sets `generated_at` to `ctx.timestamp`
- Called from the frontend after the API route returns successfully

*API route (`src/app/api/insights/route.ts`)*

- Accepts a `POST` with the player's `identity` token in the request body
- Fetches `game_history` and `user_stats` for that identity from SpacetimeDB (server-to-server read or passed in by the client)
- Builds a structured prompt for Gemini 2.5 Flash describing each game result (rank, score, avg_similarity, tokens_used, rounds_played) and the cumulative stats
- Instructs Gemini to respond with a JSON object: `{ strengths: string[], weaknesses: string[], improvements: string[] }` (2–4 bullets each)
- Validates and parses the JSON response before returning it to the client
- Returns HTTP 429 if the client requests a refresh within 24 hours of the last `generated_at` timestamp

*Frontend (`src/`)*

- `src/hooks/useInsights.ts` (new): subscribes to `player_insights` for the current identity; exposes `{ insights, loading, refresh }` where `refresh` calls the API route and then invokes the `saveInsights` reducer
- `src/app/profile/page.tsx`: render an `InsightsPanel` component beneath the stat cards; pass `{ insights, loading, refresh, canRefresh }` from `useInsights`
- `src/components/InsightsPanel.tsx` (new): renders three collapsible sections (Strengths / Weaknesses / Improvements), a "Refresh" button with cooldown countdown, and skeleton/error states

*Deploy steps after schema changes*
```bash
npm run stdb:build
npm run stdb:publish
npm run stdb:generate
```

**Blocked by**
- FEATURE-003 (game stats & history) — insights are derived from `game_history` and `user_stats`; this feature has no useful data to analyse without it
- FEATURE-002 (authentication) — insights are identity-scoped; stable identity is required for the persistence layer

---

### [FEATURE-005] Per-round score breakdown display

**Status:** Draft
**Priority:** Medium
**Area:** Frontend

**Goal**
Show players a detailed breakdown of how their round score was calculated — similarity sub-scores (composition, color, subject, style), efficiency, and speed — so they understand what drove their result and can improve their prompting strategy.

**Acceptance criteria**
- [ ] After each round, the scoring screen displays the total score alongside an expandable or always-visible breakdown panel
- [ ] Similarity breakdown shows the four Gemini sub-scores: composition, color, subject, and style (each 0–100), plus the weighted similarity total
- [ ] Efficiency score and speed bonus are displayed as separate line items with their raw values (tokens saved, submission time) so the contribution is transparent
- [ ] Breakdown is shown for the local player's own result by default; on the reveal/leaderboard screen other players' breakdowns are also visible
- [ ] If a round score has no breakdown data (e.g. a legacy row), the panel gracefully falls back to showing only the total score

**Approach**
- The `score-image` API route (`src/app/api/score-image/route.ts`) already returns a `breakdown` object with `composition`, `color`, `subject`, and `style` sub-scores from Gemini — no backend change needed
- Store the breakdown alongside the round result: extend the `round_result` SpacetimeDB table with four extra `u32` columns (`score_composition`, `score_color`, `score_subject`, `score_style`); preferred over a JSON string for queryability
- Update the `submitPrompt` / scoring reducer path to accept and store sub-scores after the API route returns
- `src/app/room/[code]/page.tsx`: read sub-scores from the subscription; render a `ScoreBreakdown` component during the `scoring` and `reveal` phases
- `src/components/ScoreBreakdown.tsx` (new): displays a small table or bar-chart row for each sub-score, the weighted similarity total, efficiency line item, and speed line item
- After schema changes: run `npm run stdb:build`, `npm run stdb:publish`, `npm run stdb:generate`

**Blocked by**
None — breakdown data is already produced by the scoring API; this is purely a storage + display change.

---

