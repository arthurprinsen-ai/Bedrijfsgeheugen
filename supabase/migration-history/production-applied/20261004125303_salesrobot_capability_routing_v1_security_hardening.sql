alter table public.powerhouse_channel_capabilities_v1 enable row level security;
revoke all on table public.powerhouse_channel_capabilities_v1 from public, anon, authenticated;
revoke all on function public.powerhouse_resolve_commercial_channel_v1(text,boolean,boolean,boolean) from public, anon, authenticated;
grant execute on function public.powerhouse_resolve_commercial_channel_v1(text,boolean,boolean,boolean) to service_role;
