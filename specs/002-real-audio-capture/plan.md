# Implementation Plan: Real Audio Capture

**Branch**: `002-real-audio-capture` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-real-audio-capture/spec.md`

## Summary

Replace the mock recording flow with real microphone audio capture in the
Electron Main Process using naudiodon (PortAudio bindings). Audio is captured
in 16kHz mono 16-bit PCM format, buffered in memory (transient, never
persisted), and a real-time VU meter is displayed in the overlay. No Deepgram,
Edge Functions, or Supabase integration — this is purely local audio capture.

## Technical Context

**Language/Version**: TypeScript 5.x Strict Mode, Node.js 24  
**Primary Dependencies**: naudiodon v2.3.6 (PortAudio bindings, built-in TS types)  
**Storage**: N/A — audio is transient, in-memory only  
**Testing**: Manual validation via console logs, VU meter visual inspection, and error scenario testing  
**Target Platform**: Linux (.AppImage/.deb), Windows (.exe)  
**Project Type**: desktop-app (Electron)  
**Performance Goals**: VU meter latency <100ms, RAM ≤150MB total including 19.2MB max audio buffer  
**Constraints**: Audio capture MUST happen in Main Process (per constitution); MUST NOT persist audio to disk  
**Scale/Scope**: Single-user desktop app, single default microphone

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|-----------|-------|
| I. Speed as a Resource | ✅ PASS | Audio capture streaming reduces latency vs. batch — VU meter <100ms refresh. No unnecessary buffering. |
| II. Zero Friction | ✅ PASS | Hotkey behavior unchanged; VU meter provides passive feedback without stealing focus. |
| III. Privacy & Transparency | ✅ PASS | Audio is transient, in-memory only — never persisted to disk. Main Process handles capture (per constitution). |
| IV. API-First Extensibility | ✅ PASS | Not applicable — no backend changes. Buffer interface prepares for Deepgram streaming in spec 003. |
| V. Quality & Performance | ✅ PASS | Total RAM budget (≤150MB) includes 19.2MB max audio buffer. Well within limit. |

No violations. Phase 0 and Phase 1 may proceed.

## Project Structure

### Documentation (this feature)

```text
specs/002-real-audio-capture/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — library research and decisions
├── data-model.md        # Phase 1 — entities and state model
├── quickstart.md        # Phase 1 — setup and test guide
├── contracts/
│   ├── README.md
│   └── audio-capture-ipc.md   # IPC channels for audio level streaming
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 — implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── index.ts              # Add audio IPC handlers
│   ├── recording.ts          # Refactored: delegate to audio-capture.ts
│   ├── audio-capture.ts      # (NEW) naudiodon wrapper
│   ├── shortcuts.ts          # Unchanged
│   └── tray.ts               # Unchanged
├── preload/
│   ├── index.ts              # Add audio level IPC listeners
│   └── index.d.ts            # Add audio capture API types
└── renderer/
    └── src/
        ├── App.tsx                    # Wire audio level + error handlers
        ├── components/
        │   ├── RecordingOverlay.tsx    # Add VU meter bar
        │   └── AudioMeter.tsx          # (NEW) VU meter component
        └── store/
            └── recordingStore.ts       # Add audioLevel + error state
```

**Structure Decision**: Single project — follows the existing Electron
three-process layout. All additions follow established patterns in spec 001.

## Complexity Tracking

No Constitution Check violations — Complexity Tracking is not required.
