create or replace function public.brain_record_resource_usage(
  p_usage_id text,
  p_capability_id text,
  p_source text,
  p_usage_type text,
  p_unit text,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_provider_usage_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_payload_sha256 text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_operation_id uuid;
  v_hash text;
  v_inserted_count integer := 0;
begin
  if nullif(btrim(p_usage_id),'') is null or nullif(btrim(p_capability_id),'') is null or nullif(btrim(p_source),'') is null or nullif(btrim(p_usage_type),'') is null or nullif(btrim(p_unit),'') is null then
    raise exception 'RESOURCE_USAGE_IDENTITY_REQUIRED';
  end if;
  if p_amount < 0 then raise exception 'RESOURCE_USAGE_AMOUNT_INVALID'; end if;
  v_hash := coalesce(nullif(btrim(p_payload_sha256),''), encode(extensions.digest(convert_to(jsonb_build_object('usage_id',p_usage_id,'capability_id',p_capability_id,'source',p_source,'usage_type',p_usage_type,'unit',p_unit,'amount',p_amount,'occurred_at',p_occurred_at,'provider_usage_id',p_provider_usage_id,'metadata',coalesce(p_metadata,'{}'::jsonb))::text,'UTF8'),'sha256'),'hex'));

  insert into public.brain_operations(capability_id,operation_type,idempotency_key,payload_sha256,status,evidence)
  values (p_capability_id,'RESOURCE_USAGE',p_usage_id,v_hash,'VERIFIED',jsonb_build_object('source',p_source,'usage_type',p_usage_type,'unit',p_unit,'occurred_at',p_occurred_at))
  on conflict (capability_id,operation_type,idempotency_key) do update set updated_at=now()
  returning id into v_operation_id;

  insert into public.brain_budget_usage(usage_id,operation_id,source,usage_type,unit,amount,entry_kind,provider_usage_id,metadata,occurred_at)
  values (p_usage_id,v_operation_id,p_source,p_usage_type,p_unit,p_amount,'USAGE',p_provider_usage_id,coalesce(p_metadata,'{}'::jsonb),p_occurred_at)
  on conflict (usage_id) do nothing;
  get diagnostics v_inserted_count = row_count;

  return jsonb_build_object('recorded',true,'inserted',v_inserted_count = 1,'usage_id',p_usage_id,'operation_id',v_operation_id);
end;
$$;
revoke all on function public.brain_record_resource_usage(text,text,text,text,text,numeric,timestamptz,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.brain_record_resource_usage(text,text,text,text,text,numeric,timestamptz,text,jsonb,text) to service_role;
