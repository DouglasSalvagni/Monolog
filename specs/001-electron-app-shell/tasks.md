---

description: "Task list for Electron App Shell feature implementation"

---

# Tasks: Electron App Shell

**Input**: Design documents from `/specs/001-electron-app-shell/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in spec — manual validation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Electron desktop app**: `src/main/`, `src/preload/`, `src/renderer/src/` at repository root
- Paths follow the electron-vite three-process layout

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Scaffold project with `npm create @quick-start/electron@latest monolog -- --template react-ts`
- [ ] T002 [P] Install Zustand dependency (`npm install zustand`)
- [ ] T003 [P] Install and configure Tailwind CSS v4 (`npm install -D tailwindcss @tailwindcss/vite`) in `electron.vite.config.ts`
- [ ] T004 [P] Create tray icon PNG assets (16x16 idle and recording) in `src/renderer/src/assets/`
- [ ] T005 [P] Setup `resources/icon.png` (256x256 app icon for packaging)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create Zustand recording store in `src/renderer/src/store/recordingStore.ts` with status, transcriptText, and actions (startRecording, stopRecording, setTranscript, finishProcessing, resetToIdle)
- [ ] T007 [P] Setup preload IPC bridge in `src/preload/index.ts` exposing contextBridge API for recording channels
- [ ] T008 [P] Create IPC type declarations in `src/preload/index.d.ts` matching the contracts in `contracts/ipc-contracts.md`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - System Tray Presence (Priority: P1) 🎯 MVP

**Goal**: App runs in background with tray icon showing idle/recording state, context menu with Show/Hide and Quit.

**Independent Test**: Launch app → verify tray icon appears within 3s → right-click shows menu → Quit terminates process.

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create tray module in `src/main/tray.ts` with idle/recording icons and context menu (Show/Hide, Quit)
- [ ] T010 [US1] Integrate tray with main process in `src/main/index.ts` — create tray on app ready, destroy on quit
- [ ] T011 [US1] Implement window close → tray minimize behavior (hide window instead of quitting) in `src/main/index.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Global Hotkey Recording Toggle (Priority: P2)

**Goal**: Press `Alt+Shift+R` from any app to toggle recording. Tray icon reflects state.

**Independent Test**: Focus another app → press `Alt+Shift+R` → tray icon changes to recording → press again → returns to idle.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Create shortcuts module in `src/main/shortcuts.ts` registering `Alt+Shift+R` via electron globalShortcut
- [ ] T013 [US2] Wire hotkey to send `recording:started` / `recording:stopped` IPC events to renderer from `src/main/shortcuts.ts`
- [ ] T014 [US2] Connect hotkey state changes to tray icon switching via `tray.setImage()` in `src/main/tray.ts`

**Checkpoint**: User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Recording State UI (Priority: P3)

**Goal**: Non-intrusive overlay shows recording status (idle, recording, processing) without stealing focus.

**Independent Test**: Start recording → overlay appears with "Recording..." → stop → shows "Processing..." → auto-hides.

### Implementation for User Story 3

- [ ] T015 [P] [US3] Create RecordingOverlay component in `src/renderer/src/components/RecordingOverlay.tsx` — frameless popup with state-dependent text
- [ ] T016 [P] [US3] Create StatusIndicator component in `src/renderer/src/components/StatusIndicator.tsx` — small badge showing current state
- [ ] T017 [US3] Wire overlay to Zustand store and IPC events in `src/renderer/src/App.tsx` — subscribe to `recording:state-changed` IPC event

**Checkpoint**: User Stories 1-3 should all work independently.

---

## Phase 6: User Story 4 - Clipboard Integration (Mock) (Priority: P3)

**Goal**: After processing completes, mock text is auto-copied to clipboard. Full cycle works end-to-end.

**Independent Test**: Start → stop recording → wait for processing → paste in text editor → see placeholder text.

### Implementation for User Story 4

- [ ] T018 [P] [US4] Implement mock processing timer in `src/renderer/src/store/recordingStore.ts` (2s setTimeout simulating LLM refinement)
- [ ] T019 [US4] Implement clipboard write using `navigator.clipboard.writeText()` on processing complete in `src/renderer/src/App.tsx`
- [ ] T020 [US4] Full cycle integration — ensure idle → recording → processing → clipboard → idle flows correctly end-to-end

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T021 [P] Verify all checklist items from `quickstart.md` pass
- [ ] T022 Run the app and validate no console errors or unhandled rejections
- [ ] T023 Verify app stays under 150MB RAM in idle state (`SC-005`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1): No dependencies on other stories — MVP!
  - US2 (P2): Can be done independently after Foundational — no hard dependency on US1
  - US3 (P3): Requires IPC bridge from Foundational — stylistically depends on US2 for state transitions
  - US4 (P3): Requires Zustand store from Foundational — independent of UI components
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational — integrates with US1 (tray icon) but is independently testable with console logs
- **User Story 3 (P3)**: Can start after Foundational — independently testable via manual IPC trigger
- **User Story 4 (P3)**: Can start after Foundational — independently testable with mock data

### Within Each User Story

- Models (Zustand store) before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004, T005)
- All Foundational tasks marked [P] can run in parallel (T007, T008)
- Once Foundational phase completes, US1, US2, US3, US4 can all start in parallel
- UI components within a story marked [P] can run in parallel (e.g., T015, T016)

---

## Parallel Example: User Story 1

```bash
# Launch tray module and assets together:
Task: "Create tray module in src/main/tray.ts"
Task: "Create tray icon assets in src/renderer/src/assets/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (System Tray)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (System Tray) → Test independently → first runnable app!
3. Add US2 (Global Hotkey) → Test independently → core interaction works
4. Add US3 (Recording UI) → Test independently → visual feedback added
5. Add US4 (Clipboard Mock) → Test independently → full mock pipeline

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (System Tray) — MVP!
   - Developer B: US2 (Global Hotkey)
   - Developer C: US3 (Recording UI)
3. Any developer can pick up US4 after their story completes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
