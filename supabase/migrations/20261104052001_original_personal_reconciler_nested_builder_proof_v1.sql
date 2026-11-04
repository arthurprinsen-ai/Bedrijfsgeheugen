-- Source-preserving fix for original ONE BRAIN personal source reconciliation.
-- Incident #4198: top-level builder flag absent, nested independent evidence valid.
-- No authorizations, provider IDs, publication statuses, thresholds or schedules changed.
-- This migration only corrects a false-negative read of existing approved source proof.
CREATE OR REPLACE FUNCTION public.powerhouse_reconcile_content_outcomes_v1(p_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  r record;
  v_ob_channel text;
  v_status text;
  v_updated integer := 0;
  v_blocked integer := 0;
  v_provider_verified integer := 0;
  v_outcome_verified integer := 0;
  v_provider_side_effect boolean;
begin
  perform public.sync_content_publication_obligations(p_date, p_date);

  for r in
    select d.channel, d.state, d.delivery_ref, public.powerhouse_jsonb_object_v1(d.delivery_evidence) evidence
      from public.powerhouse_channel_decisions d
     where d.run_date = p_date
       and d.channel in ('linkedin_personal','linkedin_company','instagram_company')
  loop
    v_ob_channel := case when r.channel='instagram_company' then 'instagram' else r.channel end;

    v_provider_side_effect :=
      nullif(coalesce(r.delivery_ref,''),'') is not null
      and (
        public.powerhouse_jsonb_true(r.evidence,'provider_create_success')
        or public.powerhouse_jsonb_true(r.evidence,'provider_publication_ack_verified')
        or public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified')
        or public.powerhouse_jsonb_true(r.evidence,'terminal_provider_side_effect')
      );

    -- Provider-write truth is terminal for anti-duplicate purposes.
    -- Later token/readback/ACL/media-proof drift may enrich evidence, but may not
    -- retroactively turn an already-created provider side effect into BLOCKED.
    if v_provider_side_effect then
      update public.content_publication_obligations
         set status = case
               when status in ('LIVE_PROVEN','MEASURED','LEARNED') then status
               else 'PUBLISHED'
             end,
             external_id = coalesce(nullif(r.delivery_ref,''), external_id),
             canonical_url = case
               when r.channel in ('linkedin_personal','linkedin_company')
                    and (
                      coalesce(r.delivery_ref,'') like 'urn:li:share:%'
                      or coalesce(r.delivery_ref,'') like 'urn:li:ugcPost:%'
                    )
                 then 'https://www.linkedin.com/feed/update/' || r.delivery_ref || '/'
               else canonical_url
             end,
             evidence = public.powerhouse_jsonb_object_v1(evidence)
               || r.evidence
               || jsonb_build_object(
                    'reconciler','powerhouse_reconcile_content_outcomes_v1',
                    'provider_publication_ack_verified',true,
                    'terminal_provider_side_effect',true,
                    'republish_forbidden',true,
                    'reconciled_at',now(),
                    'terminality_contract','social-provider-write-terminal-v1'
                  ),
             last_error = null,
             next_action = 'Collect outcome metrics; reconcile this exact provider ID only. Never republish an already-created side effect.',
             published_at = coalesce(published_at, now()),
             updated_at = now()
       where tenant_id='canonical'
         and publication_date=p_date
         and channel=v_ob_channel;
      if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') then
        v_provider_verified := v_provider_verified + 1;
      end if;
      v_updated := v_updated + 1;
      continue;
    end if;

    if coalesce(r.evidence->>'error','') = 'PROVIDER_RECORD_MISSING'
       or public.powerhouse_jsonb_true(r.evidence,'stale_delivery_ref') then
      update public.content_publication_obligations
         set status='BLOCKED',
             external_id=coalesce(nullif(r.delivery_ref,''),external_id),
             evidence=public.powerhouse_jsonb_object_v1(evidence)
               || r.evidence
               || jsonb_build_object(
                    'reconciler','powerhouse_reconcile_content_outcomes_v1',
                    'provider_truth_verified',false,
                    'reconciled_at',now(),
                    'reconciliation_reason','PROVIDER_RECORD_MISSING'
                  ),
             last_error='PROVIDER_RECORD_MISSING',
             next_action='Provider record ontbreekt; re-enter canonieke loop na truth/idempotency preflight. Geen blinde replacement.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if r.channel='linkedin_personal'
       and r.state in ('content_ready','scheduled','published')
       and not (
         public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified') is true
         or (
           public.powerhouse_jsonb_true(r.evidence,'observational_personal_theme_verified') is true
           and public.powerhouse_jsonb_true(r.evidence,'public_theme_source_verified') is true
           and coalesce((r.evidence->>'first_person_claims_present')::boolean,true) is false
         )
         or (
           public.powerhouse_jsonb_true(r.evidence,'ai_native_builder_story_verified') is true
           and coalesce(r.evidence->>'ai_native_builder_policy','')='personal-linkedin-ai-native-builder-v1'
           and public.powerhouse_jsonb_true(r.evidence,'build_event_verified') is true
           and public.powerhouse_jsonb_true(r.evidence,'arthur_anchor_verified') is true
           and coalesce((r.evidence->>'business_topic')::boolean,false) is true
         )
         or (
           -- The original publisher and editor place verified founder provenance in
           -- identity_gate_evidence; never infer provider publication from this check.
           -- Keep the existing source and provider gates unchanged.
           public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence'),'ai_native_builder_story_verified') is true
           and coalesce(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->>'ai_native_builder_policy','')='personal-linkedin-ai-native-builder-v1'
           and public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence'),'build_event_verified') is true
           and public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence'),'arthur_anchor_verified') is true
           and public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence'),'source_backed') is true
           and public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence'),'business_topic') is true
           and coalesce((public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->>'corporate_voice')::boolean,true) is false
           and coalesce((public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->>'company_page_interchangeable')::boolean,true) is false
           and coalesce((public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->>'forced_business_moral')::boolean,true) is false
           and coalesce(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->>'identity_contract','')='arthur-personal-linkedin-identity-v4'
           and coalesce(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->>'identity_gate_version','')='channel-identity-hard-gate-v3'
           and nullif(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->>'content_id','') is not null
           and case when jsonb_typeof(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->'source_lineage')='array'
             then jsonb_array_length(public.powerhouse_jsonb_object_v1(r.evidence->'identity_gate_evidence')->'source_lineage')>0
             else false end
         )
       ) then
      update public.content_publication_obligations
         set status='BLOCKED',
             evidence=public.powerhouse_jsonb_object_v1(evidence)
               || jsonb_build_object(
                    'reconciler','powerhouse_reconcile_content_outcomes_v1',
                    'personal_truth_verified',false,
                    'reconciled_at',now()
                  ),
             last_error='PERSONAL_SOURCE_UNVERIFIED',
             next_action='Persoonlijk LinkedIn blijft fail-closed tot geverifieerde persoonlijke waarheid, geverifieerde brongebonden observatie-evidence of geverifieerde AI-native builder-event lineage bestaat.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') is true then
      v_provider_verified := v_provider_verified + 1;
      if r.state='published' then
        v_status := 'PUBLISHED';
      elsif r.state='scheduled' then
        v_status := 'DISPATCHED';
      else
        v_status := null;
      end if;

      if v_status is not null then
        update public.content_publication_obligations
           set status=v_status,
               external_id=coalesce(nullif(r.delivery_ref,''),external_id),
               evidence=public.powerhouse_jsonb_object_v1(evidence)
                 || r.evidence
                 || jsonb_build_object(
                      'reconciler','powerhouse_reconcile_content_outcomes_v1',
                      'provider_truth_verified',true,
                      'reconciled_at',now()
                    ),
               last_error=null,
               updated_at=now()
         where tenant_id='canonical'
           and publication_date=p_date
           and channel=v_ob_channel
           and status not in ('LIVE_PROVEN','MEASURED','LEARNED');
        v_updated := v_updated + 1;
      end if;
    end if;
  end loop;

  update public.content_publication_obligations
     set status='BLOCKED',
         evidence=public.powerhouse_jsonb_object_v1(evidence)
           || jsonb_build_object(
                'reconciler','powerhouse_reconcile_content_outcomes_v1',
                'provider_truth_verified',public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_truth_verified'),
                'reconciled_at',now(),
                'reconciliation_reason','EXACT_FINAL_MEDIA_PROOF_REQUIRED'
              ),
         last_error='EXACT_FINAL_MEDIA_PROOF_REQUIRED',
         next_action='Bewijs immutable exact-final-media digest/frames + Mira PASS vóór een toekomstige provider write.',
         updated_at=now()
   where tenant_id='canonical'
     and publication_date=p_date
     and channel='instagram'
     and coalesce(public.powerhouse_jsonb_object_v1(evidence)->>'provider_status','')='sent'
     and not (
       public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'exact_final_media_proven') is true
       and nullif(public.powerhouse_jsonb_object_v1(evidence)->>'final_media_sha256','') is not null
       and coalesce(public.powerhouse_jsonb_object_v1(evidence)->>'mira_gate_result','')='PASS'
     )
     and not (
       nullif(external_id,'') is not null
       and (
         public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_create_success')
         or public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_publication_ack_verified')
         or public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_truth_verified')
         or public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'terminal_provider_side_effect')
       )
     )
     and status not in ('LIVE_PROVEN','MEASURED','LEARNED');
  get diagnostics v_blocked = row_count;

  update public.content_publication_obligations o
     set status = case when o.status='PLANNED' then 'GENERATED' else o.status end,
         evidence=coalesce(o.evidence,'{}'::jsonb)
           || jsonb_build_object(
                'reconciler','powerhouse_reconcile_content_outcomes_v1',
                'artifact_truth_verified',true,
                'reconciled_at',now()
              ),
         next_action=case
           when o.status='PLANNED' then 'Canonical blog artifact gereed; continue via approved central queue → BG169 → public proof.'
           else o.next_action
         end,
         updated_at=now()
   where o.tenant_id='canonical'
     and o.publication_date=p_date
     and o.channel='blog'
     and exists (
       select 1
       from public.powerhouse_content_artifacts a
       join public.powerhouse_channel_decisions d
         on d.run_date=a.run_date and d.channel=a.channel
       where a.run_date=p_date
         and a.channel='blog'
         and a.status='content_ready'
         and d.decision='publish'
         and d.state='content_ready'
     )
     and o.status not in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED');

  select
    count(*) filter (where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')),
    count(*) filter (where status in ('BLOCKED','FAILED'))
    into v_outcome_verified, v_blocked
    from public.content_publication_obligations
   where tenant_id='canonical'
     and publication_date=p_date
     and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  return jsonb_build_object(
    'ok',v_blocked=0,
    'publication_date',p_date,
    'updated',v_updated,
    'provider_truth_verified_count',v_provider_verified,
    'outcome_verified_count',v_outcome_verified,
    'blocked_count',v_blocked,
    'truth_contract','GREEN MEANS OUTCOME VERIFIED',
    'provider_side_effect_contract','social-provider-write-terminal-v1',
    'missing_provider_fingerprint','PROVIDER_RECORD_MISSING'
  );
end;
$function$;

-- Original production pg_proc.proacl before this migration: {postgres=X/postgres,service_role=X/postgres}.
-- Preserve fail-closed internal-only execution exactly; never grant browser roles.
REVOKE ALL ON FUNCTION public.powerhouse_reconcile_content_outcomes_v1(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_reconcile_content_outcomes_v1(date) TO service_role;
