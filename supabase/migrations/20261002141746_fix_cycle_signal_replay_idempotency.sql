create or replace function public.powerhouse_open_cycle_from_runtime_signal_v1(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  e public.powerhouse_runtime_events%rowtype;
  v_tenant constant text := 'canonical';
  v_subject text;
  v_evidence_ref text;
begin
  select * into e
  from public.powerhouse_runtime_events
  where event_id=p_event_id;

  if not found then return; end if;

  if e.event_type <> 'scan_submitted'
     or e.source <> 'website.frisse_blik'
     or lower(coalesce(e.source,'')) like '%test%' then
    return;
  end if;

  v_subject := coalesce(
    nullif(e.subject_key,''),
    nullif(e.company_key,''),
    nullif(e.person_key,''),
    e.event_id::text
  );
  v_evidence_ref := 'powerhouse_runtime_events:' || e.event_id::text;

  insert into public.powerhouse_decision_cycles(
    tenant_id,cycle_id,subject_key,source_signal_ref,current_stage,status,opened_at,updated_at
  )
  values(
    v_tenant,e.event_id,v_subject,v_evidence_ref,'signal','open',e.occurred_at,now()
  )
  on conflict (tenant_id,cycle_id) do update set
    subject_key=coalesce(public.powerhouse_decision_cycles.subject_key,excluded.subject_key),
    source_signal_ref=excluded.source_signal_ref,
    updated_at=now();

  -- Important idempotency guard: do not attempt an already-recorded sequence-1 event.
  -- The cycle-event contiguity trigger runs before ON CONFLICT, so relying only on
  -- ON CONFLICT can falsely raise "cycle sequence must be contiguous" on replays.
  if exists (
    select 1
    from public.powerhouse_cycle_events ce
    where ce.tenant_id=v_tenant
      and ce.idempotency_key='runtime-signal:' || e.event_id::text
  ) then
    return;
  end if;

  insert into public.powerhouse_cycle_events(
    tenant_id,cycle_id,sequence_no,stage,entity_type,entity_id,
    evidence_ref,idempotency_key,payload,occurred_at
  )
  values(
    v_tenant,e.event_id,1,'signal','powerhouse_runtime_events',e.event_id::text,
    v_evidence_ref,'runtime-signal:' || e.event_id::text,
    jsonb_build_object(
      'event_type',e.event_type,
      'source',e.source,
      'data_quality',e.data_quality,
      'confidence',e.confidence,
      'truth','observed_runtime_signal'
    ),
    e.occurred_at
  );
end
$function$;
