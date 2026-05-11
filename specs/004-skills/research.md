# Research: Skills Feature

## Decision: Edge Function skillPrompt Integration

**Decision**: Add optional `skillPrompt` field to `RefineRequest` body. Edge Function appends it to the system prompt.
**Rationale**: Minimal change to existing flow. The Edge Function already constructs a system prompt — appending the skill prompt as an additional instruction requires no new infrastructure. Offline fallback (`refine.ts`) also accepts a skill prompt parameter.
**Alternatives considered**: 
- Second Edge Function call (rejected — doubles latency, violates Speed principle)
- Client-side post-processing (rejected — would require second LLM call or complex text manipulation)

## Decision: Supabase Table for Skills

**Decision**: New `user_skills` table following the exact pattern of `transcriptions` (UUID PK, user_id FK, RLS policies for select/insert/update/delete).
**Rationale**: Consistent with existing data model. Enables Realtime sync across devices. RLS ensures user isolation.
**Alternatives considered**:
- Local storage only (rejected — no cross-device sync)
- JSON column in user profile (rejected — harder to query, manage, and sync independently)

## Decision: Skill Selection UI Pattern

**Decision**: Dropdown selector in the result panel (post-recording) + dedicated SkillManager dialog.
**Rationale**: Follows Zero Friction principle — skill selection happens after recording when user is already looking at the result. Dedicated manager for CRUD operations keeps the main UI clean.
**Alternatives considered**:
- Toggle before recording (rejected — user may not know which skill they want until they see the transcript)
- Always-visible sidebar (rejected — too much UI chrome for a background utility)

## Decision: Zustand Store Split

**Decision**: New `skillStore.ts` for skills CRUD state + `activeSkill` property in `recordingStore.ts`.
**Rationale**: `recordingStore` already holds recording pipeline state — adding `activeSkill` keeps the activation choice near where it's consumed. Skills list/CRUD is a separate concern.
**Alternatives considered**:
- Single monolithic store (rejected — violates separation of concerns)
- React Context (rejected — Zustand is preferred per project conventions)

## Key Risks Mitigated

- **Token limit overflow**: Skill prompt + base prompt could exceed LLM context window. Mitigation: truncate base prompt proportionally; log warning.
- **Offline fallback**: Skill prompt must also apply when Edge Function is unavailable. Mitigation: pass `activeSkill.prompt` to `fallbackRefine()` in `refine.ts`.
- **Skill deletion while active**: Store must clear `activeSkill` if the active skill is deleted. Mitigation: `skillStore.deleteSkill()` checks and clears in `recordingStore`.
