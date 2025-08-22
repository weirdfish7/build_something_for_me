-- Postgres schema: minimal users + sessions with RLS policies
-- Usage: set per-request context with SET LOCAL app.user_id = '<user_id>' (bigint)

-- Helper schema and function to read user id from a GUC
create schema if not exists app;

create or replace function app.current_user_id() returns bigint
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::bigint
$$;
comment on function app.current_user_id() is 'Return current authenticated user id from GUC app.user_id (set by application).';

-- Application tables
create table if not exists users (
  id           bigserial primary key,
  email        text not null check (position('@' in email) > 1),
  password_hash text not null,
  role         text not null default 'user' check (role in ('user','admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Case-insensitive unique email
create unique index if not exists users_email_lower_idx on users (lower(email));

create table if not exists sessions (
  id           bigserial primary key,
  user_id      bigint not null references users(id) on delete cascade,
  token        text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at   timestamptz not null
);

create unique index if not exists sessions_token_unique_idx on sessions (token);
create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);

-- Enable Row Level Security
alter table users enable row level security;
alter table sessions enable row level security;

-- Policies: users can access only their own data
-- Users
drop policy if exists users_select_self on users;
create policy users_select_self on users
  for select using (id = app.current_user_id());

drop policy if exists users_update_self on users;
create policy users_update_self on users
  for update using (id = app.current_user_id())
  with check (id = app.current_user_id());

drop policy if exists users_delete_self on users;
create policy users_delete_self on users
  for delete using (id = app.current_user_id());

-- Sessions (owner-only access)
drop policy if exists sessions_access_self on sessions;
create policy sessions_access_self on sessions
  for all using (user_id = app.current_user_id())
  with check (user_id = app.current_user_id());

comment on table users is 'Registered users. RLS restricts visibility to the owning user.';
comment on table sessions is 'Login sessions. RLS restricts to sessions belonging to the current user.';
comment on policy users_select_self on users is 'Allow users to select their own row.';
comment on policy users_update_self on users is 'Allow users to update their own row.';
comment on policy users_delete_self on users is 'Allow users to delete their own row.';
comment on policy sessions_access_self on sessions is 'Allow users to manage only their own sessions.';

-- Optional: keep updated_at current on users
create or replace function app.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_users_touch_updated_at on users;
create trigger trg_users_touch_updated_at
  before update on users
  for each row execute procedure app.touch_updated_at();

-- Note: application should set the user context per request:
--   SET LOCAL app.user_id = '<bigint user_id>';
-- Without it, policies evaluate to NULL and deny access by default.
