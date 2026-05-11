# Quickstart: Skills Feature

## What is this?

A skill is a reusable prompt filter that users create and optionally activate to modify the refined text output. Skills are stored in Supabase, synced across devices, and applied during LLM refinement.

## Key Concepts

- **Skill**: A named prompt (e.g., "Tom Formal", "Resumir") that augments the base refinement prompt
- **Active skill**: At most one skill can be active at a time — selected via dropdown on the result screen
- **Pipeline**: Skill prompt is combined with the base system prompt before sending to the LLM

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/002_create_user_skills.sql` | **Create** | New table + RLS + Realtime |
| `supabase/functions/refine/index.ts` | Modify | Accept `skillPrompt`, append to system prompt |
| `packages/shared/src/index.ts` | Modify | Add `SkillData` type, extend `RefineRequest` |
| `apps/desktop/src/renderer/src/store/skillStore.ts` | **Create** | Zustand store for skills CRUD |
| `apps/desktop/src/renderer/src/store/recordingStore.ts` | Modify | Add `activeSkill` state |
| `apps/desktop/src/renderer/src/components/SkillSelector.tsx` | **Create** | Skill dropdown UI |
| `apps/desktop/src/renderer/src/components/SkillManager.tsx` | **Create** | Skill CRUD dialog |
| `apps/desktop/src/renderer/src/components/SkillForm.tsx` | **Create** | Create/edit form |
| `apps/desktop/src/renderer/src/App.tsx` | Modify | Wire SkillSelector + SkillManager |
| `apps/desktop/src/main/recording.ts` | Modify | Pass `skillPrompt` to Edge Function + fallback |
| `apps/desktop/src/main/supabase.ts` | Modify | Accept `skillPrompt` in `callRefineEdgeFunction` |
| `apps/desktop/src/main/refine.ts` | Modify | Accept `skillPrompt` in `refineText` fallback |

## Implementation Order

1. Shared types (`packages/shared/src/index.ts`)
2. Supabase migration (`002_create_user_skills.sql`)
3. Edge Function update (`refine/index.ts`)
4. Main Process updates (`supabase.ts`, `recording.ts`, `refine.ts`)
5. Zustand stores (`skillStore.ts`, update `recordingStore.ts`)
6. UI components (`SkillSelector`, `SkillManager`, `SkillForm`)
7. Wire into `App.tsx`

## Testing

- **Unit**: Zustand store actions (CRUD, active skill toggling)
- **Integration**: IPC flow from renderer → Main Process → Edge Function with skill prompt
- **E2E**: Create skill → select it → record → verify refined text reflects skill prompt
