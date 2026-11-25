CREATE OR REPLACE FUNCTION public.bg_social_lus_cyclus(p_channel text, p_run_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_beoordeeld jsonb; v_actief public.social_experiments; v_basis jsonb; v_hist jsonb;
  v_dims text[]; v_dim text; v_waarde text; v_waarden text[]; v_kort text; v_eid text; v_state text;
  v_med_imp numeric; v_med_re numeric; v_gemeten int; v_onder boolean; v_bewijs jsonb; v_guard text; v_hyp text; v_instr text; v_uitleg text; v_tags jsonb;
begin
  if p_channel not in ('linkedin_company', 'linkedin_personal') then
    return jsonb_build_object('state', 'NOT_APPLICABLE');
  end if;
  -- Tags uit de posttekst vastleggen (idempotent, alleen onbekende tags). Een fout hier mag de lus niet breken, maar wordt wel zichtbaar teruggegeven.
  begin
    v_tags := public.bg_post_tags_backfill();
  exception when others then
    v_tags := jsonb_build_object('state', 'FOUT', 'melding', sqlerrm);
  end;
  v_kort := case p_channel when 'linkedin_company' then 'co' else 'pe' end;
  v_beoordeeld := public.bg_social_lus_beoordelen(p_run_date);

  -- Eén primaire variabele tegelijk: loopt er al een experiment voor dit kanaal, dan krijgt de generator dat opnieuw.
  select * into v_actief from public.social_experiments
    where tenant_id = 'bedrijfsgeheugen' and status = 'ACTIVE' and recipe->>'soort' = 'linkedin_lus' and recipe->>'kanaal' = p_channel
    order by started_at desc limit 1;

  v_basis := public.bg_social_lus_meting(p_channel, now() - interval '28 days');
  v_gemeten := coalesce((v_basis->>'gemeten')::int, 0);
  v_med_imp := (v_basis->>'mediaan_impressies')::numeric; v_med_re := (v_basis->>'mediaan_reacties')::numeric;
  v_onder := v_gemeten < 3 or (v_med_imp is not null and v_med_imp < 50) or (v_med_imp is null and v_med_re is not null and v_med_re < 1);
  v_state := case when v_gemeten = 0 then 'GEEN_METING' when v_med_imp is null then 'BEREIK_NIET_BESCHIKBAAR' when v_onder then 'ONDERPRESTEREND' else 'OP_PEIL' end;

  -- Wat is er recent gevarieerd? Eigen geschiedenis: laatste 10 posts van dit kanaal met hun kenmerken.
  select coalesce(jsonb_object_agg(d, vals), '{}'::jsonb) into v_hist from (
    select d, coalesce(jsonb_agg(distinct v) filter (where v is not null), '[]'::jsonb) vals from (
      select x.d, x.v from (
        select p.post_id, k.format as f, k.hook_type as h, k.cta_type as c,
          case when k.tags is null then null when cardinality(k.tags) = 0 then 'geen_hashtags' when cardinality(k.tags) = 3 then 'drie_hashtags' else 'ander_aantal_hashtags' end as t
        from public.social_posts p
        left join public.bg_post_kenmerken k on k.post_key in (p.post_id, p.external_post_id)
        where p.tenant_id = case when p_channel='linkedin_personal' then 'canonical' else 'bedrijfsgeheugen' end and p.channel_kind = p_channel
        order by p.published_at desc limit 10) r
      cross join lateral (values ('format', r.f), ('hook_type', r.h), ('cta_type', r.c), ('tags', r.t)) as x(d, v)) y
    group by d) z;

  if v_actief.experiment_id is not null then
    return jsonb_build_object('state', 'EXPERIMENT_LOOPT', 'meting_state', v_state, 'experiment_id', v_actief.experiment_id,
      'dimensie', v_actief.recipe->>'dimensie', 'waarde', v_actief.recipe->>'waarde', 'beoordeeld', v_beoordeeld,
      'instructie', v_actief.recipe->>'instructie', 'tags_backfill', v_tags);
  end if;

  v_dims := case p_channel when 'linkedin_company' then array['hook_type'] else array['hook_type', 'lengte', 'slotvraag', 'tags'] end;

  -- Kies de dimensie met de minste variatie in de laatste 10 posts; daarbinnen de waarde die nog niet gebruikt en niet eerder verworpen is,
  -- met voorrang voor eerder bevestigde waarden en daarna waarden met extern/intern bewijs.
  select s.dim, s.waarde into v_dim, v_waarde from (
    select d.dim, c.waarde,
      coalesce(jsonb_array_length(v_hist->d.dim), 0) as variatie,
      (select count(*) from public.social_experiments h where h.tenant_id='bedrijfsgeheugen'
       and h.recipe->>'soort'='linkedin_lus' and h.recipe->>'kanaal'=p_channel
       and h.recipe->>'dimensie'=d.dim and h.recipe->>'waarde'=c.waarde
       and h.started_at>=now()-interval '60 days') as recent_tests,
      (select count(*) from public.revenue_learnings l where l.tenant_id = 'bedrijfsgeheugen' and l.status = 'PROMOTED'
         and l.fingerprint = 'li-lus|' || p_channel || '|' || d.dim || '|' || c.waarde) as bevestigd,
      (select count(*) from public.bg_linkedin_bewijs b where b.richting = 'voor' and b.dimensie = d.dim and b.waarde = c.waarde and b.kanaal in (p_channel, 'beide')) as bewijs
    from unnest(v_dims) with ordinality as d(dim, ord)
    cross join lateral unnest(case
      when d.dim = 'format' then array['carousel', 'text', 'image']
      when d.dim = 'cta_type' then array['discussion_question', 'insight_no_cta', 'diagnostic_offer']
      when d.dim = 'hook_type' then array['concrete_number', 'problem_consequence', 'contrarian_observation']
      when d.dim = 'lengte' then array['kort_130', 'lang_200']
      when d.dim = 'tags' then array['drie_hashtags', 'geen_hashtags']
      else array['specifieke_vraag', 'keuzevraag'] end) as c(waarde)
    where (p_channel='linkedin_company' or not (coalesce(v_hist->d.dim, '[]'::jsonb) ? c.waarde))
      and not exists (select 1 from public.revenue_learnings l where l.tenant_id = 'bedrijfsgeheugen' and l.status = 'REJECTED'
        and l.fingerprint = 'li-lus|' || p_channel || '|' || d.dim || '|' || c.waarde and l.last_validated_at > now() - interval '90 days')
  ) s
  order by s.bevestigd desc, s.recent_tests asc, s.variatie asc, s.bewijs desc, md5(s.dim || s.waarde || p_run_date::text)
  limit 1;

  if v_dim is null then
    return jsonb_build_object('state', 'GEEN_NIEUWE_VARIANT', 'meting_state', v_state, 'beoordeeld', v_beoordeeld, 'tags_backfill', v_tags);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('bewijs_id', b.bewijs_id, 'richting', b.richting, 'claim', b.claim, 'bron_url', b.bron_url, 'bron_datum', b.bron_datum)), '[]'::jsonb)
    into v_bewijs from public.bg_linkedin_bewijs b where b.kanaal in (p_channel, 'beide') and (b.dimensie = v_dim and b.waarde = v_waarde or b.richting = 'tegen');

  v_guard := case p_channel
    when 'linkedin_personal' then 'Behoud de persoonlijke regels: ik-vorm, geen sales-CTA, geen link, geen emoji, geen verzonnen ervaring, 130-200 woorden (tenzij de variabele lengte is), eindig met één oprechte open vraag.'
    else 'Behoud de bedrijfsregels: geen externe link in de posttekst, geen engagement bait (geen like/comment/tag-verzoek), geen verzonnen cijfers of klantresultaten.' end;
  v_uitleg := case
    when v_dim = 'tags' and v_waarde = 'drie_hashtags' then ' Betekenis: eindig de post met precies 3 inhoudelijke hashtags (thema, doelgroep, probleem) op een eigen regel; geen merk- of volgershashtags, geen hashtag in de lopende tekst, geen verzoek om te taggen, te liken of te delen.'
    when v_dim = 'tags' and v_waarde = 'geen_hashtags' then ' Betekenis: gebruik geen enkele hashtag en tag niemand in de tekst.'
    else '' end;
  v_hyp := 'Op ' || p_channel || ' levert ' || v_dim || '=' || v_waarde || ' een hogere mediaan ' || case when v_med_imp is not null then 'impressies' else 'reacties' end || ' op dan de eigen baseline van de laatste 28 dagen.';
  v_instr := 'LINKEDIN-LUS (data-gedreven, één variabele): pas in deze post uitsluitend ' || v_dim || ' = ' || v_waarde
    || ' toe en houd alles anders gelijk aan de normale regels. Reden: ' || case v_state when 'GEEN_METING' then 'er is nog geen bruikbare meting; we testen om te leren.' when 'ONDERPRESTEREND' then 'de laatste posts presteren onder de drempel (mediaan impressies ' || coalesce(round(v_med_imp)::text, 'onbekend') || ', gemeten posts ' || v_gemeten || ').' else 'variatie voor leerwinst.' end
    || v_uitleg || ' ' || v_guard || ' Presenteer dit nooit als bewezen winnaar en noem het experiment niet in de publieke tekst.';
  v_eid := 'li-lus-' || v_kort || '-' || to_char(p_run_date, 'YYYYMMDD');

  insert into public.social_experiments (tenant_id, experiment_id, hypothesis, primary_metric, comparison_scope, started_at, status, recipe, source_signals,
    commercial_hypothesis, target_channels, calendar_date, variant, controle, meetpunt, min_steekproef, looptijd_dagen, beslisdatum, basislijn, voorgesteld_door, onderbouwing)
  values ('bedrijfsgeheugen', v_eid, v_hyp, case when v_med_imp is not null then 'mediaan_impressies' else 'mediaan_reacties' end,
    jsonb_build_object('kanaal', p_channel, 'vergelijking', 'voor-na eigen kanaal, geen controlegroep'), now(), 'ACTIVE',
    jsonb_build_object('soort', 'linkedin_lus', 'kanaal', p_channel, 'dimensie', v_dim, 'waarde', v_waarde, 'verlengingen', 0, 'instructie', v_instr),
    jsonb_build_object('meting_state', v_state, 'bewijs', v_bewijs, 'historie_laatste_10', v_hist),
    'Meer relevante bereik en gesprekken op LinkedIn leidt tot meer gekwalificeerde gesprekken; beoordeeld op bereik en reacties, niet op likes alleen.',
    jsonb_build_array(p_channel), p_run_date, v_dim || '=' || v_waarde, 'laatste 28 dagen eigen posts', 'Eerste providerobservatie 24-36 uur na publicatie; alleen bevestigde varianttoepassing',
    4, 7, p_run_date + 7, v_basis, 'agent:bg-linkedin-lus',
    'Gekozen op bewezen leerregels, minst herhaalde tests in 60 dagen, eigen variatie en bronbewijs; zakelijk uitsluitend verifieerbare hook_type.')
  on conflict (tenant_id, experiment_id) do nothing;

  return jsonb_build_object('state', 'NIEUW_EXPERIMENT', 'meting_state', v_state, 'experiment_id', v_eid, 'dimensie', v_dim, 'waarde', v_waarde,
    'baseline', v_basis - 'post_ids', 'bewijs', v_bewijs, 'beoordeeld', v_beoordeeld, 'instructie', v_instr, 'tags_backfill', v_tags);
