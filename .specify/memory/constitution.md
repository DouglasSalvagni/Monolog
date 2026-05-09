<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (initial constitution materialization)
  Modified principles: N/A — all new (template was unfilled)
  Added sections: Core Principles (I–V), Technical Stack, Development Workflow & Security, Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (generic constitution reference — no change needed)
    - .specify/templates/spec-template.md ✅ (no constitution-specific refs)
    - .specify/templates/tasks-template.md ✅ (no constitution-specific refs)
    - .specify/templates/commands/*.md — no files exist ✅
  Follow-up TODOs: None
-->
# Monolog Constitution

## Core Principles

### I. Speed as a Resource
The pipeline from speech-end to clipboard-text MUST complete in under 2
seconds. Audio capture, streaming STT, LLM refinement, and clipboard write
form a single latency budget that MUST be optimized end-to-end. Every
millisecond counts — avoid unnecessary buffering, prefer streaming interfaces,
and profile the hot path regularly.

### II. Zero Friction
The app MUST operate entirely from the background (system tray). The user MUST
NOT need to switch windows to start or stop recording. Global hotkey
`Alt+Shift+R` is the default toggle. Visual feedback (tray icon state or
discrete overlay) MUST indicate recording status at all times.

### III. Privacy & Transparency
Raw audio data MUST be transient — never persisted beyond the transcription
window. Only refined text MAY be saved to Supabase. API keys (`DEEPGRAM_KEY`,
`SUPABASE_KEY`) MUST NEVER appear in the renderer process — use the Electron
Main Process as proxy or route through Supabase Edge Functions.

### IV. API-First Extensibility
The Supabase backend MUST treat desktop and mobile clients as symmetric peers.
All business logic (LLM refinement) MUST live in Edge Functions, not in client
code. Real-time sync MUST push new transcriptions to all connected clients via
Supabase Realtime. The mobile client (React Native/Expo) consumes the same
REST API and database schema.

### V. Quality & Performance Standards
Background process MUST consume ≤150MB RAM. LLM refinement MUST complete in
≤1s for ≤1min of audio. Build targets: `.AppImage`/`.deb` (Linux) and `.exe`
(Windows). Audio is transient; only refined text is persisted to the database.

## Technical Stack

### Desktop Client
- **Framework:** Electron + Vite + React (TypeScript Strict Mode)
- **State Management:** Zustand (preferred over React Context for lightness)
- **Styling:** Tailwind CSS (utility-first)

### AI Pipeline
- **Transcription (STT):** Deepgram SDK via WebSocket for real-time streaming
- **Text Refinement:** LLM (Llama 3 via Groq or GPT-4o-mini via OpenAI),
  called from Supabase Edge Functions

### Backend
- **Infrastructure:** Supabase (PostgreSQL + RLS, Auth, Edge Functions in
  Deno, Realtime)
- **Authentication:** Supabase Auth (OAuth and email/password)
- **Mobile (future):** React Native / Expo sharing same backend and DB schema

## Development Workflow & Security

### Code Standards
- **Components:** Functional components with React Hooks only
- **Styling:** Tailwind CSS utility classes; no CSS-in-JS or static CSS files
- **TypeScript:** Strict mode enforced; no `any` without explicit justification

### Security Rules
- API keys MUST NEVER be embedded in the renderer bundle
- All Deepgram communication MUST go through the Electron Main Process
- Edge Functions are the sole authorized callers of LLM APIs
- Row-Level Security (RLS) MUST be enabled on all Supabase tables

### Transcription Data Flow
1. Main Process captures audio stream from hardware
2. Stream sent via WebSocket to Deepgram
3. Renderer displays interim (partial) transcription results
4. On recording stop, Renderer calls Supabase Edge Function with raw text
5. Edge Function returns cleaned text, saves to DB, app copies to clipboard
6. Supabase Realtime pushes the new transcription to all connected clients

### Offline Mode
If the connection to Deepgram or Supabase fails, transcriptions MUST be cached
locally and synced once connectivity is restored. Refined text is still copied
to clipboard from the local cache.

## Governance

This constitution supersedes all other project documentation and informal
practices. Amendments require a documented rationale, approval via pull
request, and a migration plan for affected systems. All code reviews MUST
verify compliance with these principles. Complexity MUST be justified per
YAGNI — prefer simpler solutions unless a concrete performance or correctness
need is demonstrated. Versioning follows semantic versioning (MAJOR for
principle removals/redefinitions, MINOR for new principles/sections, PATCH for
clarifications and non-semantic changes).

**Version**: 1.0.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-08
