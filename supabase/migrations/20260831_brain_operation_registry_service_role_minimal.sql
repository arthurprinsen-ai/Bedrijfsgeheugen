-- P0 operation registry hardening: make service_role privileges deterministic and minimal.

revoke all on table public.brain_operations from service_role;
grant select, insert, update on table public.brain_operations to service_role;

comment on table public.brain_operations is
  'Canonical P0 operation/idempotency registry. Server-only; RLS enabled; client roles have no table privileges; service_role is limited to SELECT/INSERT/UPDATE.';
