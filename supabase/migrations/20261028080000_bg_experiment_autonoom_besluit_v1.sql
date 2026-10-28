-- CRO-experimenten autonoom afronden (28 okt 2026).
-- Nieuwe, aparte poort naast bg_experiment_actie (die blijft mens-token-gebonden en ongewijzigd).
-- Beleid: .agents/skills/powerhouse-seo-conversion-orders/SKILL.md (CRO experiment-register closure).
-- Alleen ACTIVE experimenten met een advies van intern.bg_experimenten_beoordelen; starten en weigeren blijft mens.
create or replace function public.bg_experiment_autonoom_besluit(p_experiment_id text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.social_experiments; v_res jsonb; v_uplift numeric; v_p numeric; v_n int;
  v_verl int; v_besluit text; v_status text; v_guard boolean; v_ctrl boolean;
  v_klaar int := 0; v_wacht int := 0; v_uit jsonb := '[]'::jsonb;
begin
  for e in
    select * from public.social_experiments
    where tenant_id = 'bedrijfsgeheugen' and status = 'ACTIVE' and advies is not null and meetpunt is not null
      and (p_experiment_id is null or experiment_id = p_experiment_id)
    order by beslisdatum nulls last, experiment_id
    limit 3
  loop
    v_res := coalesce(e.resultaat, '{}'::jsonb);
    v_uplift := (v_res->>'uplift_relatief')::numeric; v_p := (v_res->>'p_waarde')::numeric; v_n := (v_res->'tijdens'->>'sessies')::int;
    v_verl := coalesce((e.recipe->>'verlengingen')::int, 0);
    v_guard := coalesce((v_res->'guardrails'->>'regressie')::boolean, false);
    v_ctrl := coalesce((v_res->'controlegroep'->>'consistent')::boolean, false);

    if v_guard then v_besluit := 'verwerpen';
    elsif e.advies = 'verlengen' and v_verl < 2 then v_besluit := 'verlengen';
    elsif e.advies = 'verlengen' then v_besluit := 'verwerpen';
    elsif e.advies = 'verwerpen' then v_besluit := 'verwerpen';
    elsif e.advies = 'behouden' and v_ctrl then v_besluit := 'behouden';
    else v_besluit := null; -- behouden zonder consistente controlegroep: geen causaal bewijs, mens beslist
    end if;

    if v_besluit is null then
      v_wacht := v_wacht + 1;
      v_uit := v_uit || jsonb_build_object('experiment_id', e.experiment_id, 'uitkomst', 'WACHT_OP_CONTROLEGROEP');
      continue;
    end if;

    if v_besluit = 'verlengen' then
      update public.social_experiments set beslisdatum = greatest(coalesce(beslisdatum, current_date), current_date) + coalesce(looptijd_dagen, 21),
        advies = null, recipe = jsonb_set(coalesce(recipe, '{}'::jsonb), '{verlengingen}', to_jsonb(v_verl + 1)), updated_at = now()
      where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
    else
      v_status := case when v_besluit = 'behouden' then 'COMPLETE' when coalesce(v_n, 0) < coalesce(e.min_steekproef, 50) then 'INSUFFICIENT_EVIDENCE' else 'ROLLED_BACK' end;
      update public.social_experiments set status = v_status, besluit = v_besluit, besloten_op = now(), ended_at = now(), learning_id = 'experiment:' || e.experiment_id,
        resultaat = v_res || jsonb_build_object('besloten_door', 'agent:bg-experimentcyclus'), updated_at = now()
      where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
      insert into public.revenue_learnings (tenant_id, learning_id, fingerprint, component_scope, claim, effect_metric, effect_size, sample_size, confidence, status, baseline_definition, evidence_window, first_seen_at, last_validated_at, expires_or_review_at, evidence_refs)
      values ('bedrijfsgeheugen', 'experiment:' || e.experiment_id, 'experiment|' || e.experiment_id, coalesce(e.onderdeel, 'site') || ':' || coalesce(e.pagina, '*'),
        case when v_besluit = 'behouden' then 'Bevestigd: ' else 'Niet bevestigd: ' end || e.hypothesis,
        e.meetpunt, v_uplift, v_n, case when v_p is not null then round(1 - v_p, 4) end,
        case when v_besluit = 'behouden' then 'PROMOTED' else 'REJECTED' end,
        'zelfde pagina, ' || coalesce(e.looptijd_dagen, 21) || ' dagen vóór de start', to_char(e.started_at, 'YYYY-MM-DD') || ' t/m ' || to_char(now(), 'YYYY-MM-DD'),
        e.started_at, now(), now() + interval '180 days', jsonb_build_array(jsonb_build_object('experiment', e.experiment_id, 'resultaat', v_res, 'besloten_door', 'agent:bg-experimentcyclus')))
      on conflict (tenant_id, learning_id) do update set status = excluded.status, claim = excluded.claim, effect_size = excluded.effect_size, sample_size = excluded.sample_size,
        confidence = excluded.confidence, last_validated_at = now(), evidence_refs = excluded.evidence_refs, updated_at = now();
    end if;
    v_klaar := v_klaar + 1;
    v_uit := v_uit || jsonb_build_object('experiment_id', e.experiment_id, 'uitkomst', v_besluit);
  end loop;
  return jsonb_build_object('besloten', v_klaar, 'wacht_op_mens', v_wacht, 'details', v_uit);
end $$;
revoke all on function public.bg_experiment_autonoom_besluit(text) from public, anon, authenticated;
grant execute on function public.bg_experiment_autonoom_besluit(text) to service_role;
comment on function public.bg_experiment_autonoom_besluit(text) is 'Agent-poort: sluit ACTIVE experimenten met advies af (verlengen max 2x, verwerpen, behouden alleen met consistente controlegroep). Max 3 per aanroep. Starten en weigeren blijft in de mens-token-functie.';
