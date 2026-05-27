create table if not exists operators (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id text primary key,
  name text not null,
  title text not null,
  avatar text not null,
  accent_color text not null,
  system_prompt text not null,
  tools jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete set null,
  title text not null,
  original_brief text not null,
  cleaned_brief text not null,
  due_at timestamptz,
  priority text not null,
  assigned_by text not null,
  delegation_plan jsonb not null default '[]'::jsonb,
  status text not null,
  result text not null default '',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mission_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references missions(id) on delete cascade,
  live_message_id uuid,
  agent_id text not null,
  stage text not null,
  input_summary text not null,
  output_summary text not null,
  token_usage integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists live_messages (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete set null,
  role text not null,
  text text not null,
  agents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  external_id text,
  title text not null,
  due_at timestamptz,
  source text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  category text not null,
  title text not null,
  observation text not null,
  suggested_action text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists health_snapshots (
  id uuid primary key default gen_random_uuid(),
  active_model text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
