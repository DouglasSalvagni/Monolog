# Implementation Plan: Electron App Shell

**Branch**: `001-electron-app-shell` | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-electron-app-shell/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Set up the Electron desktop app foundation: project scaffold, system tray
presence, global hotkey recording toggle (`Alt+Shift+R`), recording state UI
overlay, and mock clipboard integration. No backend or real audio capture.

## Technical Context

**Language/Version**: TypeScript 5.x Strict Mode, Node.js 24  
**Primary Dependencies**: Electron, Vite, React, Zustand, Tailwind CSS  
**Storage**: N/A (no persistence in this phase)  
**Testing**: Manual validation (Vitest + React Testing Library can be added in a follow-up)  
**Target Platform**: Linux (.AppImage/.deb), Windows (.exe)  
**Project Type**: desktop-app  
**Performance Goals**: Idle RAM ≤150MB, hotkey response <500ms  
**Constraints**: Must run in background after window close; tray icon must differentiate states; overlay must not steal focus  
**Scale/Scope**: Single-user desktop app shell, mock data only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|-----------|-------|
| I. Speed as a Resource | ✅ PASS | Mock data phase; architecture prepares for <2s pipeline |
| II. Zero Friction | ✅ PASS | Spec mandates tray + global hotkey + no window switching |
| III. Privacy & Transparency | ✅ PASS | No API keys or audio in this phase |
| IV. API-First Extensibility | ✅ PASS | Not applicable — no backend yet |
| V. Quality & Performance | ✅ PASS | ≤150MB RAM target in SC-005 |

No violations. Phase 0 and Phase 1 may proceed.

## Project Structure

### Documentation (this feature)

```text
specs/001-electron-app-shell/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
monolog/
├── src/
│   ├── main/            # Electron main process
│   │   ├── index.ts     # App entry, window creation
│   │   ├── tray.ts      # System tray icon + menu
│   │   └── shortcuts.ts # Global hotkey registration
│   ├── preload/         # Preload scripts
│   │   ├── index.ts     # Context bridge
│   │   └── index.d.ts   # Type declarations
│   └── renderer/        # React app
│       ├── src/
│       │   ├── App.tsx              # Root component
│       │   ├── components/
│       │   │   ├── RecordingOverlay.tsx  # Status overlay
│       │   │   └── StatusIndicator.tsx   # Tray state indicator
│       │   ├── store/
│       │   │   └── recordingStore.ts     # Zustand store
│       │   └── assets/
│       │       ├── icon-idle.png         # Tray icon (idle)
│       │       └── icon-recording.png    # Tray icon (recording)
│       └── index.html
├── resources/           # Electron build resources
│   └── icon.png         # App icon (256x256 for packaging)
├── electron.vite.config.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

**Structure Decision**: Single project — Electron desktop app with the standard
electron-vite three-process layout (main, preload, renderer). The renderer
follows a React component structure under `src/renderer/src/`.

## Complexity Tracking

No Constitution Check violations — Complexity Tracking is not required.
