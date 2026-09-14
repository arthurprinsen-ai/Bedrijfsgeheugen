-- Preserve truthful execution timestamps: only observed states receive their own timestamp.
-- Social reconciliation supplies the actual Buffer published_at separately after LIVE_PROVEN.

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
set search_path = public
as $$
declare
  v_row public.content_publication_obligations%rowtype;
  v_old_rank integer;
  v_new_rank integer;
begin
  select * into v_row
  from public.content_publication_obligations
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  for update;

  if not found then
    raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND';
  end if;

  v_old_rank := public.content_publication_state_rank(v_row.status);
  v_new_rank := public.content_publication_state_rank(p_status);
  if v_new_rank < 0 then
    raise exception 'INVALID_PUBLICATION_STATE';
  end if;

  if v_row.status not in ('BLOCKED','FAILED')
     and p_status not in ('BLOCKED','FAILED')
     and v_new_rank < v_old_rank then
    raise exception 'STATE_REGRESSION_NOT_ALLOWED';
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and coalesce(nullif(p_canonical_url,''), nullif(p_external_id,''), nullif(v_row.canonical_url,''), nullif(v_row.external_id,'')) is null then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and coalesce(p_evidence, '{}'::jsonb) = '{}'::jsonb
     and coalesce(v_row.evidence, '{}'::jsonb) = '{}'::jsonb then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  update public.content_publication_obligations
  set status = p_status,
      content_id = coalesce(nullif(p_content_id,''), content_id),
      slug = coalesce(nullif(p_slug,''), slug),
      external_id = coalesce(nullif(p_external_id,''), external_id),
      canonical_url = coalesce(nullif(p_canonical_url,''), canonical_url),
      evidence = case when coalesce(p_evidence,'{}'::jsonb) = '{}'::jsonb then evidence else evidence || p_evidence end,
      metrics = case when coalesce(p_metrics,'{}'::jsonb) = '{}'::jsonb then metrics else metrics || p_metrics end,
      next_action = coalesce(p_next_action, next_action),
      last_error = case when p_status in ('BLOCKED','FAILED') then coalesce(p_error, last_error) else null end,
      recovery_attempts = recovery_attempts + case when p_status in ('BLOCKED','FAILED') then 1 else 0 end,
      generated_at = case when p_status = 'GENERATED' then coalesce(generated_at,now()) else generated_at end,
      approved_at = case when p_status = 'APPROVED' then coalesce(approved_at,now()) else approved_at end,
      dispatched_at = case when p_status = 'DISPATCHED' then coalesce(dispatched_at,now()) else dispatched_at end,
      published_at = case when p_status = 'PUBLISHED' then coalesce(published_at,now()) else published_at end,
      live_proven_at = case when p_status = 'LIVE_PROVEN' then coalesce(live_proven_at,now()) else live_proven_at end,
      measured_at = case when p_status = 'MEASURED' then coalesce(measured_at,now()) else measured_at end,
      learned_at = case when p_status = 'LEARNED' then coalesce(learned_at,now()) else learned_at end,
      updated_at = now()
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text) from public;
