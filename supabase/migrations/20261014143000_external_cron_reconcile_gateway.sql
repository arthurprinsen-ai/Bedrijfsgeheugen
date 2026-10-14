-- Purpose-scoped authentication for independent Netlify cron recovery.
-- The source credential is never stored in the repository or database.
create table if not exists powerhouse_ops.external_reconcile_credential (
 id boolean primary key default true check (id),
 token_sha256 bytea not null,
 rotated_at timestamptz not null default now()
);
revoke all on powerhouse_ops.external_reconcile_credential from public,anon,authenticated;
insert into powerhouse_ops.external_reconcile_credential(id,token_sha256)
values(true,decode('17f47cf2d4c7979489cba035851111926f5ec85b000def4b1396c7e807ae5ebe','hex'))
on conflict (id) do update set token_sha256=excluded.token_sha256,rotated_at=now();
drop function if exists public.powerhouse_external_cron_reconcile_v1();
create function public.powerhouse_external_cron_reconcile_v1(p_token text)
returns integer language plpgsql security definer set search_path=pg_catalog,public,powerhouse_ops as $body$
begin
 if p_token is null or length(p_token)<40
    or not exists(select 1 from powerhouse_ops.external_reconcile_credential
                  where id=true and token_sha256=sha256(convert_to(p_token,'UTF8'))) then
   raise exception 'forbidden' using errcode='42501';
 end if;
 perform set_config('statement_timeout','15000',true);
 return powerhouse_ops.reconcile_cron_failures(interval '20 minutes',50);
end $body$;
revoke all on function public.powerhouse_external_cron_reconcile_v1(text) from public,anon,authenticated;
grant execute on function public.powerhouse_external_cron_reconcile_v1(text) to anon,service_role;
notify pgrst,'reload schema';
