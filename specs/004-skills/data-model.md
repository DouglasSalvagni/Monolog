# Data Model: Skills Feature

## Entity: UserSkill

```sql
create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  prompt text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_user_skills_user_id on public.user_skills (user_id);
create index if not exists idx_user_skills_created_at on public.user_skills (created_at desc);
```

### Validation Rules
- `name`: required, non-empty, max 100 chars
- `prompt`: required, non-empty, max 2000 chars
- `description`: optional, max 500 chars
- `user_id`: set automatically from authenticated user (never client-provided)

### RLS Policies

```sql
alter table public.user_skills enable row level security;

create policy "Users can view their own skills"
  on public.user_skills for select
  using (auth.uid() = user_id);

create policy "Users can insert their own skills"
  on public.user_skills for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own skills"
  on public.user_skills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own skills"
  on public.user_skills for delete
  using (auth.uid() = user_id);
```

### Realtime Publication

```sql
alter publication supabase_realtime add table public.user_skills;
```

## State Transitions

```
[Criação] → name + prompt preenchidos → INSERT user_skills
[Edição] → usuário modifica name/prompt/description → UPDATE user_skills
[Exclusão] → usuário remove skill → DELETE user_skills + se activeSkill === id, clear
[Ativação (local)] → usuário seleciona na UI → zustand recordingStore.activeSkill = { id, name, prompt }
[Desativação (local)] → usuário desseleciona → zustand recordingStore.activeSkill = null
```

## Local State (Zustand)

### recordingStore (extended)

```typescript
interface ActiveSkill {
  id: string
  name: string
  prompt: string
}

interface RecordingState {
  // ...existing properties
  activeSkill: ActiveSkill | null
  setActiveSkill: (skill: ActiveSkill | null) => void
}
```

### skillStore (new)

```typescript
interface SkillStoreState {
  skills: UserSkill[]
  loading: boolean
  error: string | null
  fetchSkills: () => Promise<void>
  createSkill: (name: string, prompt: string, description?: string) => Promise<UserSkill>
  updateSkill: (id: string, data: Partial<Pick<UserSkill, 'name' | 'prompt' | 'description'>>) => Promise<void>
  deleteSkill: (id: string) => Promise<void>
}
```
