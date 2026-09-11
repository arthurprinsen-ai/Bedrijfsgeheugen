-- P0 operation registry hardening: internal control-plane state is server-only.

alter table public.brain_operations enable row level security;

revoke all on table public.brain_operations from public, anon, authenticated;
grant select, insert, update on table public.brain_operations to service_role;

alter function public.brain_create_operation(text,text,text,text,text,text)
  set search_path = public;
revoke all on function public.brain_create_operation(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.brain_create_operation(text,text,text,text,text,text) to service_role;

comment on table public.brain_operations is
  'Canonical P0 operation/idempotency registry. Server-only; RLS enabled; client roles have no table privileges. RESULT_UNKNOWN is reconciled by readback using the same operation identity.';
