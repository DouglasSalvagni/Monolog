# Tasks: Supabase Backend

**Input**: Design documents from `specs/003-supabase-backend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Branch**: `003-supabase-backend`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between these tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Initialize Supabase project and dependencies

- [X] T001 Install Supabase CLI globally via brew (`brew install supabase/tap/supabase`)
- [ ] T002 Login to Supabase: `supabase login` (interactive — opens browser)
- [ ] T003 Create new Supabase project (via dashboard at https://supabase.com)
- [X] T004 Initialize Supabase local config: `supabase init` in `supabase/` directory
- [ ] T005 Link to remote project: `supabase link --project-ref <ref>` in `supabase/`
- [X] T006 Install `@supabase/supabase-js` in desktop app: `npm install @supabase/supabase-js`

---

## Phase 2: Foundational — Database Schema

**Purpose**: PostgreSQL table + RLS + migrations that ALL stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create migration file at `supabase/migrations/001_create_transcriptions.sql` with table definition, indexes, and RLS policy per data-model.md
- [ ] T008 Apply migration locally: `supabase migration up`
- [X] T009 Create `apps/desktop/src/main/supabase.ts` — Supabase client wrapper with `createClient()` using env vars
- [X] T010 Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env.example`
- [X] T011 Add Supabase env var loading in `apps/desktop/src/main/index.ts` (dotenv)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Autenticação (Priority: P1) 🎯 MVP

**Goal**: Usuario cria conta, faz login, sessao persiste entre reinicializacoes.

**Independent Test**: Abrir app → login screen → criar conta → app mostra email logado → fechar/reabrir → sessao persiste → logout → login screen.

### Implementation

- [X] T012 [P] [US1] Create `apps/desktop/src/renderer/src/store/authStore.ts` — Zustand store with `user`, `loading`, `error` state
- [X] T013 [P] [US1] Create `apps/desktop/src/renderer/src/components/LoginScreen.tsx` — email/password form with signup/login toggle and error display
- [X] T014 [US1] Add auth IPC handlers in `apps/desktop/src/main/index.ts` for `auth:login`, `auth:signup`, `auth:logout`, `auth:restore-session`
- [X] T015 [P] [US1] Add auth IPC listeners in `apps/desktop/src/preload/index.ts` + update `apps/desktop/src/preload/index.d.ts`
- [X] T016 [US1] Implement Supabase Auth methods in `apps/desktop/src/main/supabase.ts` — `login()`, `signup()`, `logout()`, `restoreSession()`, `onAuthStateChange()`
- [X] T017 [US1] Integrate auth store + LoginScreen into `apps/desktop/src/renderer/src/App.tsx` — show LoginScreen when not authenticated

**Checkpoint**: US1 complete — user can create account, log in, session persists, logout works.

---

## Phase 4: User Story 2 — Refinamento via Edge Function (Priority: P1) 🎯 MVP

**Goal**: Ao parar a gravacao, raw text e enviado pra Edge Function que chama LLM, salva no DB, e retorna texto refinado.

**Independent Test**: Logado → gravar audio → parar → console mostra `edge function success` → texto refinado na UI e clipboard → transcricao aparece no Supabase dashboard.

### Implementation

- [ ] T018 [P] [US2] Create Edge Function at `supabase/functions/refine/index.ts` — POST handler that validates auth, calls LLM, INSERTs into transcriptions, returns refined text
- [ ] T019 [P] [US2] Create shared CORS utility at `supabase/functions/_shared/cors.ts`
- [ ] T020 [US2] Add Edge Function env vars via Supabase dashboard: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`
- [ ] T021 [US2] Deploy Edge Function: `supabase functions deploy refine`
- [X] T022 [US2] Add `callRefineEdgeFunction()` to `apps/desktop/src/main/supabase.ts` — POST to `/functions/v1/refine` with auth token (implemented)
- [ ] T023 [US2] Refactor `apps/desktop/src/main/recording.ts` onFinal() — try Edge Function first, fallback to local LLM on failure
- [ ] T024 [US2] Update `apps/desktop/src/main/refine.ts` — keep local LLM as offline fallback only
- [ ] T025 [US2] Add `transcription:saving` IPC state so UI shows saving indicator

**Checkpoint**: US2 complete — core pipeline uses Edge Function, falls back to local LLM when offline.

---

## Phase 5: User Story 3 — Histórico de Transcrições (Priority: P2)

**Goal**: Usuario pode ver, copiar e excluir transcricoes passadas.

**Independent Test**: 3 gravacoes → historico mostra todas → copiar texto antigo → excluir uma → lista atualiza.

### Implementation

- [ ] T026 [US3] Create Edge Function at `supabase/functions/list/index.ts` — GET handler that queries transcriptions by user_id with pagination
- [ ] T027 [US3] Create Edge Function at `supabase/functions/delete/index.ts` — DELETE handler that removes a transcription (RLS ensures ownership)
- [ ] T028 [US3] Deploy list + delete functions: `supabase functions deploy list && supabase functions deploy delete`
- [X] T029 [P] [US3] Add `fetchHistory()` and `deleteTranscription()` to `apps/desktop/src/main/supabase.ts` (implemented)`
- [ ] T030 [P] [US3] Add history IPC handlers in `apps/desktop/src/main/index.ts` for `history:list`, `history:delete`
- [ ] T031 [P] [US3] Add history IPC listeners in `apps/desktop/src/preload/index.ts` + update `apps/desktop/src/preload/index.d.ts`
- [ ] T032 [US3] Create `apps/desktop/src/renderer/src/components/HistoryList.tsx` — list of past transcriptions with timestamps, copy/delete buttons
- [ ] T033 [US3] Add `history` state to `apps/desktop/src/renderer/src/store/authStore.ts` (or create separate historyStore)
- [ ] T034 [US3] Integrate HistoryList into `apps/desktop/src/renderer/src/App.tsx` — show after recording stop or via button

