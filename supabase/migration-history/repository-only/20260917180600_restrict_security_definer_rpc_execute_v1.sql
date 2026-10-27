-- Security closure: exposed SECURITY DEFINER routines must not be callable by PUBLIC/anon/authenticated.
-- Fresh previews may not contain production-only routines; secure them when present
-- without fabricating placeholder functions or weakening runtime permissions.
do $security$
begin
  if to_regprocedure('public.enforce_instagram_exact_final_media_gate_v1()') is not null then
    execute 'revoke execute on function public.enforce_instagram_exact_final_media_gate_v1() from public, anon, authenticated';
    execute 'grant execute on function public.enforce_instagram_exact_final_media_gate_v1() to service_role';
  end if;
  if to_regprocedure('public.powerhouse_reconciliation_worker_v1(text,integer)') is not null then
    execute 'revoke execute on function public.powerhouse_reconciliation_worker_v1(text, integer) from public, anon, authenticated';
    execute 'grant execute on function public.powerhouse_reconciliation_worker_v1(text, integer) to service_role';
  end if;
end
$security$;
