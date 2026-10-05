create or replace function intern.bg_salescyclus_cijfers(p_dagen integer default 30)
returns jsonb language sql stable security definer set search_path = '' as $$
  with m as (select * from public.bg_interacties where not is_robot and sessie is not null and coalesce(gebeurd_op, ontvangen_op) >= now() - make_interval(days => greatest(1, least(coalesce(p_dagen, 30), 365)))),
  sess as (
    select sessie,
      (array_agg(pad order by coalesce(gebeurd_op, ontvangen_op)) filter (where gebeurtenis = 'pagina'))[1] as landing,
      coalesce(max(herkomst), max(nullif(bron_domein, '')), '(direct)') as herkomst,
      bool_or(gebeurtenis = 'klik' and (element_doel like 'extern:calendly.com%' or element_doel like 'extern:%calendly%' or element_doel in ('mailto', 'tel') or element_doel in ('/offerte', '/frisse-blik', '/zelfscan', '/aanmelden', '/start', '/contact', '/ai-scan'))) as intentie
    from m group by sessie),
  uit as (select attribution_root_key sessie, stage, revenue_eur from public.growth_outcomes),
  per_sessie as (
    select s.*,
      exists (select 1 from uit u where u.sessie = s.sessie and u.stage in ('lead','qualified_lead','appointment','proposal','won_order')) as lead,
      exists (select 1 from uit u where u.sessie = s.sessie and u.stage in ('appointment','proposal','won_order')) as gesprek,
      exists (select 1 from uit u where u.sessie = s.sessie and u.stage in ('proposal','won_order')) as offerte,
      exists (select 1 from uit u where u.sessie = s.sessie and u.stage = 'won_order') as order_,
      coalesce((select sum(revenue_eur) from uit u where u.sessie = s.sessie and u.stage in ('won_order','revenue')), 0) as omzet
    from sess s),
  agg as (
    select 'herkomst' as dimensie, herkomst as waarde, count(*) bezoekers, count(*) filter (where intentie) intentie, count(*) filter (where lead) leads, count(*) filter (where gesprek) gesprekken, count(*) filter (where offerte) offertes, count(*) filter (where order_) orders, sum(omzet) omzet from per_sessie group by herkomst
    union all
    select 'landing', coalesce(landing, '(onbekend)'), count(*), count(*) filter (where intentie), count(*) filter (where lead), count(*) filter (where gesprek), count(*) filter (where offerte), count(*) filter (where order_), sum(omzet) from per_sessie group by landing)
  select jsonb_build_object(
    'trechter_totaal', (select jsonb_build_object('bezoekers', count(*), 'intentie', count(*) filter (where intentie), 'leads', count(*) filter (where lead), 'gesprekken', count(*) filter (where gesprek), 'offertes', count(*) filter (where offerte), 'orders', count(*) filter (where order_), 'omzet', sum(omzet)) from per_sessie),
    'trechter', coalesce((select jsonb_agg(to_jsonb(a) order by a.dimensie, a.bezoekers desc) from (select * from agg order by bezoekers desc limit 80) a), '[]'::jsonb),
    'uitkomsten_zonder_sessie', coalesce((select jsonb_agg(jsonb_build_object('bron', source, 'fase', stage, 'aantal', n, 'omzet', omzet)) from (
        select coalesce(o.source, '?') source, o.stage, count(*) n, sum(o.revenue_eur) omzet from public.growth_outcomes o
        where o.occurred_at >= now() - make_interval(days => greatest(1, least(coalesce(p_dagen, 30), 365)))
          and not exists (select 1 from public.bg_interacties i where i.sessie = o.attribution_root_key) group by 1, 2) x), '[]'::jsonb),
    'experimenten', coalesce((select jsonb_agg(jsonb_build_object('id', experiment_id, 'status', status, 'hypothese', hypothesis, 'onderdeel', onderdeel, 'pagina', pagina, 'controle', controle, 'variant', variant,
        'meetpunt', meetpunt, 'min_steekproef', min_steekproef, 'looptijd_dagen', looptijd_dagen, 'beslisdatum', beslisdatum, 'resultaat', resultaat, 'advies', advies, 'besluit', besluit, 'onderbouwing', onderbouwing, 'voorgesteld_door', voorgesteld_door, 'aangemaakt', created_at)
        order by case status when 'ACTIVE' then 0 when 'PLANNED' then 1 else 2 end, created_at desc) from public.social_experiments where tenant_id = 'bedrijfsgeheugen'), '[]'::jsonb),
    'lessen', coalesce((select jsonb_agg(jsonb_build_object('claim', claim, 'status', status, 'effect', effect_size, 'steekproef', sample_size, 'betrouwbaarheid', confidence, 'bijgewerkt', last_validated_at) order by last_validated_at desc nulls last) from (select * from public.revenue_learnings where tenant_id = 'bedrijfsgeheugen' order by last_validated_at desc nulls last limit 20) l), '[]'::jsonb)
  );
$$;
revoke all on function intern.bg_salescyclus_cijfers(integer) from public, anon, authenticated;

create or replace function public.bg_salescyclus(p_token text, p_dagen integer default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not (coalesce(p_token, '') <> '' and encode(extensions.digest(p_token, 'sha256'), 'hex') = 'aa992cf89d9eeea953e0af4c26b563466d625365af9e6f0fc32e227e6268a170') then
    raise exception 'GEEN_TOEGANG' using errcode = '42501'; end if;
  return intern.bg_salescyclus_cijfers(p_dagen);
end $$;
revoke all on function public.bg_salescyclus(text, integer) from public, anon, authenticated;
grant execute on function public.bg_salescyclus(text, integer) to service_role;
