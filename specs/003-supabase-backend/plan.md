# Implementation Plan: Supabase Backend

**Branch**: `003-supabase-backend` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-supabase-backend/spec.md`

## Summary

Set up the Supabase backend infrastructure: PostgreSQL database with
transcriptions table (RLS-protected), Edge Function for LLM refinement
(in Deno, calling Groq/OpenAI), Supabase Auth for user authentication,
and Realtime push for cross-device sync. The desktop app will send raw
text to the Edge Function instead of calling the LLM directly, moving
the API key from the desktop to the backend.

## Technical Context

**Language/Version**: TypeScript/Deno (Edge Functions), SQL (PostgreSQL)  
**Primary Dependencies**: @supabase/supabase-js (desktop), openai SDK (Edge Function), Supabase CLI (dev)  
**Storage**: PostgreSQL via Supabase (managed)  
**Testing**: Supabase local emulator (`supabase start`), manual testing via desktop app  
**Target Platform**: Supabase Cloud (managed PostgreSQL, Deno runtime, Realtime WebSockets)  
**Project Type**: web-service (backend) + desktop client (existing Electron app)  
**Performance Goals**: Edge Function response <3s for ≤1min audio, DB queries <200ms for up to 500 transcriptions  
**Constraints**: RLS on all tables; API keys NEVER in client; Edge Functions = sole LLM callers; audio transient  
**Scale/Scope**: Small user base (<100), single-region Supabase project, Free/Pro tier

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|-----------|-------|
| I. Speed as a Resource | ✅ PASS | Edge Function adds network latency (~200ms). Refinement target <3s for 1min audio. Acceptable within <2s pipeline if LLM is fast (Groq ~500ms). |
| II. Zero Friction | ✅ PASS | Auth adds one-time login screen. After auth, flow is identical. Token refresh is automatic. |
| III. Privacy & Transparency | ✅ PASS | Audio stays transient in desktop. Only refined text sent to Supabase. API keys in Edge Functions only, never in renderer. |
| IV. API-First Extensibility | ✅ PASS | Edge Function is the symmetric API. Desktop + mobile consume the same endpoints. Realtime sync is built-in. |
| V. Quality & Performance | ✅ PASS | Desktop RAM unchanged. Edge Function cold start may add latency — mitigated by keep-warm or Pro tier. |

No violations. Phase 0 and Phase 1 may proceed.

## Project Structure

### Documentation (this feature)

```text
specs/003-supabase-backend/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — Supabase tools research
├── data-model.md        # Phase 1 — DB schema and entities
├── quickstart.md        # Phase 1 — setup guide
├── contracts/
│   ├── README.md
│   └── edge-functions-api.md   # Edge Function contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 — implementation tasks
```

### Source Code (repository root)

```text
supabase/
├── functions/
│   └── refine/
│       ├── index.ts           # Edge Function: refine + save transcription
│       ├── _shared/
│       │   └── cors.ts        # CORS headers helper
│       └── supabase.ts        # Supabase client config
├── migrations/
│   └── 001_create_transcriptions.sql   # DB schema
├── seed.sql                  # (optional) seed data
├── config.toml               # Supabase project config
└── seed.config.ts

src/
├── main/
│   ├── index.ts              # Add Supabase init, auth IPC, offline queue
│   ├── supabase.ts           # (NEW) Supabase client wrapper
│   ├── recording.ts          # Modified: send to Edge Function instead of direct LLM
│   └── refine.ts             # Modified: fallback only (direct LLM when offline)
├── preload/
│   ├── index.ts              # + auth IPC handlers
│   └── index.d.ts            # + auth types
└── renderer/
    └── src/
        ├── App.tsx                    # + login screen, history panel
        ├── components/
        │   ├── LoginScreen.tsx         # (NEW) auth form
        │   └── HistoryList.tsx         # (NEW) transcription history
        └── store/
            ├── recordingStore.ts       # + auth state, history state
            └── authStore.ts            # (NEW) auth state
```

**Structure Decision**: Supabase backend lives in `supabase/` directory at
repo root, separate from the Electron desktop app. This follows Supabase
conventions and keeps the backend code independent. The desktop app adds
Supabase client integration in `src/main/supabase.ts` and auth/history UI
in the renderer.

## Complexity Tracking

No Constitution Check violations — Complexity Tracking is not required.
