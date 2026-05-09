# Research: Supabase Backend

**Phase**: Phase 0 — Research & Unknowns Resolution
**Date**: 2026-05-09
**Feature**: [spec.md](./spec.md)

## Resolved Unknowns

### 1. Supabase Client for Desktop (Electron)

- **Decision**: `@supabase/supabase-js` v2.105.4
- **Rationale**: Official isomorphic JS client, works in Node.js (Electron main process). Provides auth, database queries, and Realtime subscriptions in a single package.
- **Auth flow**: PKCE (Proof Key for Code Exchange) for desktop apps — recommended for Electron since there's no HTTP-only cookie support like in web browsers.
- **Alternatives considered**: Supabase Auth Helper (web-focused, not suitable), gotrue-js (lower level, more work).

### 2. Edge Function Runtime (Deno)

- **Decision**: TypeScript in Deno runtime (default Supabase Edge Function environment)
- **Rationale**: Supabase Edge Functions run on Deno, providing TypeScript support out of the box, no build step needed, fast cold starts.
- **OpenAI SDK on Deno**: The `openai` npm package works on Deno via npm specifiers: `npm:openai`. Also supports `https://esm.sh/openai`.
- **LLM provider**: Configurable via Edge Function environment variables (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`). Supports Groq, OpenAI, or any OpenAI-compatible API.
- **Alternatives considered**: Node.js server (would need separate hosting), Cloudflare Workers (different runtime).

### 3. Database Schema — Transcriptions Table

- **Decision**: Single `transcriptions` table with RLS
- **Rationale**: Simple schema matches the use case. RLS ensures user isolation without application-level filtering.
- **Key columns**: `id` (UUID, PK), `user_id` (UUID, FK to auth.users, indexed), `raw_text` (text), `refined_text` (text), `duration_seconds` (int), `created_at` (timestamptz, indexed).
- **Indexes**: `user_id` for filtered queries, `created_at` for ordering.
- **Alternatives considered**: Separate `raw_transcriptions` and `refined_transcriptions` tables (over-engineered for MVP).

### 4. Supabase Realtime Integration

- **Decision**: Use Supabase Realtime with PostgreSQL replication
- **Rationale**: Supabase Realtime listens to PostgreSQL changes (INSERT/UPDATE/DELETE) via logical replication and pushes to connected clients via WebSocket. The desktop app subscribes to `transcriptions` changes filtered by `user_id`.
- **Channel**: `realtime.transcriptions` with `user_id = eq.<user_id>` filter (requires Realtime RLS or a dedicated replication slot).
- **Alternatives considered**: Polling (inefficient, higher latency), manual WebSocket (more code).

### 5. Offline Mode

- **Decision**: Local queue in Electron main process (in-memory array + JSON file), sync when online
- **Rationale**: User may be offline when recording. The raw text is refined locally (current Groq call) and queued for sync. When online, queued items are sent to the Edge Function and the local cache is updated with the server response.
- **Queue structure**: `{ id, rawText, refinedText, duration, createdAt, synced: boolean }`.
- **Storage**: JSON file at `app.getPath('userData')/offline-queue.json`.
- **Alternatives considered**: IndexedDB in renderer (not accessible from main process), SQLite (heavier dependency).

### 6. Authentication Flow for Electron

- **Decision**: PKCE (Proof Key for Code Exchange) OAuth flow via Supabase Auth
- **Rationale**: PKCE is the recommended flow for native/desktop apps. No client secret needed. Supabase JS client handles the PKCE flow automatically.
- **Flow**: User clicks login → app opens system browser → user authenticates → Supabase redirects to custom URL scheme (`monolog://callback`) → app intercepts the redirect → exchanges code for session → stores tokens.
- **For MVP**: Email/password auth (simpler, fully in-app without browser redirect). OAuth (Google/GitHub) as P2 improvement.
- **Session persistence**: Supabase JS client stores session in memory; we persist the refresh token to a local file to restore sessions across restarts.

### 7. CORS for Edge Functions

- **Decision**: Edge Functions include CORS headers for all origins (development) or specific origins (production)
- **Rationale**: The desktop app makes requests from `file://` or `http://localhost` origins. Supabase Edge Functions need CORS headers to accept these requests.
- **Implementation**: Shared `_shared/cors.ts` utility returning `Access-Control-Allow-Origin: *` headers for all responses.

## Edge Function Design

```
┌─────────────────────────────────────────────────────────┐
│  POST /refine                                           │
│  ─────────────────                                      │
│  Request: { rawText: string, durationSeconds: number }  │
│  Auth: Bearer <supabase-access-token>                   │
│                                                         │
│  1. Verify auth (Supabase Auth JWT)                     │
│  2. Call LLM (Groq/OpenAI) with raw text                │
│  3. INSERT into transcriptions (user_id, raw, refined)   │
│  4. Return { id, refinedText, createdAt }               │
│                                                         │
│  Response 200: { success: true, data: {...} }           │
│  Response 401: { success: false, error: "Unauthorized" }│
└─────────────────────────────────────────────────────────┘

Desktop offline fallback:
  refine() → calls Edge Function → success → clipboard + DB
                                  → fail → local LLM + local queue
```

## References

- Supabase JS Client: https://www.npmjs.com/package/@supabase/supabase-js
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Auth (PKCE): https://supabase.com/docs/guides/auth/server-side/pkce-flow-for-ssr
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- OpenAI SDK on Deno: https://deno.land/x/openai
- Supabase CLI: https://supabase.com/docs/guides/cli
