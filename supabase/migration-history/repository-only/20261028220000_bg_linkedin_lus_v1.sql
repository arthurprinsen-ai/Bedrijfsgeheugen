-- LinkedIn-lus (28 okt 2026): onderpresterende post -> data-gedreven één-variabele-experiment -> meting -> leerregel -> volgende keuze.
-- Hergebruikt het bestaande register social_experiments, revenue_learnings en social_learning_decisions/applications.
-- Geen tweede scheduler: wordt aangeroepen door powerhouse-content-orchestrator (bestaande cron). Alleen service_role.
-- Experimenten van deze lus: recipe->>'soort' = 'linkedin_lus', onderdeel/pagina/advies blijven NULL, zodat
-- intern.bg_experimenten_beoordelen en bg_experiment_autonoom_besluit (CRO) ze nooit oppakken.

create table if not exists public.bg_linkedin_bewijs (
  bewijs_id text primary key,
  kanaal text not null check (kanaal in ('linkedin_company', 'linkedin_personal', 'beide')),
  dimensie text not null,
  waarde text not null,
  richting text not null check (richting in ('voor', 'tegen')),
  claim text not null,
  bron_url text not null check (bron_url ~ '^https://'),
  bron_datum date not null,
  vertrouwen text not null default 'middel',
  vastgelegd_op timestamptz not null default now()
);
alter table public.bg_linkedin_bewijs enable row level security;
revoke all on public.bg_linkedin_bewijs from public, anon, authenticated;
grant select, insert, update on public.bg_linkedin_bewijs to service_role;
comment on table public.bg_linkedin_bewijs is 'Extern/intern onderbouwd bewijs wat op LinkedIn wel/niet werkt; elke rij heeft bron-URL en bron-datum. Alleen service_role.';

insert into public.bg_linkedin_bewijs (bewijs_id, kanaal, dimensie, waarde, richting, claim, bron_url, bron_datum, vertrouwen) values
  ('speelboek-2026-07-format-carousel', 'beide', 'format', 'carousel', 'voor',
   'Documenten/carrousels en meerdere afbeeldingen houden de lezer langer vast (verblijftijd) en scoren hoger dan alleen tekst.',
   'https://app.notion.com/p/3a5da36aac8a813799cee34689c26a10', date '2026-07-22', 'middel'),
  ('speelboek-2026-07-bait', 'beide', 'engagement_bait', 'ja', 'tegen',
   'Engagement bait (gevraagd om like/comment/tag) wordt gedempt; stel inhoudelijke vragen.',
   'https://app.notion.com/p/3a5da36aac8a813799cee34689c26a10', date '2026-07-22', 'middel'),
  ('speelboek-2026-07-link', 'beide', 'link_in_post', 'ja', 'tegen',
   'Externe links in de posttekst verlagen bereik; link niet in de hoofdtekst.',
   'https://app.notion.com/p/3a5da36aac8a813799cee34689c26a10', date '2026-07-22', 'middel')
on conflict (bewijs_id) do nothing;

create or replace function public.bg_linkedin_bewijs_vastleggen(
  p_bewijs_id text, p_kanaal text, p_dimensie text, p_waarde text, p_richting text, p_claim text, p_bron_url text, p_bron_datum date, p_vertrouwen text default 'middel')
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_bron_url is null or p_bron_url !~ '^https://' or p_bron_datum is null then raise exception 'BRON_URL_EN_DATUM_VERPLICHT'; end if;
  insert into public.bg_linkedin_bewijs (bewijs_id, kanaal, dimensie, waarde, richting, claim, bron_url, bron_datum, vertrouwen)
  values (p_bewijs_id, p_kanaal, p_dimensie, p_waarde, p_richting, p_claim, p_bron_url, p_bron_datum, coalesce(p_vertrouwen, 'middel'))
  on conflict (bewijs_id) do update set claim = excluded.claim, bron_url = excluded.bron_url, bron_datum = excluded.bron_datum,
    richting = excluded.richting, vertrouwen = excluded.vertrouwen, vastgelegd_op = now();
  return jsonb_build_object('bewijs_id', p_bewijs_id);
