-- Create transcriptions table
create table if not exists public.transcriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null,
  refined_text text not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_transcriptions_user_id on public.transcriptions (user_id);
create index if not exists idx_transcriptions_created_at on public.transcriptions (created_at desc);

-- Enable Row-Level Security
alter table public.transcriptions enable row level security;

-- RLS: users can only see their own transcriptions
create policy "Users can view their own transcriptions"
  on public.transcriptions
  for select
  using (auth.uid() = user_id);

-- RLS: users can insert their own transcriptions
create policy "Users can insert their own transcriptions"
  on public.transcriptions
  for insert
  with check (auth.uid() = user_id);

-- RLS: users can delete their own transcriptions
create policy "Users can delete their own transcriptions"
  on public.transcriptions
  for delete
  using (auth.uid() = user_id);

-- Enable Realtime for the transcriptions table
-- (enabled via Supabase dashboard: Database → Replication → add table)
