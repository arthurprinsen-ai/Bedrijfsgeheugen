-- Powerhouse unified data intelligence spine v1
-- One evidence intake, derived from existing canonical stores. No parallel brain or synthetic provider truth.

insert into public.powerhouse_evidence_sources
  (source_key,source_class,required,max_age,writer_contract,owner_component,notes,updated_at)
values
  ('instagram-social','market_response',false,interval '24 hours','powerhouse_record_source_observation_v1','social-ingest','Native/observed Instagram evidence; Buffer remains a transport source, not the truth authority.',now()),
  ('social-buffer','market_response',false,interval '24 hours','powerhouse_record_source_observation_v1','bg-buffer-sync','Observed Buffer social metric transport/readback.',now()),
  ('dataforseo-intelligence','external_intelligence',false,interval '30 hours','powerhouse_record_source_observation_v1','dataforseo-ingest','External search/SEO intelligence. Remains NOT_OBSERVED until a production producer writes verified evidence.',now()),
  ('external-intelligence','external_intelligence',false,interval '30 hours','powerhouse_record_source_observation_v1','bg-externe-signalen','Provider-neutral external signal persistence backed by bg_externe_signalen.',now()),
  ('portal-state','customer_state',false,interval '24 hours','powerhouse_record_source_observation_v1','portal-state-eu','Canonical customer portal state/projection evidence.',now())
on conflict (source_key) do update set
  source_class=excluded.source_class,
  max_age=excluded.max_age,
  writer_contract=excluded.writer_contract,
  owner_component=excluded.owner_component,
  notes=excluded.notes,
  updated_at=now();

create or replace function public.powerhouse_record_source_observation_v1(
  p_source_key text,
  p_dedupe_key text,
  p_external_event_id text,
  p_observed_at timestamptz,
  p_evidence jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_id uuid;
  v_observed_at timestamptz := coalesce(p_observed_at,now());
begin
  if nullif(btrim(p_source_key),'') is null
     or nullif(btrim(p_dedupe_key),'') is null
     or p_evidence is null
     or p_evidence='{}'::jsonb then
    raise exception 'SOURCE_OBSERVATION_INCOMPLETE';
  end if;

  if not exists(select 1 from public.powerhouse_evidence_sources where source_key=p_source_key) then
    raise exception 'SOURCE_NOT_REGISTERED:%',p_source_key;
  end if;

  insert into public.powerhouse_evidence_source_observations(
    source_key,dedupe_key,external_event_id,observed_at,evidence
  )
  values(p_source_key,p_dedupe_key,nullif(p_external_event_id,''),v_observed_at,p_evidence)
  on conflict (dedupe_key) do nothing
  returning observation_id into v_id;

  if v_id is null then
    select observation_id into v_id
    from public.powerhouse_evidence_source_observations
    where dedupe_key=p_dedupe_key;
  end if;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence
  )
  values(
    'source-observation:'||p_dedupe_key,
    'source_observation_recorded',
    p_source_key,
    p_source_key,
    'data-intelligence',
    v_observed_at,
    jsonb_build_object('observation_id',v_id,'external_event_id',p_external_event_id),
    jsonb_build_object('contract','powerhouse-unified-data-intelligence-spine-v1'),
    'observed',
    'verified',
    1
  )
  on conflict (dedupe_key) do update set
    occurred_at=greatest(public.powerhouse_runtime_events.occurred_at,excluded.occurred_at),
    evidence=excluded.evidence,
    updated_at=now();

  return v_id;
end
$$;

