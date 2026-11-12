-- Original Powerhouse no-publish recorder: prevention of false SKIPPED when
-- a provider post or irreversible side effect already exists. No new runner.
-- Historical backfill is intentionally NOT inferred from this function.
CREATE OR REPLACE FUNCTION public.record_content_publication_skip(p_tenant_id text, p_publication_date date, p_channel text, p_reason text, p_evidence jsonb DEFAULT '{}'::jsonb)
 RETURNS content_publication_obligations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.content_publication_obligations%rowtype;
  v_reason text := btrim(coalesce(p_reason,''));
begin
  if v_reason = '' then
    raise exception 'NO_PUBLISH_REASON_REQUIRED';
  end if;

  select * into v_row
  from public.content_publication_obligations
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  for update;

  if not found then
    raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND';
  end if;

  -- 2026-11-12 P0: a status such as CONTENT_READY or SKIPPED is NOT
  -- evidence that no provider write occurred. Explicit provider IDs,
  -- recorded publication times and any provider-side-effect receipt
  -- all veto NO_PUBLISH, independent of process status. Never erase
  -- or republish a previously created social post.
  if nullif(btrim(coalesce(v_row.external_id,'')),'') is not null
     or v_row.published_at is not null
     or v_row.live_proven_at is not null
     or public.powerhouse_jsonb_true(coalesce(v_row.evidence,'{}'::jsonb) || coalesce(p_evidence,'{}'::jsonb),'provider_create_success')
     or public.powerhouse_jsonb_true(coalesce(v_row.evidence,'{}'::jsonb) || coalesce(p_evidence,'{}'::jsonb),'provider_publication_ack_verified')
     or public.powerhouse_jsonb_true(coalesce(v_row.evidence,'{}'::jsonb) || coalesce(p_evidence,'{}'::jsonb),'provider_truth_verified')
     or public.powerhouse_jsonb_true(coalesce(v_row.evidence,'{}'::jsonb) || coalesce(p_evidence,'{}'::jsonb),'terminal_provider_side_effect')
  then
    raise exception 'NO_PUBLISH_PROVIDER_REFERENCE_MUST_RECONCILE'
      using errcode='23514';
  end if;

  if v_row.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    raise exception 'NO_PUBLISH_DECISION_TOO_LATE';
  end if;

  update public.content_publication_obligations
  set status = 'SKIPPED',
      evidence = evidence
        || coalesce(p_evidence,'{}'::jsonb)
        || jsonb_build_object(
             'decision','NO_PUBLISH',
             'no_publish_reason',v_reason,
             'decided_at',now()
           ),
      next_action = 'Geen publicatie vereist: expliciete no-publish-beslissing vastgelegd.',
      last_error = null,
      updated_at = now()
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  returning * into v_row;

  return v_row;
end;
$function$
;
REVOKE ALL ON FUNCTION public.record_content_publication_skip(text,date,text,text,jsonb)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_content_publication_skip(text,date,text,text,jsonb)
  TO service_role;
