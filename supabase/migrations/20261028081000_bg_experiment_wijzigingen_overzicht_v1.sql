-- Leesfunctie voor de beheer-tabel "oude versus nieuwe waarde" (28 okt 2026).
-- Geeft alleen experimenten die een pagina hebben; geen schrijfactie, alleen service_role.
create or replace function public.bg_experiment_wijzigingen_overzicht(p_limiet int default 100)
returns jsonb language sql stable security definer set search_path = '' as $$
  with r as (
    select e.*,
      (e.basislijn->>'sessies')::numeric as n_oud, (e.basislijn->>'conversies')::numeric as c_oud,
      (e.resultaat->'tijdens'->>'sessies')::numeric as n_nieuw, (e.resultaat->'tijdens'->>'conversies')::numeric as c_nieuw
    from public.social_experiments e
    where e.tenant_id = 'bedrijfsgeheugen' and e.pagina is not null and e.status <> 'PLANNED'
    order by coalesce(e.started_at, e.created_at) desc
    limit greatest(1, least(coalesce(p_limiet, 100), 200))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'experiment_id', experiment_id,
    'gebied', onderdeel,
    'pagina', pagina,
    'wijziging', variant,
    'oud_gedrag', controle,
    'meetpunt', meetpunt,
    'toegepast_op', started_at,
    'besloten_op', besloten_op,
    'status', status,
    'besluit', besluit,
    'besloten_door', resultaat->>'besloten_door',
    'oud', case when n_oud > 0 then jsonb_build_object('sessies', n_oud, 'conversies', c_oud, 'ratio', round(c_oud / n_oud, 4)) end,
    'nieuw', case when n_nieuw > 0 then jsonb_build_object('sessies', n_nieuw, 'conversies', c_nieuw, 'ratio', round(c_nieuw / n_nieuw, 4)) end,
    'verschil_relatief', resultaat->'uplift_relatief',
    'p_waarde', resultaat->'p_waarde',
    'min_steekproef', min_steekproef,
    'onderbouwing', onderbouwing
  ) order by coalesce(started_at, created_at) desc), '[]'::jsonb)
  from r;
$$;
revoke all on function public.bg_experiment_wijzigingen_overzicht(int) from public, anon, authenticated;
grant execute on function public.bg_experiment_wijzigingen_overzicht(int) to service_role;
comment on function public.bg_experiment_wijzigingen_overzicht(int) is 'Leesmodel voor de beheer-tabel oud versus nieuw: alleen gestarte experimenten met pagina; geen schrijfactie.';
