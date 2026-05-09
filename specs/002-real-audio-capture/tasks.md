# Tasks: Real Audio Capture

**Input**: Design documents from `specs/002-real-audio-capture/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Branch**: `002-real-audio-capture`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between these tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Project initialization — install audio capture library

- [X] T001 Add naudiodon v2.3.6 to dependencies in package.json (npm install naudiodon@2.3.6)

---

## Phase 2: Foundational — Audio Capture Core Module

**Purpose**: Core audio capture infrastructure that US1, US2, and US3 all build upon

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create src/main/audio-capture.ts with AudioCaptureSession class wrapping naudiodon AudioIO — start(), stop(), getBuffer(), getDevices(), audio level callback

**Checkpoint**: Audio capture module ready — can enumerate devices and start/stop capture from Main Process

---

## Phase 3: User Story 1 — Capturar Áudio do Microfone (Priority: P1) 🎯 MVP

**Goal**: Usuario pressiona `Alt+Shift+R`, microfone captura audio real em 16kHz mono 16-bit PCM. Pressiona de novo, captura para e buffer fica em memoria.

**Independent Test**: Iniciar gravacao, falar "teste de audio" por alguns segundos, parar. Verificar no console que chunks de audio foram capturados (tamanho dos buffers, duracao). Buffer resultante contem dados PCM validos.

### Implementation

- [X] T003 [US1] Refactor src/main/recording.ts to delegate start/stop to audio-capture.ts instead of just toggling a boolean
- [X] T004 [US1] Wire audio-capture events to existing IPC channels in src/main/recording.ts (reuse recording:started / recording:stopped / recording:state-changed)
- [X] T005 [P] [US1] Add safety timer (10min auto-stop) to audio-capture.ts that stops capture and emits timeout event
- [X] T006 [P] [US1] Add 500ms debounce logic to src/main/recording.ts toggleRecording() to prevent rapid toggle flickering
- [X] T007 [US1] Add audio control methods to preload API in src/preload/index.ts and src/preload/index.d.ts
- [X] T008 [US1] Integrate audio capture state with Zustand store in src/renderer/src/store/recordingStore.ts (remove 'processing' status, wire to actual IPC events)
- [X] T009 [US1] Update src/renderer/src/App.tsx — remove mock clipboard logic, wire to real IPC state changes
- [X] T010 [US1] Add start/stop IPC handlers in src/main/index.ts for audio:start-capture and audio:stop-capture channels

**Checkpoint**: US1 complete — audio recording works end-to-end. Audio is captured, buffered, and available after stop.

---

## Phase 4: User Story 2 — Feedback Visual de Nível de Áudio (Priority: P2)

**Goal**: Durante a gravacao, overlay mostra VU meter que reage a voz do usuario em tempo real.

**Independent Test**: Iniciar gravacao, falar em diferentes volumes. Observar indicador de nivel na overlay reagir proporcionalmente em <100ms.

### Implementation

- [X] T011 [P] [US2] Add RMS level calculation to audio-capture.ts and emit audio:level IPC events every ~100ms during recording
- [X] T012 [P] [US2] Add audio:level IPC listener in src/preload/index.ts and update src/preload/index.d.ts types
- [X] T013 [P] [US2] Add audioLevel field to Zustand store in src/renderer/src/store/recordingStore.ts
- [X] T014 [US2] Create AudioMeter component in src/renderer/src/components/AudioMeter.tsx — visual bar that reacts to 0-1 level values
- [X] T015 [US2] Integrate AudioMeter into src/renderer/src/components/RecordingOverlay.tsx
- [X] T016 [US2] Wire audio:level IPC → store → AudioMeter in src/renderer/src/App.tsx

**Checkpoint**: US2 complete — VU meter shows real-time audio level during recording.

---

## Phase 5: User Story 3 — Tratamento de Erros de Microfone (Priority: P3)

**Goal**: Se microfone nao estiver disponivel, app nao trava — mostra erro na overlay e volta para idle.

**Independent Test**: Iniciar app sem microfone conectado. Pressionar `Alt+Shift+R`. App nao trava, exibe "Microfone nao encontrado", permanece em idle.

### Implementation

- [ ] T017 [P] [US3] Add device check in audio-capture.ts — enumerate devices with getDevices() before start, emit typed error codes (DEVICE_NOT_FOUND, PERMISSION_DENIED, STREAM_ERROR, AUDIO_SYSTEM_UNAVAILABLE)
- [ ] T018 [P] [US3] Add audio:error IPC channel to src/main/index.ts — forward error events to renderer
- [ ] T019 [P] [US3] Add audio:error listener in src/preload/index.ts and update src/preload/index.d.ts types
- [ ] T020 [P] [US3] Add error state fields (errorMessage, errorCode) to Zustand store in src/renderer/src/store/recordingStore.ts
- [ ] T021 [US3] Add error display UI in src/renderer/src/components/RecordingOverlay.tsx — show error message with dismiss
- [ ] T022 [US3] Wire audio:error IPC → store → overlay in src/renderer/src/App.tsx
- [ ] T023 [US3] Handle mid-recording device disconnection in audio-capture.ts (stream error event → emit error → cleanup)

**Checkpoint**: US3 complete — all error scenarios handled gracefully.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, verification, and edge case hardening

- [ ] T024 [P] Run `npm run typecheck` and fix any TypeScript errors
- [ ] T025 [P] Run `npm run lint` and fix any lint errors
- [ ] T026 Verify audio buffer is cleaned up on app quit (app.on('before-quit') in src/main/index.ts)
- [ ] T027 Remove any remaining mock/placeholder code from renderer components
- [ ] T028 Run through all quickstart.md manual test scenarios and verify they pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — install naudiodon first
- **Foundational (Phase 2)**: Depends on Setup — T002 is the core module
- **US1 (Phase 3)**: Depends on T001, T002 — core audio flow
- **US2 (Phase 4)**: Depends on US1 (T011 uses audio-capture.ts from T002, T014-T016 need US1 UI)
- **US3 (Phase 5)**: Depends on Foundational (T002) — can start in parallel with US1 but needs the capture module
- **Polish (Phase 6)**: Depends on US1, US2, US3 being complete

### User Story Dependencies

- **US1 (P1)**: Core — no dependencies on other stories. Start after Phase 2.
- **US2 (P2)**: Depends on US1 (needs audio capture working to measure level). Start after US1.
- **US3 (P3)**: Depends on Foundational only (audio-capture.ts module). Can start alongside US1.

### Within Each User Story

- Core/Models first — then services — then UI integration
- US1: audio-capture.ts (done) → recording.ts → preload → store → App.tsx

### Parallel Opportunities

- T005 + T006 (both independent additions to capture and recording)
- T011 + T012 + T013 (RMS calc, IPC listener, store field — different files)
- T017 + T018 + T019 + T020 (error logic, IPC channel, preload, store — different files)
- All Phase 6 tasks are independent

## Parallel Example: User Story 1

```bash
# Safety timer and debounce can be done in parallel:
Task: "Add 10min safety timer to src/main/audio-capture.ts"
Task: "Add 500ms debounce to src/main/recording.ts"

