CREATE OR REPLACE FUNCTION public.bg_social_lus_cyclus(p_channel text, p_run_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_beoordeeld jsonb; v_actief public.social_experiments; v_basis jsonb; v_hist jsonb;
  v_dims text[]; v_dim text; v_waarde text; v_waarden text[]; v_kort text; v_eid text; v_state text;
  v_med_imp numeric; v_med_re numeric; v_gemeten int; v_onder boolean; v_bewijs jsonb; v_guard text; v_hyp text; v_instr text; v_uitleg text; v_tags jsonb; v_personal_analysis jsonb := '{}'::jsonb; v_personal_count integer; v_personal_observed timestamptz;
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

  -- Original analyst: observational length cohorts on independently verified personal copy.
  -- Never rewrite a verified source or claim the variant was assigned.
  if p_channel='linkedin_personal' then
    begin
      with exact_posts as (
        select p.tenant_id,p.post_id,p.published_at,
          cardinality(regexp_split_to_array(trim(a.body),'\s+')) words
        from public.content_publication_obligations o
        join public.powerhouse_content_artifacts a on a.run_date=o.publication_date and a.channel=o.channel
        join public.powerhouse_channel_decisions d on d.run_date=o.publication_date and d.channel=o.channel and d.delivery_ref=o.external_id
        join public.social_posts p on p.tenant_id=o.tenant_id and p.external_post_id=o.external_id and p.channel_kind=o.channel
        where o.tenant_id='canonical' and o.channel='linkedin_personal'
          and o.status in ('LIVE_PROVEN','MEASURED','LEARNED') and o.live_proven_at is not null
          and o.published_at>=now()-interval '28 days' and o.published_at<=now()
          and abs(extract(epoch from p.published_at-o.published_at))<300
          and public.powerhouse_jsonb_object_v1(o.evidence)->>'independent_public_full_copy_matched'='true'
          and public.powerhouse_jsonb_object_v1(o.evidence)->>'independent_public_readback_verified'='true'
          and public.powerhouse_jsonb_object_v1(o.evidence)->>'provider_truth_verified'='true'
          and public.powerhouse_jsonb_object_v1(o.evidence)->>'final_text_hash'=encode(sha256(convert_to(a.body,'UTF8')),'hex')
      ), measured as (
        select distinct on (p.post_id) p.post_id,p.words,s.source_event_id,s.observed_at,(s.metrics->>'reactions')::numeric reactions
        from exact_posts p join public.social_metric_snapshots s using(tenant_id,post_id)
        where s.source='composio-linkedin' and s.data_quality='OBSERVED_PARTIAL_SCOPE'
          and jsonb_typeof(s.metrics->'reactions')='number'
          and (s.metrics->>'reactions')::numeric>=0 and s.source_event_id is not null
          and s.observed_at between p.published_at+interval '24 hours' and p.published_at+interval '36 hours'
          and s.observed_at<=now()
        order by p.post_id,s.observed_at,s.snapshot_id
      ), cohorts as (
        select case when words between 130 and 159 then '130-159' when words between 160 and 179 then '160-179'
          when words between 180 and 200 then '180-200' else 'other' end length_group,
          count(*) n,percentile_cont(0.5) within group(order by reactions) median_reactions,
          jsonb_agg(jsonb_build_object('post_id',post_id,'source_event_id',source_event_id) order by post_id) receipts
        from measured group by 1
      )
      select jsonb_build_object('contract','personal_exact_copy_observational_length_v1',
        'causal_effect_proven',false,'variant_assignment_proven',false,'metric','reactions',
        'preferred_length',case when (select count(*) from cohorts where n>=4 and length_group<>'other')>=2
          then (select length_group from cohorts where n>=4 and length_group<>'other' order by median_reactions desc,n desc,length_group limit 1) end,
        'cohorts',coalesce((select jsonb_agg(to_jsonb(c) order by length_group) from cohorts c),'[]'::jsonb),
        'use','Select only among equally eligible verified sources; do not rewrite frozen copy or bypass review.'),
        (select count(*) from measured),(select max(observed_at) from measured)
      into v_personal_analysis,v_personal_count,v_personal_observed;
      if v_personal_count>0 then
        insert into public.social_learnings(tenant_id,learning_id,fingerprint,component_scope,claim,effect_metric,effect_size,
          sample_size,confidence,status,last_validated_at,evidence_refs,baseline_definition,evidence_window,first_seen_at,expires_or_review_at)
        values('canonical','linkedin-personal-observed-length-v1','linkedin-personal-observed-length-v1',
          'linkedin:linkedin_personal','Observational length comparison of independently verified personal posts; no causal claim.',
          'median_reactions',null,v_personal_count,0,'TESTING',v_personal_observed,
          jsonb_build_array(v_personal_analysis),'Same channel, first provider observation 24–36h, exact published copy',
          ((now()-interval '28 days')::date)::text||'..'||now()::date::text,now(),now()+interval '30 days')
        on conflict(tenant_id,learning_id) do update set sample_size=excluded.sample_size,
          evidence_refs=excluded.evidence_refs,last_validated_at=excluded.last_validated_at,
          evidence_window=excluded.evidence_window,expires_or_review_at=excluded.expires_or_review_at,updated_at=now()
        where public.social_learnings.status='TESTING' and public.social_learnings.evidence_refs is distinct from excluded.evidence_refs;
      end if;
    exception when others then
      v_personal_analysis:=jsonb_build_object('state','ANALYSIS_UNAVAILABLE','sqlstate',sqlstate);
    end;
  end if;

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
      'instructie', v_actief.recipe->>'instructie', 'tags_backfill', v_tags, 'personal_observational_analysis', v_personal_analysis);
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
    return jsonb_build_object('state', 'GEEN_NIEUWE_VARIANT', 'meting_state', v_state, 'beoordeeld', v_beoordeeld, 'tags_backfill', v_tags, 'personal_observational_analysis',v_personal_analysis);
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
    'baseline', v_basis - 'post_ids', 'bewijs', v_bewijs, 'beoordeeld', v_beoordeeld, 'instructie', v_instr, 'tags_backfill', v_tags, 'personal_observational_analysis',v_personal_analysis);
end $function$
;;
