-- Canonicalize live persuasion optimizer used by the Human Commercial Message OS.
-- Runtime authority: one evidence-bounded persuasion decision per company/play/channel/stage.

create or replace function public.powerhouse_persuasion_revenue_optimizer_v1(
  p_company_key text,
  p_play_key text,
  p_channel text,
  p_funnel_stage text default 'consideration'::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  g public.powerhouse_growth_swarm_accounts_v1%rowtype;
  v_principles text[]:=array['evidence_specificity','reciprocity_value_first','contrast_choice'];
  v_micro_cta text:='Mag ik twee concrete observaties sturen?';
  v_strategy text:='Lead with one verifiable observation, explain why it matters, give a useful next step before asking for commitment.';
  v_do_not_use text[]:=array['fake scarcity','fabricated social proof','unsupported fear','sensitive-trait targeting','hidden commitment','generic pressure'];
  v_social_ok boolean:=false;
  v_conf numeric:=.55;
begin
  select * into g
  from public.powerhouse_growth_swarm_accounts_v1
  where company_key=p_company_key;

  if found then
    v_conf:=least(1::numeric,.45+.25*coalesce(g.trigger_score,0)+.15*coalesce(g.relationship_score,0)+.15*coalesce(g.dark_funnel_score,0));

    if coalesce(g.trigger_score,0)>=.60 then
      v_principles:=array_append(v_principles,'timing_relevance');
      v_strategy:='Open with the fresh verified trigger, connect it to one business consequence, then offer a concrete useful observation.';
    end if;

    if coalesce(g.knowledge_risk_score,0)>=.45 or coalesce(g.friction_score,0)>=.45 then
      v_principles:=array_append(v_principles,'loss_context');
    end if;

    if coalesce(g.expected_value_eur,0)>0 or coalesce(g.expected_revenue_eur,0)>0 then
      v_principles:=array_append(v_principles,'risk_reduction');
      v_strategy:=v_strategy||' Frame value as an explicit hypothesis and reduce risk with a bounded next step.';
    end if;

    if coalesce(g.dark_funnel_score,0)>=.45 or coalesce(g.relationship_score,0)>=.60 then
      v_principles:=array_append(v_principles,'commitment_micro_step');
      v_micro_cta:=case
        when p_channel like 'linkedin%' then 'Zal ik de twee observaties hier kort delen?'
        when p_channel='email' then 'Zal ik de twee observaties terugmailen, of is 15 minuten handiger?'
        else 'Bekijk eerst de benchmark of scan; daarna beslis je zelf of een gesprek zin heeft.'
      end;
    end if;

    if coalesce(g.swarm_score,0)<.40 then
      v_principles:=array_append(v_principles,'autonomy_reverse_sell');
      v_strategy:='Lead with useful evidence and explicitly allow a wait/self-fix/no-buy outcome.';
      v_micro_cta:='Wil je dat ik alleen de observaties stuur, zonder vervolgafspraak?';
    end if;

    select exists(
      select 1
      from public.powerhouse_friction_index_v1 f
      where f.sample_size>=5
      limit 1
    ) into v_social_ok;

    if v_social_ok then
      v_principles:=array_append(v_principles,'social_proof_verified');
    end if;
  else
    v_principles:=array_append(v_principles,'autonomy_reverse_sell');
    v_strategy:='No account evidence is available: use general educational value only and do not imply company-specific intent.';
    v_conf:=.30;
  end if;

  if p_play_key in ('reverse-selling','anti-consultancy-challenge') then
    v_principles:=array_append(v_principles,'autonomy_reverse_sell');
  end if;
  if p_play_key='risk-reversal' then
    v_principles:=array_append(v_principles,'risk_reduction');
  end if;
  if p_play_key in ('ma-knowledge-risk','lost-knowledge-calculator','mkb-friction-index','competitor-benchmark') then
    v_principles:=array_append(v_principles,'authority_verified');
  end if;

  return jsonb_build_object(
    'contract','powerhouse-persuasion-revenue-optimizer-v1',
    'company_key',p_company_key,
    'play_key',p_play_key,
    'funnel_stage',p_funnel_stage,
    'channel',p_channel,
    'principles',(select jsonb_agg(distinct x) from unnest(v_principles) x),
    'primary_message_strategy',v_strategy,
    'micro_cta',v_micro_cta,
    'do_not_use',to_jsonb(v_do_not_use),
    'confidence',round(v_conf,3),
    'personalization_boundary','Use company/relationship/business evidence only. No sensitive-trait or psychological personality profiling.',
    'truth_boundary','Scarcity, social proof, authority, loss and value claims require explicit evidence.'
  );
end;
$function$;

revoke execute on function public.powerhouse_persuasion_revenue_optimizer_v1(text,text,text,text) from public, anon, authenticated;
grant execute on function public.powerhouse_persuasion_revenue_optimizer_v1(text,text,text,text) to service_role;
