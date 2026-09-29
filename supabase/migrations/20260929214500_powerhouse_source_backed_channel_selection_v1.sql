-- powerhouse-source-backed-channel-selection-v1
-- Materialize evidence-backed candidates for LinkedIn company/blog, enrich personal with a public theme,
-- and fail closed for unbacked email/LinkedIn-DM actions.

create or replace function public.powerhouse_materialize_source_backed_channel_candidates_v1(
  p_date date default timezone('Europe/Amsterdam',now())::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  s public.bg_externe_signalen%rowtype;
  k public.bg_zoekwoordkansen%rowtype;
  p public.powerhouse_mira_problem_signals_v1%rowtype;
  personal_id uuid;
  company_id uuid;
  blog_id uuid;
begin
  select * into s
  from public.bg_externe_signalen
  where toegestaan=true
    and coalesce(ruis_reden,'')=''
    and opgehaald_op >= now()-interval '10 days'
  order by coalesce(vertrouwen,0) desc,coalesce(relevantie,0) desc,opgehaald_op desc
  limit 1;

  select * into k
  from public.bg_zoekwoordkansen
  where opgehaald_op >= now()-interval '14 days'
    and coalesce(afgewezen_reden,'')=''
  order by coalesce(kansscore,0) desc,coalesce(zoekvolume,0) desc,opgehaald_op desc
  limit 1;

  if s.url is not null then
    insert into public.powerhouse_content_recommendations(
      dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
    ) values (
      'source-backed-linkedin-company:'||p_date::text,
      p_date,
      coalesce(nullif(s.onderwerp,''),'mkb-actueel-probleem'),
      'linkedin-company-source-'||p_date::text,
      'linkedin_company',
      'source_backed_market_problem',
      99,
      'Maak een bedrijfspost vanuit een actueel publiek MKB-signaal. Start bij het concrete probleem voor directie/MT, benoem alleen aantoonbare context en vertaal naar een praktische aanpak. Geen individuele prospectdetails.',
      jsonb_build_object(
        'contract','powerhouse-source-backed-all-channels-v1',
        'source_backed',true,
        'source_kind','current_external_mkb_signal',
        'source_url',s.url,
        'source_domain',s.domein,
        'source_title',s.titel,
        'source_excerpt',left(coalesce(s.samenvatting,''),900),
        'source_observed_at',s.opgehaald_op,
        'source_published_at',s.gepubliceerd_op,
        'source_confidence',s.vertrouwen,
        'source_relevance',s.relevantie,
        'target_audience','CEO_MT_MKB',
        'channel_native',true,
        'forced_personal_claim_forbidden',true,
        'measurement',jsonb_build_array('reach','engagement','clicks','scan_starts','leads','meetings','orders','revenue')
      ),
      'suggested'
    )
    on conflict(dedupe_key) do update set
      topic_key=excluded.topic_key,reason=excluded.reason,evidence=excluded.evidence,priority=excluded.priority,status='suggested',updated_at=now()
    returning recommendation_id into company_id;
  end if;

  if s.url is not null or k.zoekwoord is not null then
    insert into public.powerhouse_content_recommendations(
      dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
    ) values (
      'source-backed-blog:'||p_date::text,
      p_date,
      coalesce(nullif(k.zoekwoord,''),nullif(s.onderwerp,''),'mkb-probleem'),
      'blog-source-'||p_date::text,
      'blog',
      'source_backed_problem_search_intent',
      99.2,
      'Schrijf of verbeter de canonieke pagina vanuit actueel probleem-bewijs plus zoek/commerciële intentie. Controleer eerst bestaande URL-eigenaarschap en voorkom cannibalisatie.',
      jsonb_build_object(
        'contract','powerhouse-source-backed-all-channels-v1',
        'source_backed',true,
        'source_kind','problem_plus_search_intent',
        'source_url',s.url,
        'source_domain',s.domein,
        'source_title',s.titel,
        'source_excerpt',left(coalesce(s.samenvatting,''),900),
        'source_observed_at',s.opgehaald_op,
        'search_keyword',k.zoekwoord,
        'search_volume',k.zoekvolume,
        'search_cpc',k.cpc,
        'search_opportunity_score',k.kansscore,
        'search_source',k.bron,
        'search_observed_at',k.opgehaald_op,
        'cannibalization_guard_required',true,
        'prefer_existing_canonical_upgrade',true,
        'measurement',jsonb_build_array('impressions','organic_clicks','organic_visits','cta','scan_starts','leads','orders','revenue')
      ),
      'suggested'
    )
    on conflict(dedupe_key) do update set
      topic_key=excluded.topic_key,reason=excluded.reason,evidence=excluded.evidence,priority=excluded.priority,status='suggested',updated_at=now()
    returning recommendation_id into blog_id;
  end if;

  select * into p
  from public.powerhouse_mira_problem_signals_v1
  where eligible=true and observed_at >= now()-interval '10 days'
  order by total_score desc,observed_at desc
  limit 1;

  select recommendation_id into personal_id
  from public.powerhouse_content_recommendations
  where run_date=p_date
    and target_channel='linkedin_personal'
    and coalesce((evidence->>'personal_truth_verified')::boolean,false)=true
    and coalesce((evidence->>'arthur_anchor_verified')::boolean,false)=true
    and coalesce(evidence->>'identity_contract','')='arthur-personal-linkedin-identity-v4'
  order by priority desc,updated_at desc
  limit 1;

  if personal_id is not null then
    update public.powerhouse_content_recommendations
    set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
      'contract','powerhouse-source-backed-all-channels-v1',
      'source_backed',true,
      'source_kind','verified_personal_source',
      'public_theme_source_url',p.source_url,
      'public_theme_source_title',p.title,
      'public_theme_topic',p.topic_key,
      'public_theme_score',p.total_score,
      'public_theme_inspiration_only',true,
      'invented_personal_experience_forbidden',true,
      'public_theme_cannot_override_personal_truth',true,
      'measurement',jsonb_build_array('reach','reactions','comments','shares','profile_visits','follows','inbound_dm')
    ),
    updated_at=now()
    where recommendation_id=personal_id;
  end if;

  return jsonb_build_object(
    'ok',true,'contract','powerhouse-source-backed-all-channels-v1','run_date',p_date,
    'linkedin_company_recommendation_id',company_id,'blog_recommendation_id',blog_id,
    'linkedin_personal_recommendation_id',personal_id,
    'public_theme_signal_id',p.signal_id
  );
