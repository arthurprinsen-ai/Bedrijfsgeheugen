-- Powerhouse Growth Swarm: all 20 plays executable v3
-- Reconciles the seven previously ARMED/READY plays onto the existing canonical
-- Persuasion Revenue Optimizer. No parallel optimizer, CRM or scheduler.

-- Clean an accidental non-canonical persuasion side-path if it exists.
drop function if exists public.powerhouse_activate_all_growth_plays_v2(date);
drop function if exists public.powerhouse_persuasion_revenue_optimizer_v1(text,text,text,text);
drop table if exists public.powerhouse_persuasion_decisions_v1;
drop table if exists public.powerhouse_persuasion_principles_v1;

create or replace function public.powerhouse_persuasion_package_for_company_v1(
  p_company_key text
) returns jsonb
language sql
security definer
set search_path=pg_catalog,public
as $$
  select coalesce((
    select jsonb_build_object(
      'contract','powerhouse-persuasion-revenue-optimizer-v1',
      'strategy',p.persuasion_strategy,
      'give_asset',p.give_asset,
      'get_ask',p.get_ask,
      'preferred_channel',p.preferred_channel,
      'truth_boundary','Framing may change; evidence, urgency, scarcity, social proof and financial impact may never be fabricated.'
    )
    from public.powerhouse_persuasion_next_best_action_v1 p
    where p.company_key=p_company_key
    limit 1
  ),jsonb_build_object(
    'contract','powerhouse-persuasion-revenue-optimizer-v1',
    'strategy','reciprocity_value_first',
    'give_asset','three_levers',
    'get_ask','offer_useful_one_pager',
    'preferred_channel','internal',
    'truth_boundary','No company-specific persuasion without company evidence.'
  ));
$$;
revoke execute on function public.powerhouse_persuasion_package_for_company_v1(text) from public,anon,authenticated;
grant execute on function public.powerhouse_persuasion_package_for_company_v1(text) to service_role;

