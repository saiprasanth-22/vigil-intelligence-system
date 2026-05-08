create extension if not exists "pgcrypto";

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  content_type text,
  size integer default 0,
  status text not null default 'processing',
  chunk_count integer default 0,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  file_id uuid not null references files(id) on delete cascade,
  chunk_index integer not null,
  text text not null,
  file_name text,
  created_at timestamptz not null default now()
);

create table if not exists vectors (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  file_id uuid not null references files(id) on delete cascade,
  chunk_id uuid not null references chunks(id) on delete cascade,
  embedding jsonb not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists live_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  metric text not null,
  value double precision not null,
  source text,
  timestamp text,
  metadata jsonb not null default '{}',
  is_anomaly boolean not null default false,
  anomaly_reason text,
  created_at timestamptz not null default now()
);

create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  message text not null,
  mode text not null,
  answer text not null,
  sources jsonb not null default '[]',
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  action text not null,
  success boolean not null default true,
  latency_ms integer,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists errors (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  action text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists rag_traces (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  chat_id uuid,
  query text not null,
  mode text not null,
  retrieved_chunks jsonb not null default '[]',
  live_events jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table files enable row level security;
alter table chunks enable row level security;
alter table vectors enable row level security;
alter table live_events enable row level security;
alter table chat_history enable row level security;
alter table logs enable row level security;
alter table errors enable row level security;
alter table rag_traces enable row level security;

create policy "Users can read own files" on files for select using (auth.uid()::text = user_id);
create policy "Users can read own chunks" on chunks for select using (auth.uid()::text = user_id);
create policy "Users can read own vectors" on vectors for select using (auth.uid()::text = user_id);
create policy "Users can read own live events" on live_events for select using (auth.uid()::text = user_id);
create policy "Users can read own chat history" on chat_history for select using (auth.uid()::text = user_id);
create policy "Users can read own logs" on logs for select using (auth.uid()::text = user_id);
create policy "Users can read own errors" on errors for select using (auth.uid()::text = user_id);
create policy "Users can read own rag traces" on rag_traces for select using (auth.uid()::text = user_id);

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;
