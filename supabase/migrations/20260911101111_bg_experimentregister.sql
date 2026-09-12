alter table public.social_experiments
  add column if not exists onderdeel text,
  add column if not exists pagina text,
  add column if not exists controle text,
  add column if not exists variant text,
  add column if not exists meetpunt text,
  add column if not exists min_steekproef integer default 50,
  add column if not exists looptijd_dagen integer default 21,
  add column if not exists beslisdatum date,
  add column if not exists basislijn jsonb,
  add column if not exists resultaat jsonb,
  add column if not exists advies text,
  add column if not exists besluit text,
  add column if not exists besloten_op timestamptz,
  add column if not exists learning_id text,
  add column if not exists voorgesteld_door text,
  add column if not exists onderbouwing text;
comment on table public.social_experiments is 'Experimentregister van het brein (lean-cyclus, 11 sept 2026): voorgesteld → lopend → te_beslissen → beslist/afgewezen. Meetpunt: klik:<tekst>, klik_doel:<prefix>, scroll:<pct>, formulier, lead, gesprek, offerte. Vergelijking: dezelfde pagina vóór vs tijdens; besluit schrijft een revenue_learning. Weekcyclus: bg-experimentcyclus (maandag).';

-- Meet één meetpunt voor een pagina in een tijdvak: sessies en conversies (alleen mensen)
create or replace function intern.bg_experiment_meet(p_pagina text, p_meetpunt text, p_van timestamptz, p_tot timestamptz)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_soort text := split_part(coalesce(p_meetpunt, ''), ':', 1); v_arg text := substr(coalesce(p_meetpunt, ''), length(split_part(coalesce(p_meetpunt, ''), ':', 1)) + 2);
  v_sessies int; v_conv int;
begin
  with s as (select distinct sessie from public.bg_interacties where not is_robot and sessie is not null and gebeurtenis = 'pagina'
             and (p_pagina is null or pad = p_pagina) and coalesce(gebeurd_op, ontvangen_op) >= p_van and coalesce(gebeurd_op, ontvangen_op) < p_tot)
  select count(*),
    count(*) filter (where case
      when v_soort = 'klik' then exists (select 1 from public.bg_interacties i where i.sessie = s.sessie and i.gebeurtenis = 'klik' and (p_pagina is null or i.pad = p_pagina) and i.element_tekst ilike '%' || v_arg || '%')
      when v_soort = 'klik_doel' then exists (select 1 from public.bg_interacties i where i.sessie = s.sessie and i.gebeurtenis = 'klik' and i.element_doel like v_arg || '%')
      when v_soort = 'scroll' then exists (select 1 from public.bg_interacties i where i.sessie = s.sessie and i.gebeurtenis = 'scroll' and (p_pagina is null or i.pad = p_pagina) and i.diepte_pct >= coalesce(nullif(v_arg, '')::int, 75))
      when v_soort = 'formulier' then exists (select 1 from public.bg_interacties i where i.sessie = s.sessie and i.gebeurtenis = 'formulier_verzonden')
      when v_soort in ('lead', 'gesprek', 'offerte', 'order') then exists (select 1 from public.growth_outcomes o where o.attribution_root_key = s.sessie
             and o.stage = any (case v_soort when 'lead' then array['lead','qualified_lead','appointment','proposal','won_order'] when 'gesprek' then array['appointment','proposal','won_order'] when 'offerte' then array['proposal','won_order'] else array['won_order'] end))
      else false end)
  into v_sessies, v_conv from s;
  return jsonb_build_object('sessies', v_sessies, 'conversies', v_conv, 'ratio', case when v_sessies > 0 then round(v_conv::numeric / v_sessies, 4) end, 'van', p_van, 'tot', p_tot);
end $$;
revoke all on function intern.bg_experiment_meet(text,text,timestamptz,timestamptz) from public, anon, authenticated;

-- Beoordeel lopende experimenten: advies behouden / verwerpen / verlengen (twee-proportietoets, tweezijdig)
create or replace function intern.bg_experimenten_beoordelen()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e record; b jsonb; t jsonb; p1 numeric; p2 numeric; n1 int; n2 int; pp numeric; z numeric; pwaarde numeric; uplift numeric; advies text; n int := 0;
begin
  for e in select * from public.social_experiments where status = 'lopend' loop
    b := coalesce(e.basislijn, intern.bg_experiment_meet(e.pagina, e.meetpunt, e.started_at - make_interval(days => coalesce(e.looptijd_dagen, 21)), e.started_at));
    t := intern.bg_experiment_meet(e.pagina, e.meetpunt, e.started_at, now());
    n1 := (b->>'sessies')::int; n2 := (t->>'sessies')::int;
    p1 := case when n1 > 0 then (b->>'conversies')::numeric / n1 end; p2 := case when n2 > 0 then (t->>'conversies')::numeric / n2 end;
    if n1 > 0 and n2 > 0 then
      pp := ((b->>'conversies')::numeric + (t->>'conversies')::numeric) / (n1 + n2);
      z := case when pp > 0 and pp < 1 then (p2 - p1) / sqrt(pp * (1 - pp) * (1.0 / n1 + 1.0 / n2)) end;
      pwaarde := case when z is not null then round((2 * (1 - (0.5 * (1 + (1 - exp(-0.7988 * abs(z) * (1 + 0.04417 * z * z))) / (1 + exp(-0.7988 * abs(z) * (1 + 0.04417 * z * z)))))))::numeric, 4) end;
      uplift := case when p1 > 0 then round((p2 - p1) / p1, 4) end;
    end if;
    advies := case
      when n2 < coalesce(e.min_steekproef, 50) and current_date < coalesce(e.beslisdatum, current_date) then null
      when n2 < coalesce(e.min_steekproef, 50) then 'verlengen'
      when pwaarde is not null and pwaarde < 0.10 and p2 > p1 then 'behouden'
      when pwaarde is not null and pwaarde < 0.10 and p2 < p1 then 'verwerpen'
      when current_date >= coalesce(e.beslisdatum, current_date) then 'verwerpen'
      else null end;
    update public.social_experiments set basislijn = b,
      resultaat = jsonb_build_object('basislijn', b, 'tijdens', t, 'uplift_relatief', uplift, 'p_waarde', pwaarde, 'beoordeeld_op', now()),
      advies = advies, status = case when advies is not null then 'te_beslissen' else status end, updated_at = now()
    where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
    n := n + 1;
  end loop;
  return jsonb_build_object('beoordeeld', n);
end $$;
revoke all on function intern.bg_experimenten_beoordelen() from public, anon, authenticated;
