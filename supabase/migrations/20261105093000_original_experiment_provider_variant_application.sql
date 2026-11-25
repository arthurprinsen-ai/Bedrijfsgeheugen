-- Source: existing Powerhouse runtime mux v2 calls this SAME function on minute 39.
-- No second scheduler/provider author/sender. 2026-11-05 production investigation:
-- only independently LIVE_PROVEN company share on 2026-11-03 used the
-- exact documented hook_type=concrete_number experiment.
-- This stage is actual variant APPLICATION, not causal IMPROVEMENT or revenue.
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
  return v_legacy+v_verified_variant;
end;
$$;

revoke all on function public.powerhouse_backfill_social_learning_applications_v1(timestamptz)
  from public,anon,authenticated;
grant execute on function public.powerhouse_backfill_social_learning_applications_v1(timestamptz)
  to service_role;

commit;
