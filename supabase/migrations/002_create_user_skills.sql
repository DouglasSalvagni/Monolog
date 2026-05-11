-- Create user_skills table
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

-- Enable Row-Level Security
alter table public.user_skills enable row level security;

-- RLS: users can view their own skills
create policy "Users can view their own skills"
  on public.user_skills
  for select
  using (auth.uid() = user_id);

-- RLS: users can insert their own skills
create policy "Users can insert their own skills"
  on public.user_skills
  for insert
  with check (auth.uid() = user_id);

-- RLS: users can update their own skills
create policy "Users can update their own skills"
  on public.user_skills
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS: users can delete their own skills
create policy "Users can delete their own skills"
  on public.user_skills
  for delete
  using (auth.uid() = user_id);

-- Realtime publication
alter publication supabase_realtime add table public.user_skills;