end $$;
revoke execute on function public.powerhouse_materialize_source_backed_channel_candidates_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_materialize_source_backed_channel_candidates_v1(date) to service_role;

create or replace function public.powerhouse_require_source_for_direct_outreach_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare c text:=lower(coalesce(new.channel,''));
declare has_source boolean;
begin
  if c in ('email','e-mail','linkedin dm','linkedin_dm') then
    has_source :=
      coalesce(nullif(new.source_url,''),'') <> ''
      or coalesce(nullif(new.opportunity_key,''),'') <> ''
      or coalesce(nullif(new.subject_key,''),'') <> ''
      or coalesce(new.evidence,'{}'::jsonb) ? 'source_lineage'
      or coalesce(new.evidence,'{}'::jsonb) ? 'source_ref'
      or coalesce(new.evidence,'{}'::jsonb) ? 'predictive_signal_id';
    if not has_source or (coalesce(new.person_key,'')='' and coalesce(new.company_key,'')='') then
      new.status:='blocked_source_missing';
      new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
        'source_gate','FAIL',
        'source_gate_contract','powerhouse-source-backed-all-channels-v1',
        'source_gate_reason',case when not has_source then 'NO_TRACEABLE_SOURCE_OR_TRIGGER' else 'NO_PERSON_OR_COMPANY_CONTEXT' end
      );
    else
      new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
        'source_gate','PASS',
        'source_gate_contract','powerhouse-source-backed-all-channels-v1'
      );
    end if;
  end if;
  return new;
end $$;

drop trigger if exists powerhouse_sales_actions_source_gate_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_sales_actions_source_gate_v1
before insert or update of channel,source_url,opportunity_key,subject_key,person_key,company_key,evidence,status
on public.powerhouse_sales_actions
for each row execute function public.powerhouse_require_source_for_direct_outreach_v1();

do $$
declare jid bigint;
begin
  select jobid into jid from cron.job where jobname='powerhouse-source-backed-channel-materializer-v1';
  if jid is not null then perform cron.unschedule(jid); end if;
  perform cron.schedule(
    'powerhouse-source-backed-channel-materializer-v1',
    '45 5 * * *',
    $c$select public.powerhouse_materialize_source_backed_channel_candidates_v1(timezone('Europe/Amsterdam',now())::date);$c$
  );
end $$;