create or replace function public.powerhouse_activate_remaining_growth_plays_v3(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_now timestamptz:=now();
  v_rows int:=0;
  v_content int:=0;
  v_actions int:=0;
begin
  -- 1. MKB Friction Index -> evidence-backed company content when privacy floor passes.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-v3:friction:'||p_run_date::text||':'||md5(f.branche),
    p_run_date,'mkb-friction-index:'||f.branche,'growth:friction:'||md5(f.branche),
    'linkedin_company','mkb_friction_index',98,
    'Maak van de sterkste privacy-safe sectorfrictie een concrete managementobservatie en CTA naar benchmark/Frisse Blik.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v3','play_key','mkb-friction-index',
      'branche',f.branche,'sample_size',f.sample_size,'friction_index',f.friction_index,
      'maturity_score',f.maturity_score,'privacy_floor_passed',true,
      'persuasion',jsonb_build_object('strategy','social_proof_peer','give_asset','peer_benchmark','get_ask','show_relevant_pattern'),
      'truth_boundary','Aggregate benchmark only; never infer an individual company score from the sector benchmark.'
    ),'suggested'
  from public.powerhouse_friction_index_v1 f
  where f.sample_size>=5
  order by f.friction_index desc,f.sample_size desc
  limit 3
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_rows=row_count; v_content:=v_content+v_rows;

  -- 2. Positive public teardown -> constructive, public-evidence-only content.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-v3:teardown:'||p_run_date::text||':'||md5(g.company_key),
    p_run_date,'positive-teardown:'||g.company_key,'growth:teardown:'||md5(g.company_key),
    'linkedin_company','positive_public_teardown',round(80+18*g.swarm_score,2),
    'Maak een positieve publieke teardown: eerst wat aantoonbaar sterk is, daarna één publieke frictie of kans en één generaliseerbare les. Geen private inferentie.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v3','play_key','positive-public-teardown',
      'company_key',g.company_key,'company_name',g.company_name,
      'public_evidence_ref',g.evidence#>>'{trigger,evidence_ref}',
      'persuasion',public.powerhouse_persuasion_package_for_company_v1(g.company_key),
      'guardrails',jsonb_build_object('constructive_only',true,'public_evidence_only',true,'no_humiliation',true,'no_private_inference',true)
    ),'suggested'
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.swarm_score>=.45
    and nullif(g.evidence#>>'{trigger,evidence_ref}','') is not null
  order by g.swarm_score desc
  limit 2
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_rows=row_count; v_content:=v_content+v_rows;

  -- 3. Anti-consultancy challenge -> qualified internal commercial action;
  -- email promotion happens through the shared bounded email budget below.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-v3:anti-consultancy:'||md5(g.company_key)||':'||p_run_date::text,
    'company:'||g.company_key,g.best_person_key,g.company_key,'growth_play_email_candidate','internal',
    round(78+20*g.swarm_score,2),
    'Geef eerst drie bruikbare observaties; verkoop pas als bewijs een betaalde stap rechtvaardigt.',
    g.evidence||jsonb_build_object(
      'contract','powerhouse-growth-plays-v3','play_key','anti-consultancy-challenge',
      'persuasion',public.powerhouse_persuasion_package_for_company_v1(g.company_key),
      'candidate_email_subject',coalesce(g.company_name,'Jullie organisatie')||': eerst drie observaties, daarna pas beslissen',
      'candidate_email_body','Ik stuur je liever eerst drie concrete observaties dan een verkooppraat. Als daar geen serieuze hefboom uit komt, is mijn advies juist om nu niets te kopen. Zal ik die drie observaties sturen?',
      'conversion_contract',jsonb_build_object('value_before_ask',true,'no_buy_outcome_allowed',true,'false_guarantee_forbidden',true)
    ),
    'Geef eerst drie concrete observaties. Geen afspraak-CTA voordat de ontvanger om vervolg vraagt.',
    'suggested',v_now,greatest(g.expected_value_eur,2900),g.best_person_name,g.company_name,g.best_person_role
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.best_person_key is not null
    and g.swarm_score>=.45
    and not exists(
      select 1 from public.powerhouse_sales_actions a
      where a.company_key=g.company_key
        and a.evidence->>'play_key'='anti-consultancy-challenge'
        and a.created_at>=v_now-interval '30 days'
    )
  order by g.swarm_score desc
  limit 5
  on conflict(dedupe_key) do nothing;
  get diagnostics v_rows=row_count; v_actions:=v_actions+v_rows;

  -- 4. Boardroom Blindness -> aggregate CEO/MT content, no account names.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-v3:boardroom:'||p_run_date::text,
    p_run_date,'boardroom-blindness','growth:boardroom:'||p_run_date::text,
    'linkedin_company','boardroom_blindness',97,
    'Publiceer vijf vragen die directie/MT vandaag moet kunnen beantwoorden over kennis, uitvoering, data en frictie.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v3','play_key','boardroom-fear-of-blindness',
      'accounts_considered',count(*),
      'avg_friction',round(avg(friction_score),3),
      'avg_knowledge_risk',round(avg(knowledge_risk_score),3),
      'avg_dark_funnel',round(avg(dark_funnel_score),3),
      'persuasion',jsonb_build_object('strategy','loss_aversion','give_asset','board_one_pager','get_ask','answer_one_question'),
      'prospect_names_forbidden',true,
      'truth_boundary','Use aggregate patterns as questions, not as claims about an unnamed individual company.'
    ),'suggested'
  from public.powerhouse_growth_swarm_accounts_v1
  where swarm_score>=.35
  having count(*)>=5
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_rows=row_count; v_content:=v_content+v_rows;

  -- 5. Competitor/problem switch pages -> feed the existing canonical SEO/content owner,
  -- not a parallel website generator.
  with patterns as (
    select
      evidence#>>'{trigger,trigger_type}' trigger_type,
      count(*)::int account_count,
      round(avg(trigger_score),3) avg_trigger_score
    from public.powerhouse_growth_swarm_accounts_v1
    where nullif(evidence#>>'{trigger,trigger_type}','') is not null
      and trigger_score>=.45
    group by evidence#>>'{trigger,trigger_type}'
    having count(*)>=3
    order by count(*) desc,avg(trigger_score) desc
    limit 5
  )
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-v3:switch:'||p_run_date::text||':'||md5(p.trigger_type),
    p_run_date,p.trigger_type,'seo-switch:'||md5(p.trigger_type),
    'blog','seo_first_mover_intent_gap',92,
    'Bouw via de bestaande SEO-owner eerst een probleem-/switch-intent asset. Vergelijk zelf oplossen, huidige tooling verbeteren, alternatief kiezen en Frisse Blik eerlijk.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v3','play_key','competitor-switch-pages',
      'trigger_type',p.trigger_type,'account_pattern_count',p.account_count,'avg_trigger_score',p.avg_trigger_score,
      'publication_guard','Existing canonical owner/cannibalization check remains mandatory before publication.',
      'cta_target','/frisse-blik',
      'persuasion',jsonb_build_object('strategy','contrast_before_after','give_asset','evidence_teardown','get_ask','offer_useful_one_pager'),
      'guardrails',jsonb_build_object('existing_owner_first',true,'no_fake_comparison',true,'competitor_claims_public_evidence_only',true)
    ),'suggested'
  from patterns p
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_rows=row_count; v_content:=v_content+v_rows;

  -- 6. Data contribution flywheel -> only explicit optional benchmark consent.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at
  )
  select
    'growth-v3:benchmark-contribution:'||s.submission_key,
    'scan:'||s.submission_key,s.company_key,'benchmark_data_contribution_unlock','portal',86,
    'Expliciete benchmarktoestemming maakt een rijkere geanonimiseerde vergelijking mogelijk.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v3','play_key','data-contribution-flywheel',
      'submission_key',s.submission_key,'branche',s.branche,
      'benchmark_consent',true,'aggregate_only',true,'minimum_public_group_size',5,
      'persuasion',jsonb_build_object('strategy','reciprocity_value_first','give_asset','peer_benchmark','get_ask','no_external_ask')
    ),
    'Jouw geanonimiseerde bijdrage helpt de benchmark beter te maken. Een diepere vergelijking wordt pas zichtbaar als de groep groot genoeg is.',
    'suggested',v_now
  from public.scan_inzendingen s
  where s.submission_key is not null
    and lower(coalesce(s.payload->>'benchmark_consent','')) in ('true','1','yes','ja')
  on conflict(dedupe_key) do nothing;
  get diagnostics v_rows=row_count; v_actions:=v_actions+v_rows;

  -- 7. Conditional risk reversal -> evidence-backed candidate, not a blanket guarantee.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-v3:risk-reversal:'||md5(g.company_key)||':'||p_run_date::text,
    'company:'||g.company_key,g.best_person_key,g.company_key,'growth_play_email_candidate','internal',
    round(82+16*g.swarm_score,2),
    'Verlaag beslisrisico met een vooraf expliciete outputconditie, zonder een ongecontroleerde financiële garantie.',
    g.evidence||jsonb_build_object(
      'contract','powerhouse-growth-plays-v3','play_key','risk-reversal',
      'persuasion',public.powerhouse_persuasion_package_for_company_v1(g.company_key),
      'candidate_email_subject',coalesce(g.company_name,'Jullie organisatie')||': maak de scan-uitkomst vooraf toetsbaar',
      'candidate_email_body','Ik wil het aankooprisico klein houden. Daarom maken we vooraf expliciet wat de scan minimaal moet opleveren: drie concrete evidence-backed hefbomen óf de conclusie dat een betaald vervolg niet gerechtvaardigd is. Daarna beslis jij zelf.',
      'risk_reversal_contract',jsonb_build_object(
        'conditional',true,
        'minimum_output','three evidence-backed levers OR explicit no-paid-follow-on conclusion',
        'unconditional_money_back_claim',false,
        'financial_guarantee_requires_separate_contract_review',true
      )
    ),
    'Gebruik alleen de bounded outputconditie. Geen geld-terugclaim zonder afzonderlijke contractuele goedkeuring.',
    'suggested',v_now,greatest(g.expected_value_eur,2900),g.best_person_name,g.company_name,g.best_person_role
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.best_person_key is not null
    and g.swarm_score>=.60
    and greatest(g.expected_value_eur,g.expected_revenue_eur)>=2900
    and not exists(
      select 1 from public.powerhouse_sales_actions a
      where a.company_key=g.company_key
        and a.evidence->>'play_key'='risk-reversal'
        and a.created_at>=v_now-interval '45 days'
    )
  order by g.swarm_score desc,g.expected_revenue_eur desc
  limit 5
  on conflict(dedupe_key) do nothing;
  get diagnostics v_rows=row_count; v_actions:=v_actions+v_rows;

  update public.powerhouse_growth_play_catalog_v1
  set readiness='ACTIVE',
      evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
        'activation_contract','powerhouse-growth-plays-v3',
        'persuasion_optimizer','powerhouse-persuasion-revenue-optimizer-v1',
        'capability_active',true,
        'activated_at',v_now,
        'execution_truth','ACTIVE means trigger/action/outcome path exists. It does not mean qualifying evidence exists on every run.'
      ),
      updated_at=v_now
  where play_key in (
    'mkb-friction-index','positive-public-teardown','anti-consultancy-challenge',
    'boardroom-fear-of-blindness','competitor-switch-pages','data-contribution-flywheel','risk-reversal'
  );

  return jsonb_build_object(
    'contract','powerhouse-growth-plays-v3',
    'catalog_plays',(select count(*) from public.powerhouse_growth_play_catalog_v1),
    'active_plays',(select count(*) from public.powerhouse_growth_play_catalog_v1 where readiness='ACTIVE'),
    'content_recommendations_touched',v_content,
    'sales_actions_touched',v_actions,
    'executed_at',v_now
  );