**Checkpoint**: US3 complete — user can browse, copy, and delete past transcriptions.

---

## Phase 6: User Story 4 — Sincronização em Tempo Real (Priority: P3)

**Goal**: Nova transcricao aparece instantaneamente em outros dispositivos logados.

**Independent Test**: Logar mesma conta em duas instancias → gravar no dispositivo A → transcricao aparece no dispositivo B em <5s.

### Implementation

- [ ] T035 [US4] Enable Realtime replication on `transcriptions` table in Supabase dashboard → Replication → add table
- [ ] T036 [US4] Add Realtime subscription in `apps/desktop/src/main/supabase.ts` — subscribe to `transcriptions` INSERT events filtered by user_id
- [ ] T037 [US4] Add `history:realtime-new` IPC channel from main to renderer for new realtime entries
- [ ] T038 [US4] Integrate Realtime updates into HistoryList — new entries appear without manual refresh

**Checkpoint**: US4 complete — multi-device sync works in realtime.

---

## Phase 7: Offline Queue & Polish

**Purpose**: Handle offline gracefully, clean up, verify everything

- [ ] T039 [P] Implement offline queue in `apps/desktop/src/main/supabase.ts` — save unsynced transcriptions to local JSON file, sync when online
- [ ] T040 [P] Add connectivity detection (navigator.onLine / window 'online'/'offline' events) in renderer
- [ ] T041 Update `apps/desktop/src/renderer/src/App.tsx` — show connectivity status indicator (Online/Offline)
- [ ] T042 Create `supabase/seed.sql` with sample data for development testing
- [ ] T043 [P] Run `npm run typecheck` and fix TypeScript errors
- [ ] T044 [P] Run `npm run lint` and fix lint errors
- [ ] T045 Test full flow: login → record → refine (Edge Function) → clipboard → history → realtime sync

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Install Supabase CLI and deps first
- **Foundational (Phase 2)**: Supabase project, migration, client wrapper — blocks ALL stories
- **US1 (Phase 3)**: Auth — needed before any authenticated requests (US2, US3, US4)
- **US2 (Phase 4)**: Edge Function + refine — can start after Phase 2
- **US3 (Phase 5)**: History endpoints — can start after Phase 4 (uses same DB)
- **US4 (Phase 6)**: Realtime — can start after Phase 4 (needs DB table)
- **Polish (Phase 7)**: Depends on US1, US2, US3 being complete

### User Story Dependencies

- **US1 (P1)**: Auth — prerequisite for ALL stories (need auth token for API calls)
- **US2 (P1)**: Refine — needs DB + auth (Phase 2+3), independent of US3/US4
- **US3 (P2)**: History — needs DB + auth + refine (Phase 2+3+4)
- **US4 (P3)**: Realtime — needs DB + auth (Phase 2+3), independent of US3

### Within Each User Story

- Contracts/helpers first → core logic → UI integration
- Auth: store → LoginScreen → IPC handlers → main process → App.tsx integration

### Parallel Opportunities

- T012 + T013 (authStore + LoginScreen — different files)
- T018 + T019 (Edge Function + CORS utility — different files)
- T026 + T027 (list + delete Edge Functions — different files)
- T029 + T030 + T031 (supabase methods, IPC handlers, preload — different files)
- T039 + T040 (offline queue + connectivity detection — different files)
- T043 + T044 (typecheck + lint — independent tools)

## Parallel Example: User Story 2

```bash
# Edge function and CORS utility can be done in parallel:
Task: "Create Edge Function at supabase/functions/refine/index.ts"
Task: "Create shared CORS utility at supabase/functions/_shared/cors.ts"
```

## Parallel Example: User Story 3

```bash
# Both Edge Functions can be done in parallel:
Task: "Create Edge Function at supabase/functions/list/index.ts"
Task: "Create Edge Function at supabase/functions/delete/index.ts"
```

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T011)
3. Complete Phase 3: US1 — Auth (T012-T017)
4. Complete Phase 4: US2 — Edge Function refine (T018-T025)
5. **STOP and VALIDATE**: Record audio, verify Edge Function is called, refined text appears in UI and clipboard

### Incremental Delivery

1. Setup + Foundational → Supabase project ready
2. Add US1 (Auth) → User can log in → **Login MVP**
3. Add US2 (Refine via Edge Function) → Full pipeline with backend → **Core MVP**
4. Add US3 (History) → User can browse past transcriptions
5. Add US4 (Realtime) → Multi-device sync
6. Polish → Offline queue, error handling, final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 blocks US2, US3, US4 (all need auth)
- Edge Functions run on Deno — use `npm:` specifiers for dependencies (e.g., `npm:openai`)
- RLS policies must be tested after deployment
- Supabase CLI must be installed (T001) before any `supabase` commands
