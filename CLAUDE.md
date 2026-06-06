# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Promptinary** is a competitive multiplayer game where players race to recreate reference images by writing AI image prompts within a token budget. Players are scored on visual similarity (60%), prompt efficiency (25%), and speed (15%).

## Feature tracking

New features are tracked in `TODO.md`. Use the template at the top of that file for every entry — it captures status, priority, goal, acceptance criteria, and approach.

## Running locally

**Port note:** SpacetimeDB's local server binds to port 3000, so Next.js must run on a different port (3001).

```bash
# 1. Configure environment for local dev
#    Set NEXT_PUBLIC_SPACETIMEDB_URL=ws://localhost:3000 in .env.local

# 2. Start SpacetimeDB local server (runs on port 3000)
spacetime start

# 3. Build and publish the server module to the local instance
cd server && spacetime publish prompter-hack --server local --yes && cd ..

# 4. Start Next.js on port 3001 (avoids collision with SpacetimeDB)
npm run dev -- --port 3001
```

Open http://localhost:3001 in your browser.

**Useful local debugging commands:**
```bash
spacetime logs prompter-hack -f                      # Tail server logs
spacetime sql prompter-hack "SELECT * FROM room"     # Query tables
```

## Commands

```bash
# Frontend development
npm run dev          # Start Next.js dev server (default port 3000 — use --port 3001 for local dev)
npm run build        # Production build
npm run lint         # ESLint

# SpacetimeDB backend
npm run stdb:build   # Compile the server module (spacetime build)
npm run stdb:publish # Deploy to maincloud as "prompter-hack" (requires auth)
npm run stdb:generate # Regenerate TypeScript client bindings from server schema
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `GEMINI_API_KEY` — Google Gemini API key (used for image generation and scoring)
- `NEXT_PUBLIC_SPACETIMEDB_URL` — SpacetimeDB WebSocket URL (`ws://localhost:3000` for local, `wss://maincloud.spacetimedb.com` for prod)
- `NEXT_PUBLIC_SPACETIMEDB_MODULE` — Database name (default: `prompter-hack`)

## Architecture

### Two-tier system: Next.js frontend + SpacetimeDB backend

**Frontend** (`src/`): Next.js 16 app with React 19

**Backend** (`server/spacetimedb/`): SpacetimeDB TypeScript module — application logic runs inside the database as WebAssembly. No separate API server.

### Key data flow

1. Client calls a **reducer** (e.g. `conn.reducers.createRoom(...)`) — reducers are transactional, run server-side, do not return values
2. Client reads state via **subscriptions** (`conn.subscriptionBuilder().subscribe([SQL])`) and reacts to `onInsert`/`onUpdate`/`onDelete` callbacks
3. SpacetimeDB pushes real-time updates to all subscribed clients

### Frontend structure

- `src/lib/spacetimedb.ts` — singleton SpacetimeDB connection; use `getStdbConnection()` and `onStdbConnected()` everywhere
- `src/module_bindings/` — auto-generated; **do not edit manually** (regenerate with `npm run stdb:generate`)
- `src/hooks/useGameSocket.ts` — shared type definitions: `GameState`, `GamePhase`, `PlayerResult`, `PowerupId`, `POWERUP_DEFS`, `DEFAULT_GAME_STATE`
- `src/app/page.tsx` — landing page (create/join room)
- `src/app/room/[code]/page.tsx` — main game room; handles all game phases
- `src/app/api/generate-image/route.ts` — Next.js API route calling Gemini to generate images from prompts
- `src/app/api/score-image/route.ts` — Next.js API route calling Gemini vision to score similarity (0-100) between reference and generated image

### Game phases

`disconnected` → `lobby` → `countdown` → `playing` → `scoring` → `reveal` → `leaderboard`

The room page drives all phase transitions by reacting to SpacetimeDB table changes.

### Reference images

20 curated images in `public/reference-images/`. The image IDs (`img-001` through `img-020`) are hardcoded in both `src/app/api/score-image/route.ts` and `src/app/room/[code]/page.tsx` — keep these in sync.

### Scoring

- **Similarity** (60%): Gemini 2.5 Flash vision compares reference vs. generated image, returns 0–100 with a breakdown (composition, color, subject, style)
- **Efficiency** (25%): tokens saved under budget
- **Speed** (15%): time bonus for faster submissions

### Powerups

Six powerup types defined in `useGameSocket.ts`: `TOKEN_DRAIN`, `FREEZE`, `TOKEN_SHIELD`, `HINT`, `DOUBLE_POINTS`, `CATEGORY`. Powerup state is tracked in SpacetimeDB tables (`player_powerup`, `powerup_event`).

## SpacetimeDB Critical Rules

See `server/CLAUDE.md` for the full reference, but the most important points:

- **Reducers do not return data** — read state via table subscriptions only
- **Reducers must be deterministic** — no network, filesystem, timers, or `Math.random()` inside reducers; use `ctx.timestamp` and `ctx.random()`
- **`ctx.sender` is the authenticated identity** — never trust identity passed as arguments
- After any schema change to `server/spacetimedb/`, run `npm run stdb:build`, `npm run stdb:publish`, then `npm run stdb:generate` to keep bindings in sync
