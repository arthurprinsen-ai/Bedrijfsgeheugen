create or replace function public.bg_meetoverzicht(p_token text, p_dagen integer default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_ok boolean;
  v_van timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_dagen, 30), 365)));
  v jsonb;
begin
  select coalesce(p_token, '') <> '' and p_token = s.decrypted_secret into v_ok
  from vault.decrypted_secrets s where s.name = 'bg_uitkomst_terugkoppeling_token';
  if not coalesce(v_ok, false) then raise exception 'GEEN_TOEGANG' using errcode = '42501'; end if;

  with m as (
    select * from public.bg_interacties
    where not is_robot and coalesce(gebeurd_op, ontvangen_op) >= v_van
  ),
  bezoek as (select pad, count(distinct sessie) bezoeken, count(*) weergaven from m where gebeurtenis = 'pagina' group by pad),
  tijd as (select pad, percentile_cont(0.5) within group (order by seconden) mediaan_sec from m where gebeurtenis = 'tijd_op_pagina' and seconden is not null group by pad),
  scr as (select pad, diepte_pct, count(distinct sessie) sessies from m where gebeurtenis = 'scroll' group by pad, diepte_pct),
  kl as (select pad, count(*) kliks from m where gebeurtenis = 'klik' group by pad),
  volgorde as (select sessie, pad, row_number() over (partition by sessie order by coalesce(gebeurd_op, ontvangen_op) desc) rn from m where gebeurtenis = 'pagina' and sessie is not null),
  vertrek as (select pad, count(*) vertrekken from volgorde where rn = 1 group by pad),
  paginas as (
    select b.pad, b.bezoeken, b.weergaven, round(t.mediaan_sec::numeric) mediaan_sec, coalesce(k.kliks, 0) kliks,
      coalesce(v.vertrekken, 0) vertrekken,
      round(100.0 * coalesce(v.vertrekken, 0) / nullif(b.bezoeken, 0)) vertrek_pct,
      (select jsonb_object_agg(d::text, round(100.0 * coalesce((select s.sessies from scr s where s.pad = b.pad and s.diepte_pct = d), 0) / nullif(b.bezoeken, 0)))
         from unnest(array[25, 50, 75, 90, 100]) d) scroll_pct
    from bezoek b left join tijd t using (pad) left join kl k using (pad) left join vertrek v using (pad)
  ),
  knoppen as (
    select m.pad, coalesce(m.element_tekst, '(zonder tekst)') tekst, m.onderdeel, m.element_doel doel, count(*) kliks, count(distinct m.sessie) sessies,
      round(100.0 * count(distinct m.sessie) / nullif(max(b.bezoeken), 0)) pct_bezoekers
    from m left join bezoek b using (pad)
    where m.gebeurtenis = 'klik' group by 1, 2, 3, 4
  ),
  formulieren as (
    select pad, coalesce(element_tekst, 'formulier') formulier,
      count(distinct sessie) filter (where gebeurtenis = 'formulier_start') gestart,
      count(distinct sessie) filter (where gebeurtenis = 'formulier_verzonden') verzonden
    from m where gebeurtenis in ('formulier_start', 'formulier_verzonden') group by 1, 2
  )
  select jsonb_build_object(
    'periode_dagen', greatest(1, least(coalesce(p_dagen, 30), 365)),
    'gegenereerd_op', now(),
    'totaal', jsonb_build_object(
      'bezoekers', (select count(distinct sessie) from m),
      'paginaweergaven', (select count(*) from m where gebeurtenis = 'pagina'),
      'kliks', (select count(*) from m where gebeurtenis = 'klik'),
      'formulieren_gestart', (select count(distinct sessie) from m where gebeurtenis = 'formulier_start'),
      'formulieren_verzonden', (select count(distinct sessie) from m where gebeurtenis = 'formulier_verzonden'),
      'robots_uitgefilterd', (select count(*) from public.bg_interacties where is_robot and coalesce(gebeurd_op, ontvangen_op) >= v_van),
      'apparaten', (select coalesce(jsonb_object_agg(apparaat, n), '{}'::jsonb) from (select apparaat, count(distinct sessie) n from m where apparaat is not null group by 1) a),
      'bronnen', (select coalesce(jsonb_agg(jsonb_build_object('bron', bron, 'bezoekers', n) order by n desc), '[]'::jsonb) from (select coalesce(nullif(bron_domein, ''), '(direct)') bron, count(distinct sessie) n from m group by 1 order by 2 desc limit 10) b),
      'toestemming_pct', (select round(100.0 * count(distinct sessie) filter (where toestemming) / nullif(count(distinct sessie), 0)) from m)
    ),
    'paginas', coalesce((select jsonb_agg(to_jsonb(p) order by p.bezoeken desc) from paginas p), '[]'::jsonb),
    'knoppen', coalesce((select jsonb_agg(to_jsonb(k) order by k.kliks desc) from (select * from knoppen order by kliks desc limit 300) k), '[]'::jsonb),
    'formulieren', coalesce((select jsonb_agg(jsonb_build_object('pad', f.pad, 'formulier', f.formulier, 'gestart', f.gestart, 'verzonden', f.verzonden,
        'gestrand', greatest(f.gestart - f.verzonden, 0), 'gestrand_pct', round(100.0 * greatest(f.gestart - f.verzonden, 0) / nullif(f.gestart, 0))) order by f.gestart desc) from formulieren f), '[]'::jsonb)
  ) into v;
  return v;
end $$;
revoke all on function public.bg_meetoverzicht(text, integer) from public, anon, authenticated;
grant execute on function public.bg_meetoverzicht(text, integer) to service_role;
comment on function public.bg_meetoverzicht(text, integer) is 'Meetoverzicht per pagina (menselijke bezoekers): bezoeken, tijd, scrolldiepte, knoppen, formulieren (gestart/verzonden/gestrand), vertrekpunten. Toegang met dezelfde code als het dagoverzicht. 11 sept 2026.';