end $function$
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
    v_min := greatest(coalesce(e.min_steekproef, 4),4); v_verl := coalesce((e.recipe->>'verlengingen')::int, 0);
    -- Metingen jonger dan 24 uur tellen nog niet mee: alleen posts die vóór beslisdatum-1 zijn gepubliceerd.
    e.basislijn := public.bg_social_lus_meting(v_kanaal, e.started_at - interval '28 days', e.started_at);
    -- Only a receipt tied to this exact experiment and provider post may enter treatment.
    -- Personal frozen-source lane has no verified variant receipt yet; never invent one.
    with treatment as (
      select distinct p.post_id,p.tenant_id,p.published_at,p.external_post_id
      from public.social_posts p
      join public.social_learning_applications a on a.tenant_id=p.tenant_id and a.post_id=p.post_id
      join public.content_publication_obligations o on o.tenant_id='canonical' and o.channel='linkedin_company'
        and o.external_id=p.external_post_id and o.status in ('LIVE_PROVEN','MEASURED','LEARNED') and o.live_proven_at is not null
      where v_kanaal='linkedin_company' and p.tenant_id='bedrijfsgeheugen' and p.channel_kind=v_kanaal
        and a.application_role='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'
        and a.application_id='original-experiment-variant:'||md5('linkedin_company|'||o.publication_date::text||'|'||o.external_id||'|'||e.experiment_id)
        and p.published_at>=e.started_at and p.published_at<(p_run_date-1)::timestamptz
    ), first_observation as (
      select distinct on (p.post_id) p.post_id,s.metrics
      from treatment p join public.social_metric_snapshots s on s.tenant_id=p.tenant_id and s.post_id=p.post_id
      where s.source='windsor-linkedin-company' and s.data_quality='PROVIDER_OBSERVED_LINKED'
        and s.metrics->>'independent_proof'='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'
        and s.metrics->>'provider_post_urn'=p.external_post_id
        and s.observed_at between p.published_at+interval '24 hours' and p.published_at+interval '36 hours'
        and s.observed_at<=now()
      order by p.post_id,s.observed_at,s.snapshot_id
    ), metrics as (
      select case when jsonb_typeof(metrics->'impressions')='number' then (metrics->>'impressions')::numeric end imp,
        case when jsonb_typeof(metrics->'likes')='number' and jsonb_typeof(metrics->'comments')='number'
          then (metrics->>'likes')::numeric+(metrics->>'comments')::numeric end reacties
      from first_observation
    )
    select jsonb_build_object('gemeten',count(*) filter(where imp is not null or reacties is not null),
      'gemeten_impressies',count(imp),'gemeten_reacties',count(reacties),
      'mediaan_impressies',percentile_cont(0.5) within group(order by imp),
      'mediaan_reacties',percentile_cont(0.5) within group(order by reacties),
      'impressies_beschikbaar',count(imp)>0)
      into v_meet from metrics;
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
      basislijn = e.basislijn, resultaat = jsonb_build_object('measurement_contract', 'exact_variant_receipt_provider_first_24_to_36h_v2', 'metriek', v_metriek, 'basislijn', v_basis, 'tijdens', v_nu, 'uplift_relatief', v_uplift, 'gemeten_posts', v_n,
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
        'uplift_relatief', v_uplift, 'gemeten_posts', v_n, 'leerregel', v_lid, 'post_application_proven', v_n>0, 'decision_scope','EXACT_VARIANT_COHORT_NOT_CAUSAL'), now())
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
