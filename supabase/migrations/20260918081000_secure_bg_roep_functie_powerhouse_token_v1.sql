-- Repair protected Edge Function health invocation without weakening Edge auth.
-- Generic server-side invocations now forward the existing Powerhouse scheduler token.
create or replace function public.bg_roep_functie(
  p_functie text,
  p_body jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, net, vault, pg_temp
as $function$
declare
  v_id bigint;
  v_token text;
begin
  select decrypted_secret
  into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc
  limit 1;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/'||p_functie,
    body := coalesce(p_body,'{}'::jsonb),
    headers := jsonb_strip_nulls(jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token',nullif(v_token,'')
    )),
    timeout_milliseconds := 120000
  ) into v_id;

  insert into public.bg_functie_aanroep(request_id, functie)
  values (v_id, p_functie);

  return v_id;
end
$function$;

revoke execute on function public.bg_roep_functie(text,jsonb) from public, anon, authenticated;
grant execute on function public.bg_roep_functie(text,jsonb) to service_role;
