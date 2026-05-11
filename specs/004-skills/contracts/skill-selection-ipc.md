# IPC Contract: Skill Selection

**Direction**: Renderer → Main Process

## Messages

### Renderer → Main Process: `refine:skill-prompt`

Sent before or alongside the Edge Function call when a skill is active.

```typescript
interface SkillPromptPayload {
  skillPrompt: string  // the prompt text from the active skill
}
```

The Main Process receives this and includes it in the Edge Function `invoke` body.

### Main Process → Renderer: No new messages

The existing `transcription:refined` event carries the refined text. No additional IPC messages are needed.

## Flow

1. User selects skill in UI → `recordingStore.setActiveSkill(skill)` (local state)
2. Recording stops → Main Process calls `callRefineEdgeFunction(rawText, durationSeconds, skillPrompt?)`
3. Main Process includes `skillPrompt` in the `supabase.functions.invoke('refine', ...)` body
4. Edge Function returns refined text → Main Process copies to clipboard → sends `transcription:refined` to renderer
