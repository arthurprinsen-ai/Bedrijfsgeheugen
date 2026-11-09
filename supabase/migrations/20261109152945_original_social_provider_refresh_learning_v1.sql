-- 2026-11-09 ORIGINAL minute-39 BRAIN: process subsequent real Windsor observations
-- of the SAME independently published experiment, in the SAME original function.
-- No scheduler, provider caller, outbound action, new table or causal uplift.
begin;

create or replace function public.powerhouse_backfill_social_learning_applications_v1(
  p_now timestamptz default now()
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_legacy integer := 0;
  v_verified_variant integer := 0;
  v_observations integer := 0;
  v_learning_records integer := 0;
  v_status_updates integer := 0;
  v_affected integer := 0;
  r record;
begin
  -- Preserve existing exact-provider-post to learning lineage backfill.
  insert into public.social_learning_applications(
    tenant_id,application_id,post_id,learning_id,decision_id,applied_at,
    application_role,expected_effect,actual_effect,verification_status,updated_at
  )
  select
    p.tenant_id,
    'post-learning:'||md5(p.tenant_id||'|'||p.post_id||'|'||p.learning_id),
    p.post_id,
    p.learning_id,
    null,
    coalesce(p.published_at,p.created_at,p_now),
    'EXPLICIT_POST_LEARNING_LINEAGE',
    null,null,'LINEAGE_VERIFIED',p_now
  from public.social_posts p
  join public.social_learnings l
    on l.tenant_id=p.tenant_id and l.learning_id=p.learning_id
  where p.learning_id is not null and p.published_at is not null
  on conflict do nothing;
  get diagnostics v_legacy=row_count;

  -- Original publisher + artifact + author gate + original post index MUST
  -- all agree. A drafted, skipped or provider-ack-only post is NOT eligible.
  -- For the first verified model, limit to one independently checkable
  -- dimension: hook_type. Length/CTA need their own post-content proof.
  insert into public.social_learning_applications(
    tenant_id,application_id,post_id,learning_id,decision_id,applied_at,
    application_role,expected_effect,actual_effect,verification_status,updated_at
  )
  select
    'bedrijfsgeheugen',
    'original-experiment-variant:'||md5(
      'linkedin_company|'||a.run_date::text||'|'||o.external_id||'|'||e.experiment_id
    ),
    p.post_id,
    'li-lus:linkedin_company:hook_type:'||(e.recipe->>'waarde'),
    null,
    o.published_at,
    'ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN',
    null,
    null,
    'EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED',
    p_now
  from public.powerhouse_content_artifacts a
  join public.powerhouse_channel_decisions d
    on d.run_date=a.run_date and d.channel=a.channel
  join public.content_publication_obligations o
    on o.publication_date=a.run_date and o.channel=a.channel
   and o.tenant_id='canonical'
  join public.social_posts p
    on p.tenant_id='bedrijfsgeheugen'
   and p.platform='linkedin' and p.channel_kind='linkedin_company'
   and p.external_post_id=o.external_id
  join public.social_experiments e
    on e.tenant_id='bedrijfsgeheugen'
   and e.experiment_id=a.generation_evidence->'linkedin_loop'->>'experiment_id'
  where a.channel='linkedin_company'
    and a.run_date between (p_now at time zone 'Europe/Amsterdam')::date-35
                       and (p_now at time zone 'Europe/Amsterdam')::date
    and a.status='published' and d.state='published'
    and o.status='LIVE_PROVEN' and o.live_proven_at is not null
    and o.external_id is not null and o.external_id=d.delivery_ref
    and o.published_at is not null and o.published_at<=p_now
    and p.published_at is not null
    and abs(extract(epoch from (p.published_at-o.published_at))) < 300
    and p.published_at>=e.started_at
    and e.recipe->>'soort'='linkedin_lus'
    and e.recipe->>'kanaal'='linkedin_company'
    and e.recipe->>'dimensie'='hook_type'
    and e.recipe->>'waarde'=a.generation_evidence->>'hook_type'
    and a.generation_evidence->'linkedin_loop'->>'state'
        in ('EXPERIMENT_LOOPT','NIEUW_EXPERIMENT')
    and a.generation_evidence->'linkedin_loop'->>'dimensie'='hook_type'
    and a.generation_evidence->'linkedin_loop'->>'waarde'=e.recipe->>'waarde'
    and e.status in ('ACTIVE','COMPLETE','INSUFFICIENT_EVIDENCE')
  on conflict do nothing;
  get diagnostics v_verified_variant=row_count;
  -- Original outcome-feedback phase, inside the SAME minute-39 runtime mux.
  -- A genuine provider-observed exposed post is not automatically a causal win.
  -- This never creates new external provider calls, posts, schedules or retries.
  for r in
    select a.tenant_id,a.application_id,a.post_id,a.learning_id,
      p.published_at,p.external_post_id,
      s.observed_at,s.source_event_id,
      (s.metrics->>'impressions')::numeric as impressions,
      (s.metrics->>'likes')::numeric as likes,
      (s.metrics->>'comments')::numeric as comments,
      (s.metrics->>'clicks')::numeric as clicks
    from public.social_learning_applications a
    join public.social_posts p on p.tenant_id=a.tenant_id and p.post_id=a.post_id
      and p.channel_kind='linkedin_company' and p.platform='linkedin'
      and p.published_at is not null
    join lateral (
      select m.observed_at,m.source_event_id,m.metrics
      from public.social_metric_snapshots m
      where m.tenant_id=a.tenant_id and m.post_id=a.post_id
        and m.source='windsor-linkedin-company'
        and m.data_quality='PROVIDER_OBSERVED_LINKED'
        and m.metrics->>'independent_proof'='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'
        and m.metrics->>'provider_organization_urn'='urn:li:organization:18234216'
        and m.metrics->>'provider_post_urn'=p.external_post_id
        and jsonb_typeof(m.metrics->'impressions')='number'
        and m.observed_at>=p.published_at+interval '24 hours'
        and m.observed_at<=p.published_at+interval '8 days'
        and m.observed_at<=p_now+interval '5 minutes'
        and m.source_event_id is not null
        and not exists (
          select 1 from public.social_learning_evaluations existing
          where existing.tenant_id=a.tenant_id
            and existing.post_id=a.post_id
            and existing.evaluation_id='original-variant-observation:'||
                md5(a.application_id||'|'||m.source_event_id)
            and existing.evidence->>'application_id'=a.application_id
            and existing.evidence->>'source_event_id'=m.source_event_id
        )
      -- Oldest first: bounded replay catches up safely, without losing later
      -- provider observations or changing the first accepted evaluation.
      order by m.observed_at,m.source_event_id limit 4
    ) s on true
    where a.tenant_id='bedrijfsgeheugen'
      and a.application_role='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'
      and a.verification_status in (
        'EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED',
        'PROVIDER_METRICS_OBSERVED_LOW_EXPOSURE',
        'PROVIDER_METRICS_OBSERVED_NO_CONTROL'
      )
      and a.actual_effect is null
      and p.published_at<=p_now-interval '24 hours'
    order by a.applied_at,a.application_id limit 20
  loop
    if r.impressions is null or r.impressions<0 or r.impressions>1000000000 then
      continue;
    end if;
    insert into public.social_learning_evaluations (
      tenant_id,evaluation_id,post_id,window_hours,observed_at,metric_vector,
      cohort_size,evidence
    ) values (
      r.tenant_id,
      'original-variant-observation:'||md5(r.application_id||'|'||r.source_event_id),
      r.post_id,
      case when r.observed_at>=r.published_at+interval '72 hours' then 72
           when r.observed_at>=r.published_at+interval '48 hours' then 48
           else 24 end,
      r.observed_at,
      jsonb_build_object('impressions',r.impressions,'likes',r.likes,
        'comments',r.comments,'clicks',r.clicks,
        'provider_post_id',r.external_post_id,
        'metric_scope','DESCRIPTIVE_EXPOSURE_NOT_CAUSAL_LIFT'),
      1,
      jsonb_build_object('application_id',r.application_id,
        'learning_id',r.learning_id,'source_event_id',r.source_event_id,
        'actual_observation_age_hours',round((extract(epoch from
          (r.observed_at-r.published_at))/3600)::numeric,2),
        'nominal_window_not_exact_hour_bucket',true,
        'exposure_minimum_reached',r.impressions>=50,
        'verified_control_group',false,
        'causal_improvement_verified',false,
        'authority','original_backfill_social_learning_applications_v1')
    )
    on conflict (tenant_id,evaluation_id) do nothing;
    get diagnostics v_affected=row_count;
    v_observations:=v_observations+v_affected;
    -- A pre-existing exact receipt is never counted twice and never triggers
    -- an unrelated modification of the original content learning status.
    if v_affected=0 then continue; end if;

    insert into public.social_learnings(
      tenant_id,learning_id,fingerprint,component_scope,claim,effect_metric,
      effect_size,sample_size,confidence,status,last_validated_at,evidence_refs,
      baseline_definition,evidence_window,first_seen_at,expires_or_review_at)
    values (
      r.tenant_id,r.learning_id,'original-provider-variant:'||r.learning_id,
      'linkedin:linkedin_company',
      'Original variant published with independent LinkedIn provider observation; effect versus a controlled baseline is not established.',
      'provider_post_impressions',null,1,0,'TESTING',r.observed_at,
      jsonb_build_array(jsonb_build_object('application_id',r.application_id,
        'post_id',r.post_id,'provider_source_event_id',r.source_event_id,
        'actual_impressions',r.impressions,'causal_effect_proven',false)),
      'Original single independently posted variant, no control group',
      r.published_at::date::text||'..'||r.observed_at::date::text,
      r.published_at,p_now+interval '30 days'
    ) on conflict do nothing;
    get diagnostics v_affected=row_count;
    v_learning_records:=v_learning_records+v_affected;

    -- Explicitly carry the new independent post-source receipt into the
    -- ORIGINAL learning memory. Preserve exploratory effect_size/sample_size:
    -- repeated snapshots from one post are NOT independent experiments.
    -- If the existing original bg_social_lus_beoordelen owns this learning,
    -- do not overwrite its baseline hypothesis or PROVEN status.
    update public.social_learnings l
       set evidence_refs=coalesce(l.evidence_refs,'[]'::jsonb) ||
         jsonb_build_array(jsonb_build_object(
           'application_id',r.application_id,'post_id',r.post_id,
           'provider_source_event_id',r.source_event_id,
           'actual_impressions',r.impressions,'causal_effect_proven',false)),
           last_validated_at=greatest(coalesce(l.last_validated_at,r.observed_at),r.observed_at),
           updated_at=p_now
     where l.tenant_id=r.tenant_id
       and l.learning_id=r.learning_id
       and l.status='TESTING'
       and l.fingerprint in ('original-provider-variant:'||r.learning_id,
                            'li-lus|linkedin_company|hook_type|'||
                              split_part(r.learning_id,':',4))
       and not exists (
         select 1 from jsonb_array_elements(coalesce(l.evidence_refs,'[]'::jsonb)) ref
         where ref->>'provider_source_event_id'=r.source_event_id
       );
    get diagnostics v_affected=row_count;
    v_learning_records:=v_learning_records+v_affected;

    update public.social_learning_applications a
    set verification_status=case when r.impressions<50
      then 'PROVIDER_METRICS_OBSERVED_LOW_EXPOSURE'
      else 'PROVIDER_METRICS_OBSERVED_NO_CONTROL' end,
      updated_at=p_now
    where a.tenant_id=r.tenant_id and a.application_id=r.application_id
      and a.actual_effect is null
      and a.verification_status='EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED';
    get diagnostics v_affected=row_count;
    v_status_updates:=v_status_updates+v_affected;
  end loop;
  return v_legacy+v_verified_variant+v_observations+v_learning_records+v_status_updates;
end;
$$;

revoke all on function public.powerhouse_backfill_social_learning_applications_v1(timestamptz)
  from public,anon,authenticated;
grant execute on function public.powerhouse_backfill_social_learning_applications_v1(timestamptz)
  to service_role;

commit;
