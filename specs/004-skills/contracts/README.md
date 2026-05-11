# Contracts: Skills Feature

This directory documents the interfaces between components in the Skills system.

| Contract | Source | Target | Description |
|----------|--------|--------|-------------|
| [IPC: Skill Selection](skill-selection-ipc.md) | Renderer → Main Process | Passes active skill prompt for Edge Function call |
| [Edge Function: refine](edge-function-refine.md) | Main Process → Supabase | Extended `RefineRequest` with optional `skillPrompt` |
| [Supabase: user_skills API](supabase-skills-api.md) | Renderer → Supabase | CRUD operations for user skills |
