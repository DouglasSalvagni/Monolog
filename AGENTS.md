# Projeto: Monolog

Desktop speech-to-text app. Record with a global hotkey, get refined text on your clipboard in <2s.

## Stack

- **Desktop:** Electron + Vite + React + TypeScript (strict)
- **State:** Zustand (prefer over Context for lightness)
- **Styling:** Tailwind CSS
- **STT:** Deepgram SDK via WebSocket (streaming real-time)
- **Refinement:** LLM (Llama 3 via Groq or GPT-4o-mini via OpenAI) — called from Supabase Edge Functions
- **Backend:** Supabase (PostgreSQL + RLS, Auth, Edge Functions in Deno, Realtime)

## Key Conventions

- **Global hotkey:** `Alt+Shift+R` to toggle recording
- **Audio capture** happens in Electron Main Process; renderer shows interim results
- **Refined text** is auto-copied to clipboard after processing
- **API keys** (`DEEPGRAM_KEY`, `SUPABASE_KEY`) must NEVER be in renderer — use Main Process proxy or Edge Functions
- **Audio is transient;** only refined text is persisted to Supabase
- **Mobile:** React Native/Expo app consuming same Supabase backend (same DB schema, Realtime sync)

## Architecture Flow

1. Main Process captures audio stream from hardware
2. Stream sent via WebSocket to Deepgram
3. Renderer displays interim results
4. On stop, Renderer calls Supabase Edge Function with raw text
5. Edge Function returns cleaned text, saves to DB, app copies to clipboard

## Targets

- Linux: `.AppImage` / `.deb`
- Windows: `.exe`
- Background process ≤ 150MB RAM
- LLM refinement ≤ 1s for ≤ 1min audio

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
`specs/002-real-audio-capture/plan.md`
<!-- SPECKIT END -->
