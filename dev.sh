#!/usr/bin/env bash
set -e

# Kill anything on port 3001 (Next.js)
if lsof -ti:3001 &>/dev/null; then
  echo "Killing process on port 3001 (Next.js)..."
  lsof -ti:3001 | xargs kill -9
fi

# Kill SpacetimeDB daemon (binds to port 3000)
if lsof -ti:3000 &>/dev/null; then
  echo "Killing SpacetimeDB on port 3000..."
  lsof -ti:3000 | xargs kill -9
  sleep 1  # wait for the port to release
fi

# Rebuild and republish the server module
echo "Building server module..."
npm run stdb:build

echo "Starting SpacetimeDB..."
spacetime start &>/dev/null &
STDB_PID=$!

# Wait for SpacetimeDB to bind on port 3000
until lsof -ti:3000 &>/dev/null; do sleep 1; done
echo "SpacetimeDB ready."

echo "Publishing to local SpacetimeDB..."
(cd server && spacetime publish prompter-hack --server local --yes)

echo "Regenerating TypeScript bindings..."
npm run stdb:generate

# Start Next.js in the background
echo "Starting Next.js on port 3001..."
npm run dev -- --port 3001
