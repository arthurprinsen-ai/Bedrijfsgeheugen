CREATE OR REPLACE FUNCTION public.bg_social_lus_meting(p_channel text, p_vanaf timestamp with time zone, p_tot timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with posts as (
    select p.tenant_id, p.post_id, p.published_at, p.external_post_id from public.social_posts p
    where p.tenant_id = case when p_channel='linkedin_personal' then 'canonical' else 'bedrijfsgeheugen' end
      and p.channel_kind = p_channel
      and p.published_at >= p_vanaf and (p_tot is null or p.published_at < p_tot)
  ), laatste as (
    select distinct on (s.post_id) s.post_id, s.observed_at, s.metrics from public.social_metric_snapshots s
    join posts on s.tenant_id=posts.tenant_id and s.post_id=posts.post_id
    where s.observed_at >= posts.published_at + interval '24 hours'
      and s.observed_at <= posts.published_at + interval '36 hours'
      and s.observed_at <= now()
      and ((p_channel='linkedin_company' and s.source='windsor-linkedin-company'
        and s.data_quality='PROVIDER_OBSERVED_LINKED'
        and s.metrics->>'independent_proof'='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'
        and s.metrics->>'provider_post_urn'=posts.external_post_id)
        or (p_channel='linkedin_personal' and s.source='composio-linkedin'
        and s.data_quality='OBSERVED_PARTIAL_SCOPE'))
    order by s.post_id, s.observed_at asc, s.snapshot_id
  ), m as (
    select l.post_id,
      case when p_channel='linkedin_company' and jsonb_typeof(l.metrics->'impressions')='number' then (l.metrics->>'impressions')::numeric else null end as imp,
      case
        when jsonb_typeof(l.metrics->'reactions')='number' then (l.metrics->>'reactions')::numeric
        when jsonb_typeof(l.metrics->'likes')='number' or jsonb_typeof(l.metrics->'comments')='number'
          then coalesce((l.metrics->>'likes')::numeric,0) + coalesce((l.metrics->>'comments')::numeric,0)
        else null
      end as reacties
    from laatste l
  )
  select jsonb_build_object(
    'posts', (select count(*) from posts),
    'gemeten', (select count(*) from m where imp is not null or reacties is not null),
    'mediaan_impressies', (select percentile_cont(0.5) within group (order by imp) from m where imp is not null),
    'mediaan_reacties', (select percentile_cont(0.5) within group (order by reacties) from m where reacties is not null),
    'gemeten_impressies', (select count(*) from m where imp is not null),
    'gemeten_reacties', (select count(*) from m where reacties is not null),
    'measurement_contract', 'provider_channel_first_24_to_36h_v1',
    'impressies_beschikbaar', (select count(*) from m where imp is not null)>0,
    'post_ids', coalesce((select jsonb_agg(post_id order by post_id) from posts), '[]'::jsonb));
$function$
;
CREATE OR REPLACE FUNCTION public.bg_social_lus_beoordelen(p_run_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  e public.social_experiments; v_kanaal text; v_dim text; v_waarde text; v_meet jsonb; v_basis numeric; v_nu numeric;
  v_n int; v_min int; v_verl int; v_uplift numeric; v_besluit text; v_status text; v_lstatus text; v_lid text; v_did text;
  v_pid text; v_uit jsonb := '[]'::jsonb; v_metriek text; v_baseline_ok boolean;
begin
  for e in
    select * from public.social_experiments
    where tenant_id = 'bedrijfsgeheugen' and status = 'ACTIVE' and recipe->>'soort' = 'linkedin_lus' and beslisdatum <= p_run_date
    order by beslisdatum, experiment_id limit 5
  loop
    v_kanaal := e.recipe->>'kanaal'; v_dim := e.recipe->>'dimensie'; v_waarde := e.recipe->>'waarde';
    v_min := coalesce(e.min_steekproef, 2); v_verl := coalesce((e.recipe->>'verlengingen')::int, 0);
    -- Metingen jonger dan 24 uur tellen nog niet mee: alleen posts die vóór beslisdatum-1 zijn gepubliceerd.
    e.basislijn := public.bg_social_lus_meting(v_kanaal, e.started_at - interval '28 days', e.started_at);
    v_meet := public.bg_social_lus_meting(v_kanaal, e.started_at, (p_run_date - 1)::timestamptz);
    v_n := coalesce((v_meet->>'gemeten')::int, 0);
    v_metriek := case when e.basislijn->>'mediaan_impressies' is not null and v_meet->>'mediaan_impressies' is not null then 'impressies' else 'reacties' end;
    v_basis := coalesce((e.basislijn->>(case when v_metriek = 'impressies' then 'mediaan_impressies' else 'mediaan_reacties' end))::numeric, 0);
    v_nu := coalesce((v_meet->>(case when v_metriek = 'impressies' then 'mediaan_impressies' else 'mediaan_reacties' end))::numeric, 0);
    -- Missing provider baseline must NEVER turn zero assumed reach into causal uplift.
    v_n := coalesce((v_meet->>(case when v_metriek='impressies' then 'gemeten_impressies' else 'gemeten_reacties' end))::int,0);
    v_baseline_ok := v_basis > 0 and coalesce((e.basislijn->>(case when v_metriek='impressies' then 'gemeten_impressies' else 'gemeten_reacties' end))::int,0) >= v_min
      and e.basislijn->>(case when v_metriek='impressies' then 'mediaan_impressies' else 'mediaan_reacties' end) is not null;
    v_uplift := case when v_baseline_ok and v_n>=v_min
      then round((v_nu-v_basis) / greatest(v_basis,1),4)
      else null end;

    if v_n < v_min and v_verl < 1 then
      update public.social_experiments set beslisdatum = beslisdatum + coalesce(looptijd_dagen, 3),
        recipe = jsonb_set(recipe, '{verlengingen}', '1'::jsonb), updated_at = now()
      where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
      v_uit := v_uit || jsonb_build_object('experiment_id', e.experiment_id, 'uitkomst', 'VERLENGD', 'gemeten', v_n);
      continue;
    end if;

    if v_n < v_min or not v_baseline_ok then v_status := 'INSUFFICIENT_EVIDENCE'; v_besluit := 'onvoldoende_bewijs'; v_lstatus := 'TESTING';
    elsif v_uplift >= 0.25 then v_status := 'COMPLETE'; v_besluit := 'verkennend_positief'; v_lstatus := 'TESTING';
    elsif v_uplift <= -0.25 then v_status := 'COMPLETE'; v_besluit := 'verkennend_negatief'; v_lstatus := 'TESTING';
    else v_status := 'COMPLETE'; v_besluit := 'neutraal'; v_lstatus := 'TESTING';
    end if;

    v_lid := 'li-lus:' || v_kanaal || ':' || v_dim || ':' || v_waarde;
    v_did := 'li-lus-besluit:' || e.experiment_id;
    v_pid := 'experiment:'||e.experiment_id; -- A proposed variant has no verified published post ID.

    update public.social_experiments set status = v_status, besluit = v_besluit, besloten_op = now(), ended_at = now(), learning_id = v_lid,
      basislijn = e.basislijn, resultaat = jsonb_build_object('measurement_contract', 'provider_channel_first_24_to_36h_v1', 'metriek', v_metriek, 'basislijn', v_basis, 'tijdens', v_nu, 'uplift_relatief', v_uplift, 'gemeten_posts', v_n,
        'soort_bewijs', 'VOOR_NA_VERGELIJKING_ZONDER_CONTROLEGROEP', 'baseline_verified', v_baseline_ok, 'effect_is_causal', false, 'besloten_door', 'agent:bg-linkedin-lus'),
      updated_at = now()
    where tenant_id = e.tenant_id and experiment_id = e.experiment_id;

    insert into public.revenue_learnings (tenant_id, learning_id, fingerprint, component_scope, claim, effect_metric, effect_size, sample_size, confidence, status,
      baseline_definition, evidence_window, first_seen_at, last_validated_at, expires_or_review_at, evidence_refs)
    values ('bedrijfsgeheugen', v_lid, 'li-lus|' || v_kanaal || '|' || v_dim || '|' || v_waarde, 'linkedin:' || v_kanaal,
      case v_lstatus when 'PROMOTED' then 'Voorlopig bevestigd: ' when 'REJECTED' then 'Niet bevestigd: ' else 'Nog niet bewezen: ' end || e.hypothesis,
      'mediaan_' || v_metriek, v_uplift, v_n, 0, v_lstatus,
      'mediaan van eigen kanaal-posts in de 28 dagen vóór de start', to_char(e.started_at, 'YYYY-MM-DD') || ' t/m ' || to_char(p_run_date, 'YYYY-MM-DD'),
      e.started_at, now(), now() + interval '90 days',
      jsonb_build_array(jsonb_build_object('experiment', e.experiment_id, 'vergelijking', 'voor-na, geen controlegroep, kleine steekproef', 'besloten_door', 'agent:bg-linkedin-lus')))
    on conflict (tenant_id, learning_id) do update set status = excluded.status, claim = excluded.claim, effect_size = excluded.effect_size,
      sample_size = excluded.sample_size, last_validated_at = now(), evidence_refs = excluded.evidence_refs, updated_at = now();

    -- The ORIGINAL social learning store receives an honest TESTING lesson.
    -- This records evidence for subsequent original decisions without claiming
    -- a controlled causal winner or that an untagged post used the variant.
    insert into public.social_learnings (
      tenant_id,learning_id,fingerprint,component_scope,claim,effect_metric,effect_size,
      sample_size,confidence,status,last_validated_at,evidence_refs,baseline_definition,
      evidence_window,first_seen_at,expires_or_review_at)
    values (
      case when v_kanaal='linkedin_personal' then 'canonical' else 'bedrijfsgeheugen' end,
      v_lid, 'li-lus|'||v_kanaal||'|'||v_dim||'|'||v_waarde,
      'linkedin:'||v_kanaal, 'Verkennend, niet causaal bewezen: '||e.hypothesis,
      'mediaan_'||v_metriek, v_uplift, v_n, 0, 'TESTING', now(),
      jsonb_build_array(jsonb_build_object(
        'experiment_id',e.experiment_id,'comparison','BEFORE_AFTER_WITHOUT_CONTROL',
        'baseline_verified',v_baseline_ok,'actual_variant_application_verified',false,
        'impressions_available',coalesce((v_meet->>'impressies_beschikbaar')::boolean,false))),
      'provider-posts last 28 days, same channel and original tenant',
      to_char(e.started_at,'YYYY-MM-DD')||'..'||to_char(p_run_date,'YYYY-MM-DD'),
      coalesce(e.started_at,now()),now()+interval '30 days'
    )
    on conflict (tenant_id,learning_id) do update
      set claim=excluded.claim,effect_metric=excluded.effect_metric,
          effect_size=excluded.effect_size,sample_size=excluded.sample_size,
          status='TESTING',confidence=0,evidence_refs=excluded.evidence_refs,
          last_validated_at=now(),updated_at=now()
    where public.social_learnings.status<>'PROVEN';

    insert into public.social_learning_decisions (tenant_id, decision_id, post_id, decision, recorded_at)
    values (case when v_kanaal='linkedin_personal' then 'canonical' else 'bedrijfsgeheugen' end, v_did, v_pid,
      jsonb_build_object('experiment_id', e.experiment_id, 'kanaal', v_kanaal, 'dimensie', v_dim, 'waarde', v_waarde, 'besluit', v_besluit,
        'uplift_relatief', v_uplift, 'gemeten_posts', v_n, 'leerregel', v_lid, 'post_application_proven', false, 'decision_scope','EXPERIMENT_NOT_PROVIDER_POST'), now())
    on conflict (tenant_id, decision_id) do nothing;

    -- Do NOT mark all observed posts as applications of a variant. The original
    -- daily content generator proposes the variable but must independently
    -- attest which exact published post actually complied. No blanket backfill,
    -- fake post learning lineage, external provider side effect or false uplift.

    v_uit := v_uit || jsonb_build_object('experiment_id', e.experiment_id, 'uitkomst', v_besluit, 'uplift_relatief', v_uplift, 'gemeten', v_n);
  end loop;
  return jsonb_build_object('beoordeeld', jsonb_array_length(v_uit), 'details', v_uit);
end $function$
;;
