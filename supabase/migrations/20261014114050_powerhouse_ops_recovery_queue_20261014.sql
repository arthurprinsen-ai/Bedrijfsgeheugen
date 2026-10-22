create schema if not exists powerhouse_ops;
create table if not exists powerhouse_ops.recovery_queue (
 id bigint generated always as identity primary key,
 task_key text not null,
 event_key text not null,
 payload jsonb not null default '{}'::jsonb,
 status text not null default 'pending' check (status in ('pending','running','succeeded','failed','dead')),
 attempts int not null default 0,
 max_attempts int not null default 5,
 next_attempt_at timestamptz not null default now(),
 locked_until timestamptz,
 last_error text,
 created_at timestamptz not null default now(),
 unique(task_key,event_key)
);
create index if not exists recovery_due_idx on powerhouse_ops.recovery_queue(next_attempt_at,id) where status in ('pending','failed');
revoke all on schema powerhouse_ops from public,anon,authenticated;
revoke all on all tables in schema powerhouse_ops from public,anon,authenticated;
