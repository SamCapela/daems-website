# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # ESLint (flat config, React hooks + refresh rules)
```

No test suite exists in this project.

## Architecture

**daems-site** is a React 19 + Vite SPA for Twitch streamer "daems_". It has a client-side frontend and serverless API routes deployed on Vercel.

### Key files

- `src/App.jsx` — The entire frontend: all components, custom hooks, routing logic, and inline styles are defined in this single ~700-line file.
- `src/main.jsx` — Mounts React app to `#root`.
- `api/` — Vercel serverless functions that proxy Twitch API calls and interact with Upstash KV (Redis).

### Frontend (`src/App.jsx`)

Single-file architecture: `HomePage`, `ClipsPage`, `ShopPage`, `TwitchChat`, `NameBanner`, and others are all defined in one file. Navigation is client-side tab switching (no router library).

**Twitch OAuth**: Implicit grant flow. Token extracted from URL hash, stored in `localStorage`. Hardcoded `CLIENT_ID = "mk16oce917g7q5i485zlyackq33ce0"`, `BROADCASTER_ID = "441069979"`, `BROADCASTER = "daems_"`.

**IRC chat** (`useIRC` hook): Direct WebSocket to `wss://irc-ws.chat.twitch.tv`. Handles message parsing, badge extraction (broadcaster/mod/sub), and local message queuing before IRC confirmation arrives.

**Styling**: All inline CSS objects — no CSS framework, no CSS modules. One injected `<style>` tag string for keyframe animations. Dark theme with Twitch purple `#9147ff`.

**Subscription banners**: 5-tier system (Bronze → Diamond) keyed on subscriber months. Diamond tier has a shimmer animation.

**Language**: UI text is in French.

### API routes (`api/`)

Each file is a standalone Vercel serverless handler. They use:
- `BROADCASTER_TOKEN` env var (set in Vercel) for Twitch Helix API calls
- Upstash KV via `KV_REST_API_URL` / `KV_REST_API_TOKEN` env vars for leaderboards and viewer persistence
- `ADMIN_SECRET` env var to gate the `save-token.js` admin route

Routes: `save-token.js`, `store-viewer.js`, `recent-activity.js`, `subscribers.js`, `followers.js`, `bits.js`, `leaderboard-subs.js`.

### Environment variables

Credentials live in `.env.local` (not committed). Production values are set in the Vercel dashboard. The app will not function without valid Twitch and KV credentials.
