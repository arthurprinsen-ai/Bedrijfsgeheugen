-- Action economics waiting-execution contract v1
-- Execution truth is executed_at, not terminal market status. Never fabricate economics.

create or replace function public.powerhouse_record_action_economics_v1(
  p_dedupe_key text,
  p_action_id uuid,
  p_provider_cost_eur numeric default null,
  p_external_cost_eur numeric default null,
  p_human_minutes numeric default null,
  p_evidence jsonb default '{}'::jsonb,
  p_observed_at timestamptz default now()
)
returns public.powerhouse_action_economics
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_row public.powerhouse_action_economics%rowtype;
  v_action public.powerhouse_sales_actions%rowtype;
begin
  if nullif(btrim(p_dedupe_key),'') is null then
    raise exception 'dedupe_key required';
  end if;

  select * into v_action
  from public.powerhouse_sales_actions
  where action_id=p_action_id;

  if not found then
    raise exception 'action not found';
  end if;

  if v_action.executed_at is null then
    raise exception 'action must be executed before economics can be recorded';
  end if;

  if p_provider_cost_eur is null and p_external_cost_eur is null and p_human_minutes is null then
    raise exception 'at least one observed economics value is required';
  end if;

  if p_provider_cost_eur < 0 or p_external_cost_eur < 0 or p_human_minutes < 0 then
    raise exception 'economics values must be nonnegative';
  end if;

  if coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb then
    raise exception 'economics evidence is required';
  end if;

  insert into public.powerhouse_action_economics(
    dedupe_key,action_id,provider_cost_eur,external_cost_eur,human_minutes,observed_at,evidence
  ) values(
    p_dedupe_key,p_action_id,p_provider_cost_eur,p_external_cost_eur,p_human_minutes,
    coalesce(p_observed_at,now()),p_evidence
  )
  on conflict(action_id) do update set
    provider_cost_eur=coalesce(excluded.provider_cost_eur,public.powerhouse_action_economics.provider_cost_eur),
    external_cost_eur=coalesce(excluded.external_cost_eur,public.powerhouse_action_economics.external_cost_eur),
    human_minutes=coalesce(excluded.human_minutes,public.powerhouse_action_economics.human_minutes),
    observed_at=greatest(public.powerhouse_action_economics.observed_at,excluded.observed_at),
    evidence=public.powerhouse_action_economics.evidence||excluded.evidence,
    updated_at=now()
  returning * into v_row;

  return v_row;
end;
$function$;

create or replace function public.powerhouse_record_action_economics_v1(
  p_action_id uuid,
  p_provider_cost_eur numeric default null,
  p_external_cost_eur numeric default null,
  p_human_minutes numeric default null,
  p_evidence jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_row public.powerhouse_action_economics%rowtype;
begin
  v_row:=public.powerhouse_record_action_economics_v1(
    'economics:'||p_action_id::text,
    p_action_id,
    p_provider_cost_eur,
    p_external_cost_eur,
    p_human_minutes,
    p_evidence,
    now()
  );
  return v_row.economics_id;
end;
$function$;

revoke execute on function public.powerhouse_record_action_economics_v1(text,uuid,numeric,numeric,numeric,jsonb,timestamptz) from public,anon,authenticated;
revoke execute on function public.powerhouse_record_action_economics_v1(uuid,numeric,numeric,numeric,jsonb) from public,anon,authenticated;
grant execute on function public.powerhouse_record_action_economics_v1(text,uuid,numeric,numeric,numeric,jsonb,timestamptz) to service_role;
grant execute on function public.powerhouse_record_action_economics_v1(uuid,numeric,numeric,numeric,jsonb) to service_role;

comment on function public.powerhouse_record_action_economics_v1(text,uuid,numeric,numeric,numeric,jsonb,timestamptz) is
'Canonical observed action economics. executed_at proves execution; waiting is a valid post-execution market state. At least one measured value plus non-empty source evidence is mandatory.';