revoke execute on function public.powerhouse_record_source_observation_v1(text,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.powerhouse_record_source_observation_v1(text,text,text,timestamptz,jsonb) to service_role;

create or replace function public.powerhouse_capture_ga4_batch_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  if new.status in ('IMPORTED','PARTIAL') and coalesce(new.rows_total,0)>0 then
    perform public.powerhouse_record_source_observation_v1(
      'ga4-analytics',
      'ga4-batch:'||new.run_id::text,
      new.run_id::text,
      coalesce(new.completed_at,new.created_at,now()),
      jsonb_build_object(
        'authority','bg_ga4_csv_batches',
        'run_id',new.run_id,
        'period_start',new.period_start,
        'period_end',new.period_end,
        'source_route',new.source,
        'status',new.status,
        'rows_total',new.rows_total,
        'rows_attributed',new.rows_attributed,
        'rows_unmatched',new.rows_unmatched,
        'csv_sha256',new.csv_sha256,
        'detail',coalesce(new.detail,'{}'::jsonb)
      )
    );
  end if;
  return new;
end
$$;

drop trigger if exists powerhouse_capture_ga4_batch_v1 on public.bg_ga4_csv_batches;
create trigger powerhouse_capture_ga4_batch_v1
after insert or update of status,completed_at,rows_attributed,rows_unmatched
on public.bg_ga4_csv_batches
for each row execute function public.powerhouse_capture_ga4_batch_v1();

create or replace function public.powerhouse_capture_gsc_row_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  v_key text;
begin
  v_key := 'gsc:'||md5(concat_ws('|',new.datum::text,new.pagina,new.zoekterm));
  perform public.powerhouse_record_source_observation_v1(
    'gsc-search',v_key,v_key,new.opgehaald_op,
    jsonb_build_object(
      'authority','bg_zoekprestaties','date',new.datum,'page',new.pagina,'query',new.zoekterm,
      'clicks',new.klikken,'impressions',new.vertoningen,'ctr',new.ctr,'position',new.positie
    )
  );
  return new;
end
$$;

drop trigger if exists powerhouse_capture_gsc_row_v1 on public.bg_zoekprestaties;
create trigger powerhouse_capture_gsc_row_v1
after insert or update on public.bg_zoekprestaties
for each row execute function public.powerhouse_capture_gsc_row_v1();

create or replace function public.powerhouse_capture_social_metric_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  v_platform text;
  v_source_key text;
begin
  select lower(platform) into v_platform
  from public.social_posts
  where tenant_id=new.tenant_id and post_id=new.post_id
  limit 1;

  v_source_key := case
    when v_platform='linkedin' then 'linkedin'
    when v_platform='instagram' then 'instagram-social'
    else 'social-buffer'
  end;

  perform public.powerhouse_record_source_observation_v1(
    v_source_key,
    'social-metric:'||new.tenant_id||':'||new.source_event_id,
    new.source_event_id,
    new.observed_at,
    jsonb_build_object(
      'authority','social_metric_snapshots','tenant_id',new.tenant_id,'snapshot_id',new.snapshot_id,
      'post_id',new.post_id,'platform',v_platform,'transport_source',new.source,
      'data_quality',new.data_quality,'metrics',new.metrics
    )
  );
  return new;
end
$$;

drop trigger if exists powerhouse_capture_social_metric_v1 on public.social_metric_snapshots;
create trigger powerhouse_capture_social_metric_v1
after insert or update of metrics,observed_at,data_quality
on public.social_metric_snapshots
for each row execute function public.powerhouse_capture_social_metric_v1();

create or replace function public.powerhouse_capture_linkedin_engagement_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  if not new.is_test then
    perform public.powerhouse_record_source_observation_v1(
      'linkedin',
      'linkedin-engagement:'||new.event_key,
      new.event_key,
      new.occurred_at,
      jsonb_build_object(
        'authority','linkedin_engagement_events','engagement_type',new.engagement_type,
        'actor_type',new.actor_type,'content_key',new.content_key,'post_url',new.post_url,
        'source',new.source,'payload',new.payload
      )
    );
  end if;
  return new;
end
$$;

drop trigger if exists powerhouse_capture_linkedin_engagement_v1 on public.linkedin_engagement_events;
create trigger powerhouse_capture_linkedin_engagement_v1
after insert or update on public.linkedin_engagement_events
for each row execute function public.powerhouse_capture_linkedin_engagement_v1();

create or replace function public.powerhouse_capture_external_signal_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  perform public.powerhouse_record_source_observation_v1(
    'external-intelligence',
    'external-signal:'||md5(coalesce(new.url,'')||'|'||coalesce(new.titel,'')||'|'||coalesce(new.opgehaald_op::text,'')),
    coalesce(new.url,new.titel),
    new.opgehaald_op,
    jsonb_build_object(
      'authority','bg_externe_signalen','url',new.url,'topic',new.onderwerp,'title',new.titel,
      'domain',new.domein,'published_at',new.gepubliceerd_op,'source_trust',new.brontrouw,
      'confirmation',new.bevestiging,'freshness',new.versheid,'relevance',new.relevantie,
      'confidence',new.vertrouwen,'allowed',new.toegestaan,'noise_reason',new.ruis_reden
    )
  );
  return new;
end
$$;

drop trigger if exists powerhouse_capture_external_signal_v1 on public.bg_externe_signalen;
create trigger powerhouse_capture_external_signal_v1
after insert or update on public.bg_externe_signalen
for each row execute function public.powerhouse_capture_external_signal_v1();

create or replace function public.powerhouse_capture_portal_layer_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  perform public.powerhouse_record_source_observation_v1(
    'portal-state',
    'portal-layer:'||new.tenant_id||':'||new.layer||':'||md5(new.payload::text),
    new.tenant_id||':'||new.layer,
    coalesce(new.source_updated_at,new.updated_at),
    jsonb_build_object(
      'authority','portal_state_layers','tenant_id',new.tenant_id,'layer',new.layer,
      'source_updated_at',new.source_updated_at,'payload',new.payload
    )
  );
  return new;
end
$$;

drop trigger if exists powerhouse_capture_portal_layer_v1 on public.portal_state_layers;
create trigger powerhouse_capture_portal_layer_v1
after insert or update on public.portal_state_layers
for each row execute function public.powerhouse_capture_portal_layer_v1();

create or replace function public.powerhouse_capture_legacy_portal_state_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  v_tenant text := coalesce(new.organisatie_id::text,new.gebruiker_id::text);
begin
  perform public.powerhouse_record_source_observation_v1(
    'portal-state',
    'portaal-stand:'||v_tenant||':'||md5(new.stand::text),
    v_tenant,
    new.bijgewerkt,
    jsonb_build_object(
      'authority','portaal_stand','tenant_id',v_tenant,'organisatie_id',new.organisatie_id,
      'bedrijf',new.bedrijf,'volledigheid',new.volledigheid,'state',new.stand
    )
  );
  return new;
end
$$;

drop trigger if exists powerhouse_capture_legacy_portal_state_v1 on public.portaal_stand;
create trigger powerhouse_capture_legacy_portal_state_v1
after insert or update on public.portaal_stand
for each row execute function public.powerhouse_capture_legacy_portal_state_v1();

create or replace function public.powerhouse_data_spine_reconcile_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  r record;
  v_written integer := 0;
begin
  for r in
    select * from public.bg_ga4_csv_batches
    where status in ('IMPORTED','PARTIAL') and coalesce(rows_total,0)>0
  loop
    perform public.powerhouse_record_source_observation_v1(
      'ga4-analytics','ga4-batch:'||r.run_id::text,r.run_id::text,
      coalesce(r.completed_at,r.created_at,p_now),
      jsonb_build_object('authority','bg_ga4_csv_batches','run_id',r.run_id,'period_start',r.period_start,'period_end',r.period_end,'source_route',r.source,'status',r.status,'rows_total',r.rows_total,'rows_attributed',r.rows_attributed,'rows_unmatched',r.rows_unmatched,'csv_sha256',r.csv_sha256,'detail',coalesce(r.detail,'{}'::jsonb))
    ); v_written:=v_written+1;
  end loop;

  for r in select * from public.bg_zoekprestaties loop
    perform public.powerhouse_record_source_observation_v1(
      'gsc-search','gsc:'||md5(concat_ws('|',r.datum::text,r.pagina,r.zoekterm)),
      'gsc:'||md5(concat_ws('|',r.datum::text,r.pagina,r.zoekterm)),r.opgehaald_op,
      jsonb_build_object('authority','bg_zoekprestaties','date',r.datum,'page',r.pagina,'query',r.zoekterm,'clicks',r.klikken,'impressions',r.vertoningen,'ctr',r.ctr,'position',r.positie)
    ); v_written:=v_written+1;
  end loop;

  for r in
    select m.*,lower(coalesce(p.platform,'')) platform
    from public.social_metric_snapshots m
    left join public.social_posts p on p.tenant_id=m.tenant_id and p.post_id=m.post_id
  loop
    perform public.powerhouse_record_source_observation_v1(
      case when r.platform='linkedin' then 'linkedin' when r.platform='instagram' then 'instagram-social' else 'social-buffer' end,
      'social-metric:'||r.tenant_id||':'||r.source_event_id,r.source_event_id,r.observed_at,
      jsonb_build_object('authority','social_metric_snapshots','tenant_id',r.tenant_id,'snapshot_id',r.snapshot_id,'post_id',r.post_id,'platform',r.platform,'transport_source',r.source,'data_quality',r.data_quality,'metrics',r.metrics)
    ); v_written:=v_written+1;
  end loop;

  for r in select * from public.linkedin_engagement_events where not is_test loop
    perform public.powerhouse_record_source_observation_v1(
      'linkedin','linkedin-engagement:'||r.event_key,r.event_key,r.occurred_at,
      jsonb_build_object('authority','linkedin_engagement_events','engagement_type',r.engagement_type,'actor_type',r.actor_type,'content_key',r.content_key,'post_url',r.post_url,'source',r.source,'payload',r.payload)
    ); v_written:=v_written+1;
  end loop;

  for r in select * from public.bg_externe_signalen loop
    perform public.powerhouse_record_source_observation_v1(
      'external-intelligence',
      'external-signal:'||md5(coalesce(r.url,'')||'|'||coalesce(r.titel,'')||'|'||coalesce(r.opgehaald_op::text,'')),
      coalesce(r.url,r.titel),r.opgehaald_op,
      jsonb_build_object('authority','bg_externe_signalen','url',r.url,'topic',r.onderwerp,'title',r.titel,'domain',r.domein,'published_at',r.gepubliceerd_op,'source_trust',r.brontrouw,'confirmation',r.bevestiging,'freshness',r.versheid,'relevance',r.relevantie,'confidence',r.vertrouwen,'allowed',r.toegestaan,'noise_reason',r.ruis_reden)
    ); v_written:=v_written+1;
  end loop;

  for r in select * from public.portal_state_layers loop
    perform public.powerhouse_record_source_observation_v1(
      'portal-state','portal-layer:'||r.tenant_id||':'||r.layer||':'||md5(r.payload::text),
      r.tenant_id||':'||r.layer,coalesce(r.source_updated_at,r.updated_at),
      jsonb_build_object('authority','portal_state_layers','tenant_id',r.tenant_id,'layer',r.layer,'source_updated_at',r.source_updated_at,'payload',r.payload)
    ); v_written:=v_written+1;
  end loop;

  for r in select * from public.portaal_stand loop
    perform public.powerhouse_record_source_observation_v1(
      'portal-state',
      'portaal-stand:'||coalesce(r.organisatie_id::text,r.gebruiker_id::text)||':'||md5(r.stand::text),
      coalesce(r.organisatie_id::text,r.gebruiker_id::text),r.bijgewerkt,
      jsonb_build_object('authority','portaal_stand','tenant_id',coalesce(r.organisatie_id::text,r.gebruiker_id::text),'organisatie_id',r.organisatie_id,'bedrijf',r.bedrijf,'volledigheid',r.volledigheid,'state',r.stand)
    ); v_written:=v_written+1;
  end loop;

  return jsonb_build_object('contract','powerhouse-unified-data-intelligence-spine-v1','reconciled_at',p_now,'source_rows_seen',v_written);
end
$$;

revoke execute on function public.powerhouse_data_spine_reconcile_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_data_spine_reconcile_v1(timestamptz) to service_role;

create or replace view public.powerhouse_data_spine_health_v1
with (security_invoker=true) as
with wanted(source_key,domain,producer_required) as (
  values
    ('ga4-analytics'::text,'analytics'::text,true),
    ('gsc-search','search',true),
    ('linkedin','social',true),
    ('instagram-social','social',true),
    ('social-buffer','social_transport',false),
    ('tavily-intelligence','external_intelligence',true),
    ('external-intelligence','external_intelligence',true),
    ('dataforseo-intelligence','search_intelligence',true),
    ('portal-state','customer_state',true)
), state as (
  select w.source_key,w.domain,w.producer_required,s.max_age,s.writer_contract,s.owner_component,
         max(o.observed_at) latest_observed_at,count(o.*)::bigint observations
  from wanted w
  join public.powerhouse_evidence_sources s using(source_key)
  left join public.powerhouse_evidence_source_observations o using(source_key)
  group by w.source_key,w.domain,w.producer_required,s.max_age,s.writer_contract,s.owner_component
)
select source_key,domain,producer_required,max_age,writer_contract,owner_component,
       latest_observed_at,observations,
       case
         when latest_observed_at is null then 'NOT_OBSERVED'
         when now()-latest_observed_at > max_age then 'STALE'
         else 'FRESH'
       end freshness,
       case
         when latest_observed_at is null and producer_required then 'PRODUCER_OR_INGEST_GAP'
         when latest_observed_at is not null and now()-latest_observed_at > max_age then 'RECOVERY_DUE'
         else 'HEALTHY'
       end operational_state
from state;

revoke all on public.powerhouse_data_spine_health_v1 from anon,authenticated;
grant select on public.powerhouse_data_spine_health_v1 to service_role;

create or replace function public.powerhouse_data_spine_watchdog_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  r record;
  v_gaps integer := 0;
begin
  perform public.powerhouse_data_spine_reconcile_v1(p_now);

  for r in select * from public.powerhouse_data_spine_health_v1 loop
    if r.operational_state<>'HEALTHY' then v_gaps:=v_gaps+1; end if;
    insert into public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence
    )
    values(
      'data-spine-health:'||r.source_key||':'||to_char(date_trunc('hour',p_now),'YYYYMMDDHH24'),
      'source_health_evaluated','powerhouse-data-spine',r.source_key,'data-intelligence',p_now,
      jsonb_build_object('freshness',r.freshness,'operational_state',r.operational_state,'latest_observed_at',r.latest_observed_at,'observations',r.observations),
      jsonb_build_object('contract','powerhouse-unified-data-intelligence-spine-v1','domain',r.domain,'owner_component',r.owner_component),
      case when r.operational_state='HEALTHY' then 'observed' else 'error' end,
      case when r.operational_state='HEALTHY' then 'verified' else 'degraded' end,
      case when r.operational_state='HEALTHY' then 1 else 0 end
    )
    on conflict (dedupe_key) do update set
      occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
      state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();
  end loop;

  return jsonb_build_object('contract','powerhouse-unified-data-intelligence-spine-v1','checked_at',p_now,'gaps',v_gaps,'state',case when v_gaps=0 then 'GREEN' else 'AMBER' end);
end
$$;

revoke execute on function public.powerhouse_data_spine_watchdog_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_data_spine_watchdog_v1(timestamptz) to service_role;

do $$
declare v_job bigint;
begin
  select jobid into v_job from cron.job where jobname='powerhouse-data-spine-watchdog-v1' limit 1;
  if v_job is not null then perform cron.unschedule(v_job); end if;
  perform cron.schedule(
    'powerhouse-data-spine-watchdog-v1',
    '*/10 * * * *',
    'select public.powerhouse_data_spine_watchdog_v1(now());'
  );
end
$$;

select public.powerhouse_data_spine_reconcile_v1(now());

comment on function public.powerhouse_record_source_observation_v1(text,text,text,timestamptz,jsonb) is
'Canonical idempotent intake for social/search/analytics/external/portal evidence. Writes existing evidence/runtime authorities only.';
comment on view public.powerhouse_data_spine_health_v1 is
'One Brain data-source health. Missing/stale producers remain explicit; a connector being configured is never treated as proof of persisted data.';
comment on function public.powerhouse_data_spine_watchdog_v1(timestamptz) is
'Self-healing reconciliation and fail-closed freshness watchdog for the unified Powerhouse data intelligence spine.';
