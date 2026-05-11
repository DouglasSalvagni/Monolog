# Contract: Edge Function `refine` — Extended

## Request (extended)

```typescript
interface RefineRequest {
  rawText: string
  durationSeconds?: number
  skillPrompt?: string  // NEW: prompt from active skill
}
```

## Behavior Change

When `skillPrompt` is present, the Edge Function appends it to the system prompt:

**Base system prompt** (existing):
> "You are a text refinement assistant. Clean up speech transcripts. Fix punctuation, capitalization, and remove filler words (um, uh, é, tipo, né, assim). Do NOT add new information, do NOT summarize. Return ONLY the refined text."

**When `skillPrompt` is provided**, the combined system prompt becomes:

```
{base prompt}

Additional instruction from user skill:
{skillPrompt}
```

## Response

Unchanged — returns `{ success: true, data: { id, refinedText, createdAt } }`.

## Error Handling

- If `skillPrompt` is empty string: ignore (treat as not provided)
- If combined prompt exceeds token limit: the LLM API handles truncation (model-specific context window)