end $$;
revoke all on function public.bg_linkedin_bewijs_vastleggen(text, text, text, text, text, text, text, date, text) from public, anon, authenticated;
grant execute on function public.bg_linkedin_bewijs_vastleggen(text, text, text, text, text, text, text, date, text) to service_role;

-- Meting per kanaal: laatste snapshot per post uit de eigen kanaal-posts (alleen lezen).
create or replace function public.bg_social_lus_meting(p_channel text, p_vanaf timestamptz, p_tot timestamptz default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  with posts as (
    select p.post_id, p.published_at from public.social_posts p
    where p.tenant_id = 'bedrijfsgeheugen' and p.channel_kind = p_channel
      and p.published_at >= p_vanaf and (p_tot is null or p.published_at < p_tot)
  ), laatste as (
    select distinct on (s.post_id) s.post_id, s.observed_at, s.metrics from public.social_metric_snapshots s
    join posts using (post_id) where s.tenant_id = 'bedrijfsgeheugen'
    order by s.post_id, s.observed_at desc
  ), m as (
    select l.post_id,
      nullif(l.metrics->>'impressions', '')::numeric as imp,
      coalesce(nullif(l.metrics->>'likes', '')::numeric, 0) + coalesce(nullif(l.metrics->>'comments', '')::numeric, 0) as reacties
    from laatste l
  )
  select jsonb_build_object(
    'posts', (select count(*) from posts),
    'gemeten', (select count(*) from m where imp is not null or reacties > 0),
    'mediaan_impressies', (select percentile_cont(0.5) within group (order by imp) from m where imp is not null),
    'mediaan_reacties', (select percentile_cont(0.5) within group (order by reacties) from m),
    'post_ids', coalesce((select jsonb_agg(post_id order by post_id) from posts), '[]'::jsonb));
$$;
revoke all on function public.bg_social_lus_meting(text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.bg_social_lus_meting(text, timestamptz, timestamptz) to service_role;

-- Beoordeel verlopen experimenten en schrijf de uitkomst terug (register + leerregel + beslissing + toepassing).
create or replace function public.bg_social_lus_beoordelen(p_run_date date default current_date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.social_experiments; v_kanaal text; v_dim text; v_waarde text; v_meet jsonb; v_basis numeric; v_nu numeric;
  v_n int; v_min int; v_verl int; v_uplift numeric; v_besluit text; v_status text; v_lstatus text; v_lid text; v_did text;
  v_pid text; v_uit jsonb := '[]'::jsonb; v_metriek text;
begin
  for e in
    select * from public.social_experiments
    where tenant_id = 'bedrijfsgeheugen' and status = 'ACTIVE' and recipe->>'soort' = 'linkedin_lus' and beslisdatum <= p_run_date
    order by beslisdatum, experiment_id limit 5
  loop
    v_kanaal := e.recipe->>'kanaal'; v_dim := e.recipe->>'dimensie'; v_waarde := e.recipe->>'waarde';
    v_min := coalesce(e.min_steekproef, 2); v_verl := coalesce((e.recipe->>'verlengingen')::int, 0);
    -- Metingen jonger dan 24 uur tellen nog niet mee: alleen posts die vóór beslisdatum-1 zijn gepubliceerd.
    v_meet := public.bg_social_lus_meting(v_kanaal, e.started_at, (p_run_date - 1)::timestamptz);
    v_n := coalesce((v_meet->>'gemeten')::int, 0);
    v_metriek := case when e.basislijn->>'mediaan_impressies' is not null and v_meet->>'mediaan_impressies' is not null then 'impressies' else 'reacties' end;
    v_basis := coalesce((e.basislijn->>(case when v_metriek = 'impressies' then 'mediaan_impressies' else 'mediaan_reacties' end))::numeric, 0);
    v_nu := coalesce((v_meet->>(case when v_metriek = 'impressies' then 'mediaan_impressies' else 'mediaan_reacties' end))::numeric, 0);
    v_uplift := round((v_nu - v_basis) / greatest(v_basis, 1), 4);

    if v_n < v_min and v_verl < 1 then
      update public.social_experiments set beslisdatum = beslisdatum + coalesce(looptijd_dagen, 3),
        recipe = jsonb_set(recipe, '{verlengingen}', '1'::jsonb), updated_at = now()
      where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
      v_uit := v_uit || jsonb_build_object('experiment_id', e.experiment_id, 'uitkomst', 'VERLENGD', 'gemeten', v_n);
      continue;
    end if;

    if v_n < v_min then v_status := 'INSUFFICIENT_EVIDENCE'; v_besluit := 'onvoldoende_bewijs'; v_lstatus := 'TESTING';
    elsif v_uplift >= 0.25 then v_status := 'COMPLETE'; v_besluit := 'behouden'; v_lstatus := 'PROMOTED';
    elsif v_uplift <= -0.25 then v_status := 'ROLLED_BACK'; v_besluit := 'verwerpen'; v_lstatus := 'REJECTED';
    else v_status := 'COMPLETE'; v_besluit := 'neutraal'; v_lstatus := 'TESTING';
    end if;

    v_lid := 'li-lus:' || v_kanaal || ':' || v_dim || ':' || v_waarde;
    v_did := 'li-lus-besluit:' || e.experiment_id;
    v_pid := coalesce(v_meet->'post_ids'->>0, e.experiment_id);

    update public.social_experiments set status = v_status, besluit = v_besluit, besloten_op = now(), ended_at = now(), learning_id = v_lid,
      resultaat = jsonb_build_object('metriek', v_metriek, 'basislijn', v_basis, 'tijdens', v_nu, 'uplift_relatief', v_uplift, 'gemeten_posts', v_n,
        'soort_bewijs', 'VOOR_NA_VERGELIJKING_ZONDER_CONTROLEGROEP', 'besloten_door', 'agent:bg-linkedin-lus'),
      updated_at = now()
    where tenant_id = e.tenant_id and experiment_id = e.experiment_id;

    insert into public.revenue_learnings (tenant_id, learning_id, fingerprint, component_scope, claim, effect_metric, effect_size, sample_size, confidence, status,
      baseline_definition, evidence_window, first_seen_at, last_validated_at, expires_or_review_at, evidence_refs)
    values ('bedrijfsgeheugen', v_lid, 'li-lus|' || v_kanaal || '|' || v_dim || '|' || v_waarde, 'linkedin:' || v_kanaal,
      case v_lstatus when 'PROMOTED' then 'Voorlopig bevestigd: ' when 'REJECTED' then 'Niet bevestigd: ' else 'Nog niet bewezen: ' end || e.hypothesis,
      'mediaan_' || v_metriek, v_uplift, v_n, null, v_lstatus,
      'mediaan van eigen kanaal-posts in de 28 dagen vóór de start', to_char(e.started_at, 'YYYY-MM-DD') || ' t/m ' || to_char(p_run_date, 'YYYY-MM-DD'),
      e.started_at, now(), now() + interval '90 days',
      jsonb_build_array(jsonb_build_object('experiment', e.experiment_id, 'vergelijking', 'voor-na, geen controlegroep, kleine steekproef', 'besloten_door', 'agent:bg-linkedin-lus')))
    on conflict (tenant_id, learning_id) do update set status = excluded.status, claim = excluded.claim, effect_size = excluded.effect_size,
      sample_size = excluded.sample_size, last_validated_at = now(), evidence_refs = excluded.evidence_refs, updated_at = now();

    insert into public.social_learning_decisions (tenant_id, decision_id, post_id, decision, recorded_at)
    values ('bedrijfsgeheugen', v_did, v_pid,
      jsonb_build_object('experiment_id', e.experiment_id, 'kanaal', v_kanaal, 'dimensie', v_dim, 'waarde', v_waarde, 'besluit', v_besluit,
        'uplift_relatief', v_uplift, 'gemeten_posts', v_n, 'leerregel', v_lid), now())
    on conflict (tenant_id, decision_id) do nothing;

    insert into public.social_learning_applications (tenant_id, application_id, post_id, learning_id, decision_id, applied_at, application_role, expected_effect, actual_effect, verification_status, updated_at)
    select 'bedrijfsgeheugen', e.experiment_id || ':' || pid, pid, v_lid, v_did, e.started_at, 'experiment_variant', 0.25, v_uplift,
      case when v_n < v_min then 'INSUFFICIENT_SAMPLE' else 'MEASURED_SMALL_SAMPLE' end, now()
    from jsonb_array_elements_text(v_meet->'post_ids') as t(pid)
    on conflict (tenant_id, application_id) do nothing;

    v_uit := v_uit || jsonb_build_object('experiment_id', e.experiment_id, 'uitkomst', v_besluit, 'uplift_relatief', v_uplift, 'gemeten', v_n);
  end loop;
  return jsonb_build_object('beoordeeld', jsonb_array_length(v_uit), 'details', v_uit);
end $$;
revoke all on function public.bg_social_lus_beoordelen(date) from public, anon, authenticated;
grant execute on function public.bg_social_lus_beoordelen(date) to service_role;

-- Eén cyclus per kanaal en dag: eerst beoordelen wat verlopen is, dan het volgende experiment kiezen en vastleggen (idempotent).
create or replace function public.bg_social_lus_cyclus(p_channel text, p_run_date date default current_date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_beoordeeld jsonb; v_actief public.social_experiments; v_basis jsonb; v_hist jsonb;
  v_dims text[]; v_dim text; v_waarde text; v_waarden text[]; v_kort text; v_eid text; v_state text;
  v_med_imp numeric; v_med_re numeric; v_gemeten int; v_onder boolean; v_bewijs jsonb; v_guard text; v_hyp text; v_instr text;
begin
  if p_channel not in ('linkedin_company', 'linkedin_personal') then
    return jsonb_build_object('state', 'NOT_APPLICABLE');
  end if;
  v_kort := case p_channel when 'linkedin_company' then 'co' else 'pe' end;
  v_beoordeeld := public.bg_social_lus_beoordelen(p_run_date);

  -- Eén primaire variabele tegelijk: loopt er al een experiment voor dit kanaal, dan krijgt de generator dat opnieuw.
  select * into v_actief from public.social_experiments
    where tenant_id = 'bedrijfsgeheugen' and status = 'ACTIVE' and recipe->>'soort' = 'linkedin_lus' and recipe->>'kanaal' = p_channel
    order by started_at desc limit 1;

  v_basis := public.bg_social_lus_meting(p_channel, now() - interval '28 days');
  v_gemeten := coalesce((v_basis->>'gemeten')::int, 0);
  v_med_imp := (v_basis->>'mediaan_impressies')::numeric; v_med_re := (v_basis->>'mediaan_reacties')::numeric;
  v_onder := v_gemeten < 3 or coalesce(v_med_imp, 0) < 50;
  v_state := case when v_gemeten = 0 then 'GEEN_METING' when v_onder then 'ONDERPRESTEREND' else 'OP_PEIL' end;

  -- Wat is er recent gevarieerd? Eigen geschiedenis: laatste 10 posts van dit kanaal met hun kenmerken.
  select coalesce(jsonb_object_agg(d, vals), '{}'::jsonb) into v_hist from (
    select d, coalesce(jsonb_agg(distinct v) filter (where v is not null), '[]'::jsonb) vals from (
      select x.d, x.v from (
        select p.post_id, k.format as f, k.hook_type as h, k.cta_type as c
        from public.social_posts p
        left join public.bg_post_kenmerken k on k.post_key in (p.post_id, p.external_post_id)
        where p.tenant_id = 'bedrijfsgeheugen' and p.channel_kind = p_channel
        order by p.published_at desc limit 10) r
      cross join lateral (values ('format', r.f), ('hook_type', r.h), ('cta_type', r.c)) as x(d, v)) y
    group by d) z;

  if v_actief.experiment_id is not null then
    return jsonb_build_object('state', 'EXPERIMENT_LOOPT', 'meting_state', v_state, 'experiment_id', v_actief.experiment_id,
      'dimensie', v_actief.recipe->>'dimensie', 'waarde', v_actief.recipe->>'waarde', 'beoordeeld', v_beoordeeld,
      'instructie', v_actief.recipe->>'instructie');
  end if;

  v_dims := case p_channel when 'linkedin_company' then array['format', 'cta_type', 'hook_type'] else array['hook_type', 'lengte', 'slotvraag'] end;

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
      else array['specifieke_vraag', 'keuzevraag'] end) as c(waarde)
    where not (coalesce(v_hist->d.dim, '[]'::jsonb) ? c.waarde)
      and not exists (select 1 from public.revenue_learnings l where l.tenant_id = 'bedrijfsgeheugen' and l.status = 'REJECTED'
        and l.fingerprint = 'li-lus|' || p_channel || '|' || d.dim || '|' || c.waarde and l.last_validated_at > now() - interval '90 days')
  ) s
  order by s.variatie asc, s.bevestigd desc, s.bewijs desc, md5(s.dim || s.waarde || p_run_date::text)
  limit 1;

  if v_dim is null then
    return jsonb_build_object('state', 'GEEN_NIEUWE_VARIANT', 'meting_state', v_state, 'beoordeeld', v_beoordeeld);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('bewijs_id', b.bewijs_id, 'richting', b.richting, 'claim', b.claim, 'bron_url', b.bron_url, 'bron_datum', b.bron_datum)), '[]'::jsonb)
    into v_bewijs from public.bg_linkedin_bewijs b where b.kanaal in (p_channel, 'beide') and (b.dimensie = v_dim and b.waarde = v_waarde or b.richting = 'tegen');

  v_guard := case p_channel
    when 'linkedin_personal' then 'Behoud de persoonlijke regels: ik-vorm, geen sales-CTA, geen link, geen emoji, geen verzonnen ervaring, 130-200 woorden (tenzij de variabele lengte is), eindig met één oprechte open vraag.'
    else 'Behoud de bedrijfsregels: geen externe link in de posttekst, geen engagement bait (geen like/comment/tag-verzoek), geen verzonnen cijfers of klantresultaten.' end;
  v_hyp := 'Op ' || p_channel || ' levert ' || v_dim || '=' || v_waarde || ' een hogere mediaan ' || case when v_med_imp is not null then 'impressies' else 'reacties' end || ' op dan de eigen baseline van de laatste 28 dagen.';
  v_instr := 'LINKEDIN-LUS (data-gedreven, één variabele): pas in deze post uitsluitend ' || v_dim || ' = ' || v_waarde
    || ' toe en houd alles anders gelijk aan de normale regels. Reden: ' || case v_state when 'GEEN_METING' then 'er is nog geen bruikbare meting; we testen om te leren.' when 'ONDERPRESTEREND' then 'de laatste posts presteren onder de drempel (mediaan impressies ' || coalesce(round(v_med_imp)::text, 'onbekend') || ', gemeten posts ' || v_gemeten || ').' else 'variatie voor leerwinst.' end
    || ' ' || v_guard || ' Presenteer dit nooit als bewezen winnaar en noem het experiment niet in de publieke tekst.';
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
    'baseline', v_basis - 'post_ids', 'bewijs', v_bewijs, 'beoordeeld', v_beoordeeld, 'instructie', v_instr);
end $$;
revoke all on function public.bg_social_lus_cyclus(text, date) from public, anon, authenticated;
grant execute on function public.bg_social_lus_cyclus(text, date) to service_role;
comment on function public.bg_social_lus_cyclus(text, date) is 'LinkedIn-lus: beoordeelt verlopen experimenten, kiest data-gedreven één variabele voor de volgende post en logt dit in social_experiments. Alleen service_role.';
