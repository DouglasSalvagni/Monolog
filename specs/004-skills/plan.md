# Implementation Plan: Skills

**Branch**: `004-skills` | **Date**: 2026-05-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-skills/spec.md`

## Summary

Add a Skills system to Monolog where users create reusable prompt filters that modify refined text. Skills are stored in Supabase (user-specific, synced across devices), activated one at a time via a UI selector, and their prompt is combined with the base refinement prompt before LLM processing. The existing Edge Function is extended to accept an optional `skillPrompt` parameter.

## Technical Context

**Language/Version**: TypeScript (Strict), Deno (Edge Functions)
**Primary Dependencies**: Supabase client, Zustand, Deepgram SDK, OpenAI SDK
**Storage**: PostgreSQL via Supabase — new `user_skills` table
**Testing**: Vitest (client), Deno test (Edge Function)
**Target Platform**: Linux/Windows Desktop (Electron)
**Project Type**: Desktop app feature (Electron + React)
**Performance Goals**: Skill prompt processing adds <500ms to refinement pipeline; skills list loads in <1s
**Constraints**: <150MB RAM budget; single skill active at a time; offline fallback must handle skill prompt
**Scale/Scope**: <50 skills per user initially; skills are user-specific text strings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Notes |
|-----------|-------|-------|
| I. Speed as a Resource | PASS | Skill prompt is concatenated to existing prompt — no extra API call. <500ms added latency target. |
| II. Zero Friction | PASS | Skill selector is a simple dropdown/toggle on the result screen — no modal flow required. |
| III. Privacy & Transparency | PASS | Skill prompts are user-authored text. Stored in Supabase with RLS. Follows same data handling as transcriptions. |
| IV. API-First Extensibility | PASS | Skills stored in Supabase. Edge Function modified to accept `skillPrompt`. Desktop renderer calls Main Process (no API keys in renderer). |
| V. Quality & Performance | PASS | Skills add minimal state (<1KB per skill). Edge Function already handles prompt injection. Offline fallback passes skill prompt to local LLM call. |

**GATE: PASS** — No unjustified violations.

## Research Results

See [research.md](research.md) for detailed findings. Key decisions:
- `skillPrompt` field added to `RefineRequest` (shared types + Edge Function body)
- New `user_skills` table with RLS following transcriptions pattern
- Zustand store gets `activeSkill` state
- Renderer sends skill prompt via IPC → Main Process → Edge Function
- Offline fallback reads active skill from store and passes to local refine

## Project Structure

### Documentation (this feature)

```
specs/004-skills/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── skill-system-contracts.md
```

### Source Code Changes

```
apps/desktop/src/
├── main/
│   ├── recording.ts     # [MODIFY] Pass skillPrompt to Edge Function + fallback
│   └── supabase.ts      # [MODIFY] Accept and forward skillPrompt
├── renderer/src/
│   ├── store/
│   │   ├── recordingStore.ts  # [MODIFY] Add activeSkill state
│   │   └── skillStore.ts      # [NEW] Zustand store for skills CRUD
│   ├── components/
│   │   ├── SkillSelector.tsx  # [NEW] Dropdown/toggle to select active skill
│   │   ├── SkillManager.tsx   # [NEW] Full CRUD management dialog
│   │   └── SkillForm.tsx      # [NEW] Create/edit skill form
│   ├── App.tsx         # [MODIFY] Add SkillSelector to result panel, wire SkillManager
│   └── api/
│       └── skills.ts    # [NEW] Supabase client calls for skills CRUD

supabase/
├── functions/refine/
│   └── index.ts         # [MODIFY] Accept skillPrompt, combine with system prompt
└── migrations/
    └── 002_create_user_skills.sql  # [NEW] Create user_skills table + RLS

packages/shared/src/
└── index.ts             # [MODIFY] Add SkillData type, extend RefineRequest
```

**Structure Decision**: Monorepo with existing layout — skills feature touches all layers (shared types, main process, renderer UI, Supabase Edge Function + migration).

## Complexity Tracking

No complexity violations — this feature follows existing patterns (CRUD + RLS, Zustand state, IPC bridge) without introducing new architectural elements.
