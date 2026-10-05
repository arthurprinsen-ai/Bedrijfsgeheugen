-- Keep cross-user ranking semantics while removing SECURITY DEFINER from the public API schema.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated, service_role;
grant usage on schema private to authenticated, service_role;

create or replace function private.mijn_ranking()
returns table(meedoeners integer, lager integer, gemiddelde numeric, mijn integer)
language sql
security definer
set search_path = public, pg_temp
as $function$
  with ik as (
    select volledigheid
      from public.portaal_stand
     where gebruiker_id = auth.uid()
  )
  select (select count(*)::int from public.portaal_stand),
         (select count(*)::int
            from public.portaal_stand p, ik
           where p.volledigheid < ik.volledigheid),
         (select round(avg(volledigheid), 0) from public.portaal_stand),
         coalesce((select volledigheid from ik), 0);
$function$;

revoke all on function private.mijn_ranking() from public, anon, authenticated, service_role;
grant execute on function private.mijn_ranking() to authenticated, service_role;

create or replace function public.mijn_ranking()
returns table(meedoeners integer, lager integer, gemiddelde numeric, mijn integer)
language sql
security invoker
set search_path = public, private, pg_temp
as $function$
  select * from private.mijn_ranking();
$function$;

revoke all on function public.mijn_ranking() from public, anon;
grant execute on function public.mijn_ranking() to authenticated, service_role;
