# Tasks: Skills

**Input**: Design documents from `/specs/004-skills/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed — this feature modifies an existing project.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add SkillData type and extend RefineRequest with optional skillPrompt in `packages/shared/src/index.ts`
- [X] T002 [P] Create Supabase migration `supabase/migrations/002_create_user_skills.sql` with user_skills table, indexes, RLS policies, and Realtime publication (see data-model.md)
- [X] T003 Modify Edge Function `supabase/functions/refine/index.ts` to accept optional `skillPrompt` field in request body and append it to the system prompt

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 2 - Gerenciar Skills (Priority: P1)

**Goal**: User can create, edit, list, and delete skills via a dedicated manager dialog

**Independent Test**: Criar uma skill com nome "Tom Formal" e prompt "Reescreva em tom formal". Verificar que aparece na lista. Editar o prompt. Excluir a skill.

### Implementation for User Story 2

- [X] T004 [P] Create `skillStore.ts` Zustand store at `apps/desktop/src/renderer/src/store/skillStore.ts` with fetchSkills, createSkill, updateSkill, deleteSkill actions (see data-model.md for interface)
- [X] T005 [P] Create `SkillForm.tsx` component at `apps/desktop/src/renderer/src/components/SkillForm.tsx` with name, prompt, description fields and validation (name + prompt required, max lengths per data-model.md)
- [X] T006 Create `SkillManager.tsx` dialog component at `apps/desktop/src/renderer/src/components/SkillManager.tsx` using SkillForm for create/edit, with list view, copy, and delete actions

**Checkpoint**: User can manage skills — list, create, edit, and delete

---

## Phase 4: User Story 1 - Aplicar Skill na Transcrição (Priority: P1) 🎯 MVP

**Goal**: User can select an active skill before copying refined text, and the skill prompt modifies the LLM output

**Independent Test**: Gravar áudio, selecionar uma skill "Resumir" na UI, verificar que o texto refinado copiado reflete o prompt da skill

### Implementation for User Story 1

- [X] T007 Add `activeSkill` state (ActiveSkill | null) and `setActiveSkill` action to `apps/desktop/src/renderer/src/store/recordingStore.ts` (see ActiveSkill interface in data-model.md)
- [X] T008 [P] Create `SkillSelector.tsx` component at `apps/desktop/src/renderer/src/components/SkillSelector.tsx` — dropdown listing user skills, sets activeSkill in recordingStore on selection, shows "No skill" when none active
- [X] T009 Modify `apps/desktop/src/renderer/src/App.tsx` to import and render SkillSelector in the result panel and wire SkillManager access (button or link)
- [X] T010 Modify `apps/desktop/src/main/supabase.ts` — accept optional `skillPrompt` parameter in `callRefineEdgeFunction()`, include it in the `supabase.functions.invoke` body
- [X] T011 Modify `apps/desktop/src/main/recording.ts` — read active skill prompt (via IPC or env) and pass it to `callRefineEdgeFunction()`; on fallback, pass to `fallbackRefine()`
- [X] T012 Modify `apps/desktop/src/main/refine.ts` — accept optional `skillPrompt` parameter in `refineText()`, append it to the system prompt in the OpenAI SDK call

**Checkpoint**: User can select a skill before recording, and the refined text reflects the skill prompt

---

## Phase 5: User Story 3 - Sincronização de Skills (Priority: P2)

**Goal**: Skills created on one device appear on another device in real-time

**Independent Test**: Criar skill no dispositivo A, verificar que aparece no dispositivo B em até 5 segundos

### Implementation for User Story 3

- [ ] T013 Add Realtime subscription to `apps/desktop/src/renderer/src/store/skillStore.ts` — subscribe to `postgres_changes` on `user_skills` table, update skills list on insert/update/delete events; clear activeSkill in recordingStore if active skill is deleted remotely

**Checkpoint**: Skills sync across devices via Supabase Realtime

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T014 Run quickstart.md validation — verify all files are created/modified as listed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately. BLOCKS all user stories.
- **User Story 2 (Phase 3)**: Depends on Foundational completion
- **User Story 1 (Phase 4)**: Depends on Foundational + User Story 2 (skills must exist to select)
- **User Story 3 (Phase 5)**: Depends on User Story 2 (adds Realtime to skillStore)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 1 (P1)**: Depends on skills existing (US2) — skills must be available to select
- **User Story 3 (P2)**: Depends on skillStore existing (US2) — adds Realtime layer

### Within Each User Story

- Models/stores before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 (Foundational shared types + migration) can run in parallel
- T004 and T005 (store + form) can run in parallel
- T008 and T010 (component + main process changes) can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all foundational tasks together:
Task: "Create T001 Add SkillData type and extend RefineRequest in packages/shared/src/index.ts"
Task: "Create T002 Create Supabase migration 002_create_user_skills.sql"

# Launch store + form together:
Task: "Create T004 Create skillStore.ts Zustand store"
Task: "Create T005 Create SkillForm.tsx component"
```

## Parallel Example: User Story 1

```bash
# Launch component + main process changes together:
Task: "Create T008 Create SkillSelector.tsx dropdown component"
Task: "Create T010 Modify supabase.ts to accept skillPrompt"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 2: Foundational (shared types, migration, Edge Function)
2. Complete Phase 3: User Story 2 (skill CRUD — so skills exist)
3. Complete Phase 4: User Story 1 (select and apply skills)
4. **STOP and VALIDATE**: Create a skill → select it → record → verify refined text reflects the skill
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Migration applied, shared types updated, Edge Function ready
2. Add User Story 2 → Skills can be created and managed → Test independently
3. Add User Story 1 → Skills can be applied to transcriptions → Test independently (MVP!)
4. Add User Story 3 → Skills sync across devices → Test independently
5. Each story adds value without breaking previous stories
