-- Controlegroep voor CRO-experimenten (28 okt 2026): verschil-in-verschil op onveranderde pagina's.
-- Alleen lezen. Hergebruikt intern.bg_experiment_meet (alleen menselijke sessies); geen nieuwe meetlogica.
-- Beleid: .agents/skills/powerhouse-seo-conversion-orders/SKILL.md (CRO experiment-register closure).
create or replace function public.bg_experiment_controlegroep(p_experiment_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  e public.social_experiments; v_pre_van timestamptz; v_pre_tot timestamptz; v_nu timestamptz := now();
  p record; m jsonb;
  n_pre numeric := 0; c_pre numeric := 0; n_dur numeric := 0; c_dur numeric := 0;
  r_pre numeric; r_dur numeric; ctrl_change numeric; treated_change numeric; did numeric;
  v_min int; v_redenen text[] := '{}'; v_consistent boolean := false; v_paginas int := 0;
begin
  select * into e from public.social_experiments where tenant_id = 'bedrijfsgeheugen' and experiment_id = p_experiment_id;
  if not found then raise exception 'ONBEKEND_EXPERIMENT'; end if;
  if e.started_at is null or e.pagina is null or e.meetpunt is null then
    return jsonb_build_object('consistent', false, 'redenen', jsonb_build_array('GEEN_START_PAGINA_OF_MEETPUNT'));
  end if;
  v_pre_tot := e.started_at; v_pre_van := e.started_at - make_interval(days => coalesce(e.looptijd_dagen, 21));
  v_min := coalesce(e.min_steekproef, 50);

  -- Controle: de meest bezochte pagina's zonder lopend experiment en niet de geteste pagina, max 10.
  for p in
    select i.pad from public.bg_interacties i
    where not i.is_robot and i.gebeurtenis = 'pagina' and i.pad is not null and i.pad <> e.pagina
      and coalesce(i.gebeurd_op, i.ontvangen_op) >= v_pre_van and coalesce(i.gebeurd_op, i.ontvangen_op) < v_nu
      and i.pad not in (select x.pagina from public.social_experiments x where x.status = 'ACTIVE' and x.pagina is not null)
    group by i.pad order by count(distinct i.sessie) desc limit 10
  loop
    v_paginas := v_paginas + 1;
    m := intern.bg_experiment_meet(p.pad, e.meetpunt, v_pre_van, v_pre_tot);
    n_pre := n_pre + coalesce((m->>'sessies')::numeric, 0); c_pre := c_pre + coalesce((m->>'conversies')::numeric, 0);
    m := intern.bg_experiment_meet(p.pad, e.meetpunt, e.started_at, v_nu);
    n_dur := n_dur + coalesce((m->>'sessies')::numeric, 0); c_dur := c_dur + coalesce((m->>'conversies')::numeric, 0);
  end loop;

  if v_paginas = 0 then v_redenen := array_append(v_redenen, 'GEEN_CONTROLEPAGINAS'::text); end if;
  if n_pre < v_min or n_dur < v_min then v_redenen := array_append(v_redenen, 'CONTROLE_STEEKPROEF_TE_KLEIN'::text); end if;
  r_pre := case when n_pre > 0 then c_pre / n_pre end; r_dur := case when n_dur > 0 then c_dur / n_dur end;
  ctrl_change := case when r_pre > 0 and r_dur is not null then (r_dur - r_pre) / r_pre end;
  treated_change := (e.resultaat->>'uplift_relatief')::numeric;
  if ctrl_change is null then v_redenen := array_append(v_redenen, 'CONTROLE_ZONDER_BASISCONVERSIE'::text); end if;
  if treated_change is null then v_redenen := array_append(v_redenen, 'GEEN_UPLIFT_GEMETEN'::text); end if;
  did := case when ctrl_change is not null and treated_change is not null then treated_change - ctrl_change end;
  if ctrl_change is not null and abs(ctrl_change) > 0.25 then v_redenen := array_append(v_redenen, 'CONTROLE_ZELF_INSTABIEL'::text); end if;
  if did is not null and did <= 0 then v_redenen := array_append(v_redenen, 'GEEN_POSITIEF_VERSCHIL_T_O_V_CONTROLE'::text); end if;
  v_consistent := coalesce(array_length(v_redenen, 1), 0) = 0;

  return jsonb_build_object('consistent', v_consistent, 'redenen', to_jsonb(v_redenen), 'controle_paginas', v_paginas,
    'controle_voor', jsonb_build_object('sessies', n_pre, 'conversies', c_pre, 'ratio', round(r_pre, 4)),
    'controle_tijdens', jsonb_build_object('sessies', n_dur, 'conversies', c_dur, 'ratio', round(r_dur, 4)),
    'controle_verandering', round(ctrl_change, 4), 'getest_verandering', round(treated_change, 4), 'verschil_in_verschil', round(did, 4),
    'berekend_op', v_nu);
end $$;
revoke all on function public.bg_experiment_controlegroep(text) from public, anon, authenticated;
grant execute on function public.bg_experiment_controlegroep(text) to service_role;
comment on function public.bg_experiment_controlegroep(text) is 'Alleen lezen: verschil-in-verschil op de 10 meest bezochte pagina''s zonder lopend experiment. consistent=true alleen met voldoende steekproef, stabiele controle (±25%) en positief verschil.';
