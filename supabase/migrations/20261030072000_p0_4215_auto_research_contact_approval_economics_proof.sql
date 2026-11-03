-- P0 #4215 — Original economics producer: contact consent is not human research labour.
-- Production readback 2026-10-30: 17 completed internal research actions are
-- evidence_only=true AND human_approved=true (contact-level flag), so the
-- existing safe backfill skipped them. Each has its own exact execution event.
-- Keep original scheduler, function, batch bound, dedupe and cost-unknown truth.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';

CREATE OR REPLACE FUNCTION public.powerhouse_backfill_internal_research_economics_v1(
  p_now timestamp with time zone DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select a.action_id,a.executed_at,a.evidence,
      coalesce((a.evidence->>'human_approved')::boolean,false) as contact_human_approved
    from public.powerhouse_sales_actions a
    where a.status='done'
      and a.executed_at is not null
      and a.action_type='research_enrichment'
      and a.channel='internal'
      and coalesce((a.evidence->'public_research_execution'->>'evidence_only')::boolean,false)=true
      and not exists (
        select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id
      )
      and (
        -- Preserve original no-human-approval eligibility unchanged.
        coalesce((a.evidence->>'human_approved')::boolean,false)=false
        or (
          -- For contact-approved actions, ZERO human research time is allowed
          -- ONLY with a second original, exact-action autonomous execution receipt.
          coalesce((a.evidence->>'human_approved')::boolean,false)=true
          and a.evidence->>'source'='powerhouse-commercial-next-best-action-v5'
          and a.dedupe_key like 'relationship-research:%'
          and a.evidence->'public_research_execution'->>'contract'=
              'powerhouse-relationship-research-auto-enrichment-v1'
          and coalesce((a.evidence->'public_research_execution'->>'vendor_used')::boolean,true)=false
          and exists (
            select 1
            from public.powerhouse_runtime_events re
            where re.dedupe_key='relationship-research-evidence:'||a.action_id::text
              and re.event_type='relationship_public_research_evidence'
              and re.source='powerhouse-relationship-research-auto-enrichment-v1'
              and re.occurred_at=a.executed_at
              and re.evidence->>'action_id'=a.action_id::text
              and re.evidence->>'evidence_only'='true'
              and re.evidence->>'vendor_used'='false'
              and re.context->>'research_contract'=
                  'powerhouse-relationship-research-auto-enrichment-v1'
              and re.context->>'external_side_effects'='false'
          )
        )
      )
    order by a.executed_at, a.action_id
    limit 50
  loop
    perform public.powerhouse_record_action_economics_v1(
      'economics:'||r.action_id::text,
      r.action_id,
      null,
      null,
      0,
      jsonb_build_object(
        'contract','powerhouse-internal-research-economics-v1',
        'human_minutes',0,
        'human_minutes_basis',case
          when r.contact_human_approved
          then 'independent same-action autonomous research event, contact consent is not human labour'
          else 'action executed by automated internal research path with human_approved=false'
        end,
        'contact_human_approved',r.contact_human_approved,
        'contact_approval_not_execution',r.contact_human_approved,
        'provider_cost_eur','UNOBSERVED',
        'external_cost_eur','UNOBSERVED',
        'no_zero_cost_claim',true,
        'independent_research_receipt_required_for_contact_approved',r.contact_human_approved,
        'truth_boundary','Zero human research time requires automatic research proof; monetary costs remain unknown',
        'source_evidence',coalesce(r.evidence->'public_research_execution','{}'::jsonb),
        'recorded_at',p_now
      ),
      r.executed_at
    );
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$function$;

-- Server-side original mux is the exclusive executor, never browser roles.
REVOKE ALL ON FUNCTION public.powerhouse_backfill_internal_research_economics_v1(timestamp with time zone)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_backfill_internal_research_economics_v1(timestamp with time zone)
  TO service_role;
COMMIT;
