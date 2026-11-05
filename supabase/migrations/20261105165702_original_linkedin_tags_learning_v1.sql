-- APPLIED op productie (adhjwmvyoixzjtmiroln) op 2026-11-05 als versie 20261105165702, met readback: leg tags (hashtags) per LinkedIn-post vast en maak 'tags' een dimensie van de BESTAANDE LinkedIn-lus.
-- Owner: public.bg_social_lus_cyclus, aangeroepen door de BESTAANDE powerhouse-content-orchestrator. Geen nieuwe cron, tabel, sender of publisher.
-- Alleen bg_post_kenmerken wordt aangevuld (kolommen tags, tags_bron); social_posts en social_metric_snapshots worden niet geschreven.
-- Tags komen uit de gegenereerde posttekst (powerhouse_content_artifacts.body, status published) en alleen bij een 1-op-1 koppeling per kanaal en dag (Europe/Amsterdam).
-- tags = '{}' betekent: gekoppelde tekst bevat geen hashtag. tags IS NULL betekent: onbekend. Geen gok bij meerdere posts of artifacts op dezelfde dag.
-- Terugdraaien: kolommen droppen en bg_social_lus_cyclus herstellen vanuit 20261105080000_original_linkedin_learning_source_truth.sql.
alter table public.bg_post_kenmerken
  add column if not exists tags text[],
  add column if not exists tags_bron text;

create or replace function public.bg_tags_uit_tekst(p_tekst text)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array_agg(distinct lower(m[1]) order by lower(m[1])), '{}'::text[])
  from regexp_matches(coalesce(p_tekst, ''), '(?:^|[[:space:](])#([[:alpha:]][[:alnum:]_]{1,48})', 'g') as m
$$;

revoke all on function public.bg_tags_uit_tekst(text) from public, anon, authenticated;
grant execute on function public.bg_tags_uit_tekst(text) to service_role;

create or replace function public.bg_post_tags_backfill()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_gezet int := 0; v_onbekend int := 0;
begin
  with p as (
    select sp.post_id, sp.channel_kind, (sp.published_at at time zone 'Europe/Amsterdam')::date as d
    from public.social_posts sp
    where sp.platform = 'linkedin' and sp.channel_kind in ('linkedin_company', 'linkedin_personal') and sp.published_at is not null
  ), pc as (
    select channel_kind, d, count(*) as n from p group by 1, 2
  ), a as (
    select channel, run_date, count(*) as n, (array_agg(body))[1] as body, (array_agg(status))[1] as status
    from public.powerhouse_content_artifacts
    where channel in ('linkedin_company', 'linkedin_personal')
    group by 1, 2
  ), z as (
    select p.post_id, public.bg_tags_uit_tekst(a.body) as tags
    from p
    join pc on pc.channel_kind = p.channel_kind and pc.d = p.d and pc.n = 1
    join a on a.channel = p.channel_kind and a.run_date = p.d and a.n = 1 and a.status = 'published' and a.body is not null
  )
  update public.bg_post_kenmerken k
     set tags = z.tags, tags_bron = 'artifact-datum-kanaal-uniek', bijgewerkt_op = now()
    from z
   where k.post_key = z.post_id and k.tags is null;
  get diagnostics v_gezet = row_count;

  select count(*) into v_onbekend
    from public.social_posts sp
    left join public.bg_post_kenmerken k on k.post_key = sp.post_id
   where sp.platform = 'linkedin' and sp.channel_kind in ('linkedin_company', 'linkedin_personal') and k.tags is null;

  return jsonb_build_object('state', 'OK', 'tags_vastgelegd', v_gezet, 'posts_zonder_tagbron', v_onbekend);
end $$;

revoke all on function public.bg_post_tags_backfill() from public, anon, authenticated;
grant execute on function public.bg_post_tags_backfill() to service_role;

create or replace function public.bg_social_lus_cyclus(p_channel text, p_run_date date default current_date)
returns jsonb language plpgsql security definer set search_path = '' as $$
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

  v_dims := case p_channel when 'linkedin_company' then array['format', 'cta_type', 'hook_type', 'tags'] else array['hook_type', 'lengte', 'slotvraag', 'tags'] end;

  -- Kies de dimensie met de minste variatie in de laatste 10 posts; daarbinnen de waarde die nog niet gebruikt en niet eerder verworpen is,
  -- met voorrang voor eerder bevestigde waarden en daarna waarden met extern/intern bewijs.
  select s.dim, s.waarde into v_dim, v_waarde from (
    select d.dim, c.waarde,
      coalesce(jsonb_array_length(v_hist->d.dim), 0) as variatie,
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
    where not (coalesce(v_hist->d.dim, '[]'::jsonb) ? c.waarde)
      and not exists (select 1 from public.revenue_learnings l where l.tenant_id = 'bedrijfsgeheugen' and l.status = 'REJECTED'
        and l.fingerprint = 'li-lus|' || p_channel || '|' || d.dim || '|' || c.waarde and l.last_validated_at > now() - interval '90 days')
  ) s
  order by s.variatie asc, s.bevestigd desc, s.bewijs desc, md5(s.dim || s.waarde || p_run_date::text)
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
    jsonb_build_array(p_channel), p_run_date, v_dim || '=' || v_waarde, 'laatste 28 dagen eigen posts', '72 uur na publicatie: impressies en reacties',
    2, 3, p_run_date + 3, v_basis, 'agent:bg-linkedin-lus',
    'Gekozen omdat ' || v_dim || ' de minste variatie had in de laatste 10 posts en ' || v_waarde || ' daar nog niet in voorkwam of verworpen was.')
  on conflict (tenant_id, experiment_id) do nothing;

  return jsonb_build_object('state', 'NIEUW_EXPERIMENT', 'meting_state', v_state, 'experiment_id', v_eid, 'dimensie', v_dim, 'waarde', v_waarde,
    'baseline', v_basis - 'post_ids', 'bewijs', v_bewijs, 'beoordeeld', v_beoordeeld, 'instructie', v_instr, 'tags_backfill', v_tags);
end $$;

revoke all on function public.bg_social_lus_cyclus(text,date) from public,anon,authenticated;
grant execute on function public.bg_social_lus_cyclus(text,date) to service_role;