end;
$$;
revoke execute on function public.powerhouse_activate_remaining_growth_plays_v3(date) from public,anon,authenticated;
grant execute on function public.powerhouse_activate_remaining_growth_plays_v3(date) to service_role;

-- Shared bounded e-mail promotion. This reuses the same five-per-day total budget and
-- existing suppression/cooldown rules; growth plays do not add an independent sender.
create or replace function public.powerhouse_promote_growth_play_emails_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_now timestamptz:=now();
  v_promoted int:=0;
begin
  with sent_today as (
    select count(*)::int n from public.powerhouse_sales_actions
    where action_type='autonomous_email' and channel='email' and status='done'
      and executed_at>=date_trunc('day',v_now at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
  ), already_prepared as (
    select count(*)::int n from public.powerhouse_sales_actions
    where action_type='autonomous_email' and channel='email' and status='prepared'
      and created_at>=date_trunc('day',v_now at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
  ), candidates as (
    select a.*,r.email,r.relationship_revenue_score,
      row_number() over(order by a.priority desc,a.created_at,a.action_id) rn
    from public.powerhouse_sales_actions a
    join public.powerhouse_relationship_revenue_intelligence_v1 r on r.person_key=a.person_key
    where a.action_type='growth_play_email_candidate'
      and a.channel='internal'
      and a.status='suggested'
      and a.due_at<=v_now
      and nullif(trim(r.email),'') is not null
      and r.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
      and r.relationship_revenue_score>=.55
      and not exists(
        select 1 from public.powerhouse_sales_outcomes o
        where o.person_key=a.person_key
          and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply')
      )
      and not exists(
        select 1 from public.powerhouse_sales_actions x
        where x.person_key=a.person_key and x.channel='email' and x.status='done'
          and x.executed_at>=v_now-interval '30 days'
      )
  ), budget as (
    select greatest(0,5-(select n from sent_today)-(select n from already_prepared))::int slots
  ), chosen as (
    select c.* from candidates c cross join budget b where c.rn<=b.slots
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-play-email-exec:'||c.action_id::text,
    c.subject_key,c.person_key,c.company_key,'autonomous_email','email',c.priority,
    'Canonical Growth Swarm play promoted into the shared bounded autonomous-email executor.',
    coalesce(c.evidence,'{}'::jsonb)||jsonb_build_object(
      'source_growth_play_action_id',c.action_id,
      'recipient_email',c.email,
      'email_subject',c.evidence->>'candidate_email_subject',
      'authorization','user_authorized_autonomous_outbound_2026-09-28',
      'persuasion_contract','powerhouse-persuasion-revenue-optimizer-v1',
      'shared_email_budget',true
    ),
    coalesce(nullif(c.evidence->>'candidate_email_body',''),c.message_draft),
    'prepared',v_now,c.expected_value_eur,c.person_name,c.company_name,c.role
  from chosen c
  on conflict(dedupe_key) do nothing;
  get diagnostics v_promoted=row_count;

  update public.powerhouse_sales_actions parent
  set status='done',executed_at=v_now,
      evidence=coalesce(parent.evidence,'{}'::jsonb)||jsonb_build_object(
        'promoted_to_shared_email_executor',true,'promoted_at',v_now
      ),updated_at=v_now
  where parent.action_type='growth_play_email_candidate'
    and parent.status='suggested'
    and exists(
      select 1 from public.powerhouse_sales_actions child
      where child.dedupe_key='growth-play-email-exec:'||parent.action_id::text
    );

  return jsonb_build_object(
    'contract','powerhouse-growth-play-email-promotion-v1',
    'promoted',v_promoted,
    'shared_daily_email_cap',5,
    'executed_at',v_now
  );
end;
$$;
revoke execute on function public.powerhouse_promote_growth_play_emails_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_promote_growth_play_emails_v1(date) to service_role;

-- Extend the existing canonical Persuasion Revenue Optimizer so play-specific value offers
-- survive optimization while strategy metadata is still measured.
create or replace function public.powerhouse_optimize_prepared_outreach_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_now timestamptz:=now();
  v_email integer:=0;
  v_linkedin integer:=0;
begin
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion_contract','powerhouse-persuasion-revenue-optimizer-v1',
        'persuasion_strategy',p.persuasion_strategy,'give_asset',p.give_asset,'get_ask',p.get_ask,
        'optimization_rule','value_before_ask_and_measure_against_outcome',
        'truth_boundary','Persuasion selects framing, never fabricates evidence, urgency, scarcity, social proof or financial impact.'
      ),
      message_draft=
        case coalesce(a.evidence->>'play_key','')
          when 'anti-consultancy-challenge' then
            'Hoi '||coalesce(nullif(split_part(trim(a.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)||
            'Ik stuur je liever eerst drie concrete observaties dan een verkooppraat. Als daar geen serieuze hefboom uit komt, is mijn advies juist om nu niets te kopen.'||chr(10)||chr(10)||
            'Zal ik die drie observaties sturen?'||chr(10)||chr(10)||'Groet,'||chr(10)||'Arthur'||chr(10)||'Bedrijfsgeheugen.nl'
          when 'risk-reversal' then
            'Hoi '||coalesce(nullif(split_part(trim(a.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)||
            'Ik wil het aankooprisico klein houden. Daarom maken we vooraf expliciet wat de scan minimaal moet opleveren: drie concrete, evidence-backed hefbomen óf de conclusie dat een betaald vervolg niet gerechtvaardigd is.'||chr(10)||chr(10)||
            'Daarna beslis jij zelf of een vervolg zin heeft.'||chr(10)||chr(10)||'Groet,'||chr(10)||'Arthur'||chr(10)||'Bedrijfsgeheugen.nl'
          else
            'Hoi '||coalesce(nullif(split_part(trim(a.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)||
            case p.persuasion_strategy
              when 'loss_aversion' then 'Ik zag een ontwikkeling bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' die mogelijk raakt aan kennisverlies, frictie of stuurinformatie. Ik kan eerst één risico en de aannames erachter concreet voor je uitwerken.'
              when 'authority_evidence' then 'Ik heb de publieke signalen rond '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' naast onze patronen voor data, processen en AI gelegd. Er springen twee punten uit die ik met bron en redenering kan onderbouwen.'
              when 'commitment_microstep' then 'Omdat we elkaar al kennen wil ik het klein houden. Ik kan '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' eerst langs één korte benchmark leggen; je hoeft daarvoor alleen één vraag te beantwoorden.'
              when 'curiosity_gap' then 'Ik heb twee concrete observaties over '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' die samen een opvallend patroon geven. Ik stuur ze liever eerst op dan meteen om tijd in de agenda te vragen.'
              when 'contrast_before_after' then 'Ik heb een korte voor/na-schets gemaakt van wat er bestuurlijk verandert als kennis, processen en stuurinformatie beter samenkomen. Voor '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' kan ik dat in één MT-pagina zetten.'
              when 'reverse_sell' then 'Op basis van wat ik nu zie zou ik nog niets kopen. Ik kan je wel de twee interne acties sturen die ik eerst zou doen; daarna kun je beter bepalen of externe hulp überhaupt nodig is.'
              else 'Ik zag dat er bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' iets speelt rond '||replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||'. Ik kan je eerst drie concrete hefbomen sturen die je zelf kunt beoordelen, zonder afspraak of verkooppraat.'
            end||chr(10)||chr(10)||
            case p.get_ask
              when 'answer_one_question' then 'Als je wilt, stuur ik die ene vraag hier direct terug.'
              when 'offer_two_observations' then 'Zal ik die twee observaties sturen?'
              when 'no_external_ask' then 'Als dit later relevant wordt, weet je me te vinden.'
              else 'Zal ik die korte 1-pager sturen?'
            end||chr(10)||chr(10)||'Groet,'||chr(10)||'Arthur'||chr(10)||'Bedrijfsgeheugen.nl'||chr(10)||chr(10)||
            'PS Als dit nu niet relevant is, laat het gerust weten; dan stuur ik je hierover niet opnieuw.'
        end,
      updated_at=v_now
  from public.powerhouse_persuasion_next_best_action_v1 p
  where a.person_key=p.best_person_key and a.action_type='autonomous_email' and a.channel='email'
    and a.status='prepared' and a.due_at<=v_now and a.created_at>=v_now-interval '24 hours';
  get diagnostics v_email=row_count;

  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion_contract','powerhouse-persuasion-revenue-optimizer-v1',
        'persuasion_strategy','reciprocity_value_first','give_asset','useful_public_comment','get_ask','none',
        'optimization_rule','add_real_value_publicly_before_any_private_ask',
        'truth_boundary','No sales pitch, fake praise, fabricated fact or appointment CTA in public comments.'
      ),updated_at=v_now
  where a.action_type='reply_post' and a.channel='linkedin_personal'
    and a.status in ('prepared','suggested') and a.created_at>=v_now-interval '24 hours';
  get diagnostics v_linkedin=row_count;

  return jsonb_build_object(
    'contract','powerhouse-persuasion-revenue-optimizer-v1','run_date',p_run_date,
    'email_actions_optimized',v_email,'linkedin_actions_tagged',v_linkedin,
    'strategy_performance_rows',(select count(*) from public.powerhouse_persuasion_strategy_performance_v1),
    'catalog_strategies',(select count(*) from public.powerhouse_persuasion_play_catalog_v1),
    'growth_plays_integrated',20,'executed_at',v_now
  );
end;
$$;
revoke execute on function public.powerhouse_optimize_prepared_outreach_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_optimize_prepared_outreach_v1(date) to service_role;

-- One canonical commercial owner. No extra cron.
create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_all_plays jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_growth_email_promotion jsonb;
  v_persuasion jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  v_all_plays:=public.powerhouse_activate_remaining_growth_plays_v3(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_growth_email_promotion:=public.powerhouse_promote_growth_play_emails_v1(p_run_date);
  v_persuasion:=public.powerhouse_optimize_prepared_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);

  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,
    'growth_swarm_activation',v_growth_activation,
    'all_growth_plays',v_all_plays,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'growth_play_email_promotion',v_growth_email_promotion,
    'persuasion_optimizer',v_persuasion,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;
revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;

comment on function public.powerhouse_activate_remaining_growth_plays_v3(date) is
'Completes the seven formerly ARMED/READY Growth Swarm plays through canonical content, SEO, portal and bounded email paths.';
comment on function public.powerhouse_promote_growth_play_emails_v1(date) is
'Promotes eligible Growth Swarm email candidates into the existing autonomous-email executor without increasing the shared five-per-day budget.';