# Preload and store can be done in parallel:
Task: "Add audio control methods to src/preload/index.ts"
Task: "Update Zustand store in src/renderer/src/store/recordingStore.ts"
```

## Parallel Example: User Story 2

```bash
# All three can run in parallel (different files):
Task: "Add RMS level calculation to src/main/audio-capture.ts and emit via IPC"
Task: "Add audio:level IPC listener in src/preload/index.ts"
Task: "Add audioLevel field to Zustand store in src/renderer/src/store/recordingStore.ts"
```

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (T002 — audio-capture.ts)
3. Complete Phase 3: US1 (T003–T010)
4. **STOP and VALIDATE**: Run quickstart.md Test 1 — verify audio capture works end-to-end
5. Optional: Demo at this point

### Incremental Delivery

1. Setup + Foundational → Capture infrastructure ready
2. Add US1 → Audio capture works → **MVP complete** (recording with audio!)
3. Add US2 → VU meter feedback → **Enhanced UX**
4. Add US3 → Error handling → **Production-ready**
5. Polish → Quality verification

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 1 + Phase 2 (T001, T002 — ~30min)
2. Developer A → US1 (T003–T010)
3. Developer B: US2 (T011–T016) — after US1 is complete
4. Developer C: US3 (T017–T023) — can start after T002 is done
5. Team: Phase 6 together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 builds on US1 (needs audio capture working)
- US3 can be started after Phase 2 (only needs audio-capture.ts module)
- Commit after each task or logical group
- Run `npm run typecheck` frequently to catch TS errors early
- System dependency: `sudo apt-get install portaudio19-dev` on Linux (if bundled PortAudio doesn't work)
