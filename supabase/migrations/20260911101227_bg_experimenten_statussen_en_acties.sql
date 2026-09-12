do $x$ declare d text; begin
 d := pg_get_functiondef('intern.bg_experimenten_beoordelen()'::regprocedure);
 d := replace(d, $a$where status = 'lopend' loop$a$, $b$where status = 'ACTIVE' loop$b$);
 d := replace(d, $a$advies = advies, status = case when advies is not null then 'te_beslissen' else status end, updated_at = now()$a$, $b$advies = advies, updated_at = now()$b$);
 if position($c$status = 'ACTIVE' loop$c$ in d) = 0 then raise exception 'vervanging mislukt'; end if;
 execute d;
end $x$;
revoke all on function intern.bg_experimenten_beoordelen() from public, anon, authenticated;
comment on table public.social_experiments is 'Experimentregister van het brein (lean-cyclus, 11 sept 2026). PLANNED = voorgesteld, ACTIVE = loopt (advies gevuld = klaar om te beslissen), COMPLETE = behouden, ROLLED_BACK = verworpen of afgewezen, INSUFFICIENT_EVIDENCE = te weinig bezoekers na verlengen. Meetpunt: klik:<tekst>, klik_doel:<prefix>, scroll:<pct>, formulier, lead, gesprek, offerte, order. Vergelijking: dezelfde pagina vóór vs tijdens. Besluit schrijft een revenue_learning.';

create or replace function public.bg_experiment_actie(p_token text, p_experiment_id text, p_actie text, p_besluit text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.social_experiments; v_res jsonb; v_uplift numeric; v_p numeric; v_n int; v_status text;
begin
  if not (coalesce(p_token, '') <> '' and encode(extensions.digest(p_token, 'sha256'), 'hex') = 'aa992cf89d9eeea953e0af4c26b563466d625365af9e6f0fc32e227e6268a170') then
    raise exception 'GEEN_TOEGANG' using errcode = '42501'; end if;
  select * into e from public.social_experiments where tenant_id = 'bedrijfsgeheugen' and experiment_id = p_experiment_id for update;
  if not found then raise exception 'ONBEKEND_EXPERIMENT'; end if;

  if p_actie = 'goedkeuren' and e.status = 'PLANNED' then
    update public.social_experiments set status = 'ACTIVE', started_at = now(), beslisdatum = current_date + coalesce(looptijd_dagen, 21),
      basislijn = intern.bg_experiment_meet(pagina, meetpunt, now() - make_interval(days => coalesce(looptijd_dagen, 21)), now()), updated_at = now()
    where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
  elsif p_actie = 'afwijzen' and e.status = 'PLANNED' then
    update public.social_experiments set status = 'ROLLED_BACK', besluit = 'afgewezen', besloten_op = now(), ended_at = now(), updated_at = now()
    where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
  elsif p_actie = 'besluiten' and e.status = 'ACTIVE' and p_besluit in ('behouden', 'verwerpen', 'verlengen') then
    if p_besluit = 'verlengen' then
      update public.social_experiments set beslisdatum = greatest(coalesce(beslisdatum, current_date), current_date) + coalesce(looptijd_dagen, 21), advies = null, updated_at = now()
      where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
    else
      v_res := coalesce(e.resultaat, '{}'::jsonb);
      v_uplift := (v_res->>'uplift_relatief')::numeric; v_p := (v_res->>'p_waarde')::numeric; v_n := (v_res->'tijdens'->>'sessies')::int;
      v_status := case when p_besluit = 'behouden' then 'COMPLETE' when coalesce(v_n, 0) < coalesce(e.min_steekproef, 50) then 'INSUFFICIENT_EVIDENCE' else 'ROLLED_BACK' end;
      update public.social_experiments set status = v_status, besluit = p_besluit, besloten_op = now(), ended_at = now(), learning_id = 'experiment:' || e.experiment_id, updated_at = now()
      where tenant_id = e.tenant_id and experiment_id = e.experiment_id;
      insert into public.revenue_learnings (tenant_id, learning_id, fingerprint, component_scope, claim, effect_metric, effect_size, sample_size, confidence, status, baseline_definition, evidence_window, first_seen_at, last_validated_at, expires_or_review_at, evidence_refs)
      values ('bedrijfsgeheugen', 'experiment:' || e.experiment_id, 'experiment|' || e.experiment_id, coalesce(e.onderdeel, 'site') || ':' || coalesce(e.pagina, '*'),
        case when p_besluit = 'behouden' then 'Bevestigd: ' else 'Niet bevestigd: ' end || e.hypothesis,
        e.meetpunt, v_uplift, v_n, case when v_p is not null then round(1 - v_p, 4) end,
        case when p_besluit = 'behouden' then 'PROMOTED' else 'REJECTED' end,
        'zelfde pagina, ' || coalesce(e.looptijd_dagen, 21) || ' dagen vóór de start', to_char(e.started_at, 'YYYY-MM-DD') || ' t/m ' || to_char(now(), 'YYYY-MM-DD'),
        e.started_at, now(), now() + interval '180 days', jsonb_build_array(jsonb_build_object('experiment', e.experiment_id, 'resultaat', v_res)))
      on conflict (tenant_id, learning_id) do update set status = excluded.status, claim = excluded.claim, effect_size = excluded.effect_size, sample_size = excluded.sample_size, confidence = excluded.confidence, last_validated_at = now(), evidence_refs = excluded.evidence_refs, updated_at = now();
    end if;
  else
    raise exception 'ACTIE_NIET_TOEGESTAAN: % bij status %', p_actie, e.status;
  end if;
  return (select to_jsonb(x) - 'tenant_id' from public.social_experiments x where tenant_id = e.tenant_id and experiment_id = e.experiment_id);
end $$;
revoke all on function public.bg_experiment_actie(text, text, text, text) from public, anon, authenticated;
grant execute on function public.bg_experiment_actie(text, text, text, text) to service_role;
