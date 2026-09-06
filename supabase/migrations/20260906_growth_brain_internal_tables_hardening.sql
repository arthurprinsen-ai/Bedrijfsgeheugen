alter table public.deferred_brain_writebacks enable row level security;
alter table public.powerhouse_event_idempotency enable row level security;
revoke all on public.deferred_brain_writebacks from anon, authenticated;
revoke all on public.powerhouse_event_idempotency from anon, authenticated;
grant all on public.deferred_brain_writebacks to service_role;
grant all on public.powerhouse_event_idempotency to service_role;
revoke execute on function public.claim_powerhouse_event(text,text,text,integer) from public, anon, authenticated;
grant execute on function public.claim_powerhouse_event(text,text,text,integer) to service_role;