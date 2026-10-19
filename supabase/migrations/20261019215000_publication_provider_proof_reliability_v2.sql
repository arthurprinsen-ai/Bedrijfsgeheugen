-- Idempotent code repository mirror of independently verified Supabase production functions.
-- 2026-10-19: preserves LinkedIn publication proof, retains specific blocked Instagram cause.
-- Does not modify the media identity policy, provider authentication, or scheduler.

CREATE OR REPLACE FUNCTION public.sync_content_publication_obligations(p_from date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date, p_to date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_count integer := 0;
begin
 if p_from is null or p_to is null or p_to<p_from then raise exception 'INVALID_PUBLICATION_RANGE'; end if;
 insert into public.content_publication_obligations(
 tenant_id,publication_date,channel,experiment_id,content_kind,status,next_action,updated_at
 )
 select 'canonical', e.calendar_date,ch.channel,e.experiment_id,
   case when ch.channel='blog' then 'blog' else 'social' end,'PLANNED',
   case when ch.channel='blog' then
     'Selecteer exact één goedgekeurde due slug en lever via candidate PR → BG169 → live proof.'
   else 'Genereer/publiceer via de bestaande kanaallane en koppel live bewijs plus metrics terug.'
   end,now()
 from public.social_experiments e
 cross join lateral (select distinct value as channel
   from jsonb_array_elements_text(coalesce(e.target_channels,'[]'::jsonb)) as c(value)) ch
 where e.calendar_date between p_from and p_to and e.tenant_id='canonical'
   and ch.channel in ('linkedin_personal','linkedin_company','instagram','blog')
 on conflict (tenant_id,publication_date,channel) do update
 set experiment_id=excluded.experiment_id,
     content_kind=excluded.content_kind,
     next_action=case
       when content_publication_obligations.status in ('FAILED','BLOCKED')
        and nullif(btrim(content_publication_obligations.last_error),'') is not null
       then content_publication_obligations.next_action
       when public.content_publication_state_rank(content_publication_obligations.status)<=10
       then excluded.next_action
       else content_publication_obligations.next_action end,
     updated_at=now();
 get diagnostics v_count=row_count;
 return v_count;
end;$function$
;

CREATE OR REPLACE FUNCTION public.enforce_content_publication_daily_invariant(p_publication_date date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date, p_deadline time without time zone DEFAULT '20:30:00'::time without time zone, p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_local_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_local_time time := (p_now at time zone 'Europe/Amsterdam')::time;
  v_proof jsonb := '{}'::jsonb;
  v_expected integer := 0;
  v_success integer := 0;
  v_blocking integer := 0;
  v_updated integer := 0;
begin
  if p_publication_date is null then
    raise exception 'PUBLICATION_DATE_REQUIRED';
  end if;

  perform public.sync_content_publication_obligations(p_publication_date,p_publication_date);

  select count(*) into v_expected
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=p_publication_date
    and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  if p_publication_date>v_local_date or
     (p_publication_date=v_local_date and v_local_time<p_deadline) then
    return jsonb_build_object('ok',true,'state','NOT_DUE',
      'publication_date',p_publication_date,'expected',v_expected,'failed',0);
  end if;

  -- Do not undo a confirmed provider side effect because native readback was later denied.
  -- When the asset failed moderation, retain its exact diagnostic instead of Buffer-era advice.
  update public.content_publication_obligations o
  set status='FAILED',
      last_error=case
        when o.channel='instagram' then
          coalesce(
            (select nullif(j.last_error,'')
             from public.powerhouse_instagram_media_jobs_v1 j
             where j.tenant_id=o.tenant_id
               and j.publication_date=o.publication_date
               and j.channel='instagram'
             order by j.updated_at desc limit 1),
            nullif(o.last_error,''),'SILENT_PUBLICATION_FAILURE'
          )
        else coalesce(nullif(o.last_error,''),'SILENT_PUBLICATION_FAILURE')
      end,
      next_action=case when o.channel='instagram' then
          coalesce(
            (select nullif(j.next_action,'')
             from public.powerhouse_instagram_media_jobs_v1 j
             where j.tenant_id=o.tenant_id
               and j.publication_date=o.publication_date
               and j.channel='instagram'
             order by j.updated_at desc limit 1),
            nullif(o.next_action,''),
            'Verify exact canonical media and approved provider publication before dispatch.'
          )
        else coalesce(nullif(o.next_action,''),'Recover provider evidence without replaying a possibly completed side effect.')
      end,
      recovery_attempts=o.recovery_attempts+1,
      evidence=coalesce(o.evidence,'{}'::jsonb)||jsonb_build_object(
        'watchdog','daily-publication-invariant-v2-provider-truth',
        'watchdog_checked_at',p_now,
        'watchdog_previous_status',o.status,
        'watchdog_reason','MISSING_TERMINAL_PROVIDER_PROOF'
      ),
      updated_at=now()
  where o.tenant_id='canonical' and o.publication_date=p_publication_date
    and o.channel in ('linkedin_personal','linkedin_company','instagram','blog')
    and o.status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED','FAILED')
    and not (
      o.status='PUBLISHED'
      and o.external_id is not null
      and coalesce((o.evidence->>'terminal_provider_side_effect')::boolean,false)
      and coalesce((o.evidence->>'provider_publication_ack_verified')::boolean,false)
      and (
        coalesce((o.evidence->>'provider_truth_verified')::boolean,false)
        or (
          coalesce((o.evidence->>'provider_create_success')::boolean,false)
          and coalesce((o.evidence->>'readback_permission_limited')::boolean,false)
          and coalesce((o.evidence->>'republish_forbidden')::boolean,false)
        )
      )
    );
  get diagnostics v_updated=row_count;

  v_proof:=public.powerhouse_publication_proof_health(p_publication_date);
  v_expected:=coalesce((v_proof->>'expected_count')::integer,0);
  v_success:=coalesce((v_proof->>'terminal_count')::integer,0);
  v_blocking:=coalesce((v_proof->>'blocking_count')::integer,0);
  return jsonb_build_object(
    'ok',coalesce((v_proof->>'healthy')::boolean,false),
    'state',case when coalesce((v_proof->>'healthy')::boolean,false)
      then 'TERMINAL_OK' else 'FAILED' end,
    'publication_date',p_publication_date,
    'expected',v_expected,'terminal_success',v_success,
    'failed',v_blocking,'blocking',v_proof->'blocking',
    'watchdog_mutated_rows',v_updated,
    'truth_contract','publication-terminal-provider-proof-v3',
    'watchdog_contract','daily-publication-invariant-v2-provider-truth'
  );
end;
$function$
;

-- Restore the exact production privilege boundary. The two SECURITY DEFINER
-- routines are internal scheduler/service-role RPCs, never browser APIs.
REVOKE ALL ON FUNCTION public.sync_content_publication_obligations(date,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_content_publication_obligations(date,date) TO service_role;
REVOKE ALL ON FUNCTION public.enforce_content_publication_daily_invariant(date,time without time zone,timestamp with time zone) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_content_publication_daily_invariant(date,time without time zone,timestamp with time zone) TO service_role;
