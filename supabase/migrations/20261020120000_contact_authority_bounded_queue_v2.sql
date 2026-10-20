-- P0 #4198: preselect small, lock-safe CRM authority queue BEFORE joining 23k contacts.
-- No new sender, no new scheduler, no inferred consent.
create index if not exists powerhouse_connection_enrichment_authority_queue_v2_idx
  on public.powerhouse_connection_enrichment_state_v1
  (enriched_at asc nulls first, person_key);

do $repair$
declare
  v_def text;
  v_new text;
  v_before text := $old$
    from public.powerhouse_connection_enrichment_state_v1 s
    join public.bg_connecties c
      on (c.sleutel=s.person_key or c.linkedin_url=s.person_key)
    where s.source_snapshot #>> '{email_authority,run_date}' is distinct from p_run_date::text
    order by s.enriched_at asc nulls first,s.person_key
    limit greatest(1,least(coalesce(p_limit,500),500))$old$;
  v_after text := $new$
    from picked s
    join public.bg_connecties c
      on (c.sleutel=s.person_key or c.linkedin_url=s.person_key)$new$;
  v_picked text := $picked$  with picked as materialized (
    select s.*
    from public.powerhouse_connection_enrichment_state_v1 s
    where s.source_snapshot #>> '{email_authority,run_date}' is distinct from p_run_date::text
    order by s.enriched_at asc nulls first,s.person_key
    limit greatest(1,least(coalesce(p_limit,500),500))
    for update of s skip locked
  ), candidates as ($picked$;
begin
  select pg_get_functiondef('public.powerhouse_contact_authority_review_batch_v1(date,integer)'::regprocedure)
    into v_def;
  if v_def is null then raise exception 'CONTACT_AUTHORITY_FUNCTION_MISSING';end if;
  if strpos(v_def,'with picked as materialized (')>0
     and strpos(v_def,'from picked s')>0 then return;end if;
  -- The data and recipient gates must be preserved byte-for-byte.
  if strpos(v_def,'with candidates as (')=0 or strpos(v_def,v_before)=0
    or strpos(v_def,'AUTHORITY_REVIEW_REQUIRED')=0
    or strpos(v_def,'CONTACT_PRESSURE_COOLDOWN')=0
    or strpos(v_def,'powerhouse_email_contact_suppressions')=0
    then raise exception 'AUTHORITY_SOURCE_DRIFT_REFUSE_REWRITE';end if;
  v_new:=replace(v_def,'  with candidates as (',v_picked);
  v_new:=replace(v_new,v_before,v_after);
  if v_new=v_def or strpos(v_new,v_before)>0 or strpos(v_new,'from picked s')=0 then
    raise exception 'AUTHORITY_BOUNDED_REWRITE_FAILED';end if;
  execute v_new;
end
$repair$;

-- Reconcile only the original existing Cron owner; preserve its schedule, slot and other workload.
do $cron$
declare
  v_id bigint;v_cmd text;v_new text;
  v_old text:='perform public.powerhouse_connection_daily_pulse_v1(v_date,500);';
  v_bound text:='perform public.powerhouse_connection_daily_pulse_v1(v_date,200);';
begin
  select jobid,command into v_id,v_cmd from cron.job
    where jobname='powerhouse-identity-graph-v1' and active=true;
  if v_id is null then raise exception 'IDENTITY_GRAPH_CANONICAL_CRON_MISSING';end if;
  if strpos(v_cmd,v_bound)>0 and strpos(v_cmd,'for i in 1..1 loop')>0
    and strpos(v_cmd,'powerhouse_contact_authority_review_batch_v1(')>0
    then return;end if;
  if strpos(v_cmd,v_old||E'\n    '||v_old)=0 or strpos(v_cmd,'for i in 1..4 loop')=0
    then raise exception 'IDENTITY_GRAPH_CANONICAL_CRON_DRIFT';end if;
  v_new:=replace(v_cmd,v_old||E'\n    '||v_old,v_bound);
  v_new:=replace(v_new,'for i in 1..4 loop','for i in 1..1 loop');
  v_new:=replace(v_new,'v_date,500);','v_date,200);');
  perform cron.alter_job(v_id,command=>v_new);
end
$cron$;
