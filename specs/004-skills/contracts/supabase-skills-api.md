# Contract: Supabase `user_skills` API

All CRUD operations use the Supabase client from the renderer's Main Process proxy via IPC, or directly from the renderer if the session token is available.

## Types

```typescript
interface UserSkill {
  id: string
  user_id: string
  name: string
  prompt: string
  description?: string
  created_at: string
  updated_at: string
}

interface CreateSkillInput {
  name: string
  prompt: string
  description?: string
}

interface UpdateSkillInput {
  name?: string
  prompt?: string
  description?: string
}
```

## Operations

### List Skills

```typescript
// Main Process
supabase.from('user_skills').select('*').order('created_at', { ascending: false })
```

### Create Skill

```typescript
supabase.from('user_skills').insert({ name, prompt, description })
```

### Update Skill

```typescript
supabase.from('user_skills').update({ name, prompt, description }).eq('id', skillId)
```

### Delete Skill

```typescript
supabase.from('user_skills').delete().eq('id', skillId)
```

## Realtime Subscription

```typescript
supabase
  .channel('user_skills_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'user_skills', filter: `user_id=eq.${userId}` },
    (payload) => { /* update skillStore */ }
  )
  .subscribe()
```
