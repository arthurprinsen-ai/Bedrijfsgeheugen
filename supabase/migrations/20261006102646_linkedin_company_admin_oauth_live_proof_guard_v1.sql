
create or replace function public.record_content_publication_state(
  p_tenant_id text,
  p_publication_date date,
  p_channel text,
  p_status text,
  p_content_id text default null,
  p_slug text default null,
  p_external_id text default null,
  p_canonical_url text default null,
  p_evidence jsonb default '{}'::jsonb,
  p_metrics jsonb default '{}'::jsonb,
  p_next_action text default null,
  p_error text default null
)
returns public.content_publication_obligations
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.content_publication_obligations%rowtype;
  v_old_rank integer;
  v_new_rank integer;
  v_tenant_id text;
  v_effective_evidence jsonb;
begin
  v_tenant_id := case when p_tenant_id in ('canonical','bedrijfsgeheugen') then 'canonical' else p_tenant_id end;

  select * into v_row
  from public.content_publication_obligations
  where tenant_id=v_tenant_id
    and publication_date=p_publication_date
    and channel=p_channel
  for update;

  if not found then
    raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND';
  end if;

  v_old_rank:=public.content_publication_state_rank(v_row.status);
  v_new_rank:=public.content_publication_state_rank(p_status);

  if v_new_rank<0 then
    raise exception 'INVALID_PUBLICATION_STATE';
  end if;

  if v_row.status not in ('BLOCKED','FAILED')
     and p_status not in ('BLOCKED','FAILED')
     and v_new_rank<v_old_rank then
    return v_row;
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and coalesce(nullif(p_canonical_url,''),nullif(p_external_id,''),nullif(v_row.canonical_url,''),nullif(v_row.external_id,'')) is null then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and public.powerhouse_jsonb_object_v1(p_evidence)='{}'::jsonb
     and public.powerhouse_jsonb_object_v1(v_row.evidence)='{}'::jsonb then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  v_effective_evidence :=
    public.powerhouse_jsonb_object_v1(v_row.evidence)
    || public.powerhouse_jsonb_object_v1(p_evidence);

  if p_channel='linkedin_company'
     and p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and (
       lower(coalesce(v_effective_evidence->>'linkedin_company_admin_oauth_proven','false')) <> 'true'
       or lower(coalesce(v_effective_evidence->>'organization_write_scope_verified','false')) <> 'true'
       or nullif(v_effective_evidence->>'company_oauth_connection_id','') is null
       or nullif(v_effective_evidence->>'company_oauth_verified_at','') is null
     ) then
    raise exception 'LINKEDIN_COMPANY_ADMIN_OAUTH_PROOF_REQUIRED';
  end if;

  update public.content_publication_obligations
  set status=p_status,
      content_id=coalesce(nullif(content_id,''),nullif(p_content_id,'')),
      slug=coalesce(nullif(slug,''),nullif(p_slug,'')),
      external_id=coalesce(nullif(p_external_id,''),external_id),
      canonical_url=coalesce(nullif(canonical_url,''),nullif(p_canonical_url,'')),
      evidence=case when public.powerhouse_jsonb_object_v1(p_evidence)='{}'::jsonb then public.powerhouse_jsonb_object_v1(evidence) else public.powerhouse_jsonb_object_v1(evidence)||public.powerhouse_jsonb_object_v1(p_evidence) end,
      metrics=case when public.powerhouse_jsonb_object_v1(p_metrics)='{}'::jsonb then public.powerhouse_jsonb_object_v1(metrics) else public.powerhouse_jsonb_object_v1(metrics)||public.powerhouse_jsonb_object_v1(p_metrics) end,
      next_action=coalesce(p_next_action,next_action),
      last_error=case when p_status in ('BLOCKED','FAILED') then coalesce(p_error,last_error) else null end,
      recovery_attempts=recovery_attempts+case when p_status in ('BLOCKED','FAILED') then 1 else 0 end,
      generated_at=case when p_status in ('GENERATED','APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(generated_at,now()) else generated_at end,
      approved_at=case when p_status in ('APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(approved_at,now()) else approved_at end,
      dispatched_at=case when p_status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(dispatched_at,now()) else dispatched_at end,
      published_at=case when p_status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(published_at,now()) else published_at end,
      live_proven_at=case when p_status in ('LIVE_PROVEN','MEASURED','LEARNED') then coalesce(live_proven_at,now()) else live_proven_at end,
      measured_at=case when p_status in ('MEASURED','LEARNED') then coalesce(measured_at,now()) else measured_at end,
      learned_at=case when p_status='LEARNED' then coalesce(learned_at,now()) else learned_at end,
      updated_at=now()
  where tenant_id=v_tenant_id
    and publication_date=p_publication_date
    and channel=p_channel
  returning * into v_row;

  return v_row;
end;
$function$;
