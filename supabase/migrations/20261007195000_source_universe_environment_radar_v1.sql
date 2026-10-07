-- Source Universe & Environment Radar v1
-- Existing-state-first: reuses bg_signaal_onderwerpen -> bg_externe_signalen ->
-- powerhouse_record_source_observation_v1 -> existing evidence/decision/action/outcome spine.
-- No second scheduler, no second external-signal store and no synthetic business impact.

create table if not exists public.powerhouse_source_catalog_v1 (
  source_key text primary key,
  domain_key text not null,
  source_type text not null,
  provider text not null,
  label text not null,
  authority_tier text not null check (authority_tier in ('OFFICIAL','PRIMARY','SPECIALIST','COMMUNITY','INTERNAL')),
  geography text not null default 'GLOBAL',
  acquisition_mode text not null,
  official_url text,
  refresh_cadence interval not null default interval '1 day',
  availability_state text not null default 'CATALOGUED'
    check (availability_state in ('CATALOGUED','CONNECTED','OBSERVED','LIVE','UNAVAILABLE')),
  enabled boolean not null default true,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_source_catalog_v1 enable row level security;
revoke all on public.powerhouse_source_catalog_v1 from anon, authenticated, public;
grant select, insert, update, delete on public.powerhouse_source_catalog_v1 to service_role;

comment on table public.powerhouse_source_catalog_v1 is
'Canonical Source Universe catalog. CATALOGUED means Bedrijfsgeheugen knows how/why to use a source; it is never evidence that the source is connected or live.';

create table if not exists public.powerhouse_signal_impact_assessment_v1 (
  tenant_id text not null,
  signal_key text not null,
  source_url text,
  domain_key text not null,
  signal_title text not null,
  observed_at timestamptz not null,
  nature text not null check (nature in ('RISK','OPPORTUNITY','BOTH','INFORMATION')),
  relevance numeric not null check (relevance between 0 and 1),
  magnitude numeric not null check (magnitude between 0 and 1),
  likelihood numeric not null check (likelihood between 0 and 1),
  urgency numeric not null check (urgency between 0 and 1),
  exposure numeric check (exposure between 0 and 1),
  confidence numeric not null check (confidence between 0 and 1),
  impact_score numeric not null check (impact_score between 0 and 100),
  value_eur numeric,
  downside_eur numeric,
  time_horizon text not null default 'UNKNOWN',
  impacted_dimensions text[] not null default '{}'::text[],
  action_status text not null default 'CONTEXT_REQUIRED'
    check (action_status in ('CONTEXT_REQUIRED','WATCH','REVIEW','ACTION_REQUIRED','ACTIONED','CLOSED')),
  recommended_action text,
  assessment_basis text not null default 'GENERIC_EXTERNAL_SIGNAL',
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, signal_key)
);

alter table public.powerhouse_signal_impact_assessment_v1 enable row level security;
revoke all on public.powerhouse_signal_impact_assessment_v1 from anon, authenticated, public;
grant select, insert, update, delete on public.powerhouse_signal_impact_assessment_v1 to service_role;

comment on table public.powerhouse_signal_impact_assessment_v1 is
'Derived impact projection. Monetary impact/exposure stay NULL until supported by tenant/company evidence; missing context must never be synthesized.';

create index if not exists powerhouse_signal_impact_assessment_rank_v1
  on public.powerhouse_signal_impact_assessment_v1 (tenant_id, impact_score desc, observed_at desc);
create index if not exists powerhouse_source_catalog_domain_v1
  on public.powerhouse_source_catalog_v1 (domain_key, enabled, availability_state);

create or replace function public.powerhouse_classify_external_signal_domain_v1(
  p_topic text,
  p_domain text,
  p_title text,
  p_summary text
) returns text
language sql
immutable
set search_path = public, pg_catalog
as $$
  select case
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(ai act|wet|regelgeving|privacy|avg|gdpr|nis2|dora|cra|compliance|toezicht|vergunning)' then 'REGULATION_COMPLIANCE'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(cyber|ransomware|kwetsbaar|cve|phishing|security|datalek|zero.day)' then 'CYBER_SECURITY'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(subsid|regeling|fonds|wbso|innovatiecredit)' then 'SUBSIDIES_INCENTIVES'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(arbeidsmarkt|vacature|personeel|loon|skills|beroep|talent|verzuim)' then 'LABOR_SKILLS'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(rente|ecb|financier|krediet|inflatie|bbp|economie|faillissement|wisselkoers)' then 'ECONOMY_FINANCE'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(energie|elektric|gas|netcongest|co2|carbon|klimaat|water|duurzaam)' then 'ENERGY_CLIMATE'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(leverancier|supply|keten|logistiek|container|grondstof|commodity|haven|douane)' then 'SUPPLY_CHAIN'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(tender|aanbested|ted europa|procurement)' then 'PUBLIC_PROCUREMENT'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(octrooi|patent|merk|wipo|epo|euipo|intellect)' then 'IP_INNOVATION'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(concurrent|marktaandeel|prijs|klant|consument|vraag|review|sentiment|zoekgedrag)' then 'MARKET_CUSTOMER'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(sanctie|geopolit|oorlog|handel|export|import|tarief|verkiez)' then 'GEOPOLITICS_TRADE'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(vastgoed|huur|bedrijfsterrein|bestemmingsplan|mobiliteit|transport)' then 'LOCATION_MOBILITY'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(verzekering|fraude|aml|sanctielijst|pep|reputatie|recall)' then 'TRUST_FINANCIAL_CRIME'
    when lower(coalesce(p_topic,'')||' '||coalesce(p_domain,'')||' '||coalesce(p_title,'')||' '||coalesce(p_summary,'')) ~
      '(ai|model|agent|cloud|software|technolog|robot|quantum|chip|saas)' then 'AI_TECHNOLOGY'
    else 'GENERAL_ENVIRONMENT'
  end
$$;

revoke all on function public.powerhouse_classify_external_signal_domain_v1(text,text,text,text) from public, anon, authenticated;
grant execute on function public.powerhouse_classify_external_signal_domain_v1(text,text,text,text) to service_role;

create or replace function public.powerhouse_refresh_environment_radar_v1(
  p_tenant_id text default 'canonical'
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_rows integer := 0;
  v_high integer := 0;
  v_sources integer := 0;
  v_live integer := 0;
begin
  if nullif(btrim(p_tenant_id),'') is null then
    raise exception 'TENANT_ID_REQUIRED';
  end if;

  insert into public.powerhouse_signal_impact_assessment_v1 (
    tenant_id,signal_key,source_url,domain_key,signal_title,observed_at,nature,
    relevance,magnitude,likelihood,urgency,exposure,confidence,impact_score,
    value_eur,downside_eur,time_horizon,impacted_dimensions,action_status,
    recommended_action,assessment_basis,evidence,updated_at
  )
  select
    p_tenant_id,
    md5(coalesce(s.url,'')||'|'||coalesce(s.titel,'')||'|'||coalesce(s.opgehaald_op::text,'')),
    s.url,
    public.powerhouse_classify_external_signal_domain_v1(s.onderwerp,s.domein,s.titel,s.samenvatting),
    coalesce(nullif(s.titel,''),nullif(s.onderwerp,''),'Extern signaal'),
    coalesce(s.gepubliceerd_op,s.opgehaald_op,now()),
    case
      when lower(coalesce(s.onderwerp,'')||' '||coalesce(s.titel,'')||' '||coalesce(s.samenvatting,'')) ~ '(subsid|tender|groei|kans|vraag stijgt|innovatie)' then 'OPPORTUNITY'
      when lower(coalesce(s.onderwerp,'')||' '||coalesce(s.titel,'')||' '||coalesce(s.samenvatting,'')) ~ '(dreiging|risico|boete|ransomware|tekort|stijgt|sanctie|deadline|verplicht)' then 'RISK'
      else 'BOTH'
    end,
    greatest(0,least(1,coalesce(s.relevantie,s.vertrouwen,0.5))),
    greatest(0,least(1,
      case
        when s.deadline is not null and s.deadline <= current_date + 30 then 0.9
        when s.deadline is not null and s.deadline <= current_date + 90 then 0.75
        else greatest(0.35,coalesce(s.vertrouwen,0.5))
      end
    )),
    greatest(0,least(1,coalesce(s.bevestiging,s.vertrouwen,0.5))),
    greatest(0,least(1,
      case
        when s.deadline is not null and s.deadline < current_date then 1
        when s.deadline is not null and s.deadline <= current_date + 30 then 0.95
        when s.deadline is not null and s.deadline <= current_date + 90 then 0.75
        else 0.4
      end
    )),
    null,
    greatest(0,least(1,coalesce(s.vertrouwen,0.5))),
    round(100 * (
      greatest(0,least(1,coalesce(s.relevantie,s.vertrouwen,0.5))) * 0.25 +
      greatest(0,least(1,coalesce(s.vertrouwen,0.5))) * 0.20 +
      greatest(0,least(1,coalesce(s.bevestiging,s.vertrouwen,0.5))) * 0.15 +
      greatest(0,least(1,case
        when s.deadline is not null and s.deadline < current_date then 1
        when s.deadline is not null and s.deadline <= current_date + 30 then 0.95
        when s.deadline is not null and s.deadline <= current_date + 90 then 0.75
        else 0.4 end)) * 0.20 +
      greatest(0,least(1,coalesce(s.versheid,0.5))) * 0.10 +
      greatest(0,least(1,coalesce(s.brontrouw,0.5))) * 0.10
    ),1),
    null,
    null,
    case
      when s.deadline is not null and s.deadline <= current_date + 30 then '<30_DAYS'
      when s.deadline is not null and s.deadline <= current_date + 90 then '<90_DAYS'
      when s.deadline is not null and s.deadline <= current_date + 365 then '<1_YEAR'
      else 'UNKNOWN'
    end,
    case public.powerhouse_classify_external_signal_domain_v1(s.onderwerp,s.domein,s.titel,s.samenvatting)
      when 'REGULATION_COMPLIANCE' then array['compliance','governance','operations']
      when 'CYBER_SECURITY' then array['security','continuity','reputation']
      when 'SUBSIDIES_INCENTIVES' then array['cashflow','investment','innovation']
      when 'LABOR_SKILLS' then array['people','capacity','cost']
      when 'ECONOMY_FINANCE' then array['revenue','margin','cashflow','financing']
      when 'ENERGY_CLIMATE' then array['cost','operations','sustainability']
      when 'SUPPLY_CHAIN' then array['operations','inventory','margin','continuity']
      when 'PUBLIC_PROCUREMENT' then array['revenue','sales','capacity']
      when 'IP_INNOVATION' then array['innovation','strategy','competition']
      when 'MARKET_CUSTOMER' then array['revenue','customer','pricing','strategy']
      when 'GEOPOLITICS_TRADE' then array['supply_chain','revenue','compliance','continuity']
      when 'LOCATION_MOBILITY' then array['operations','cost','people']
      when 'TRUST_FINANCIAL_CRIME' then array['reputation','finance','compliance']
      when 'AI_TECHNOLOGY' then array['technology','productivity','strategy','security']
      else array['strategy']
    end,
    case
      when s.deadline is not null and s.deadline <= current_date + 30 then 'REVIEW'
      else 'CONTEXT_REQUIRED'
    end,
    case
      when s.deadline is not null and s.deadline <= current_date + 30
        then 'Controleer toepasselijkheid, eigenaar en benodigde actie vóór de deadline.'
      else 'Koppel dit signaal aan bedrijfscontext, exposure en eigenaar voordat een concrete actie of euro-impact wordt vastgesteld.'
    end,
    'DETERMINISTIC_BASELINE_NO_SYNTHETIC_COMPANY_EXPOSURE',
    jsonb_strip_nulls(jsonb_build_object(
      'source','bg_externe_signalen',
      'topic',s.onderwerp,
      'domain',s.domein,
      'source_trust',s.brontrouw,
      'confirmation',s.bevestiging,
      'freshness',s.versheid,
      'relevance',s.relevantie,
      'confidence',s.vertrouwen,
      'deadline',s.deadline,
      'company_exposure','UNKNOWN_UNTIL_EVIDENCE'
    )),
    now()
  from public.bg_externe_signalen s
  where s.toegestaan = true
  on conflict (tenant_id,signal_key) do update set
    source_url=excluded.source_url,
    domain_key=excluded.domain_key,
    signal_title=excluded.signal_title,
    observed_at=excluded.observed_at,
    nature=excluded.nature,
    relevance=excluded.relevance,
    magnitude=excluded.magnitude,
    likelihood=excluded.likelihood,
    urgency=excluded.urgency,
    confidence=excluded.confidence,
    impact_score=excluded.impact_score,
    time_horizon=excluded.time_horizon,
    impacted_dimensions=excluded.impacted_dimensions,
    action_status=case
      when public.powerhouse_signal_impact_assessment_v1.action_status in ('ACTIONED','CLOSED')
        then public.powerhouse_signal_impact_assessment_v1.action_status
      else excluded.action_status
    end,
    recommended_action=excluded.recommended_action,
    evidence=public.powerhouse_signal_impact_assessment_v1.evidence || excluded.evidence,
    updated_at=now();

  get diagnostics v_rows = row_count;

  select count(*)::int into v_high
  from public.powerhouse_signal_impact_assessment_v1
  where tenant_id=p_tenant_id and impact_score>=70;

  select count(*)::int,
         count(*) filter (where availability_state in ('OBSERVED','LIVE'))::int
  into v_sources,v_live
  from public.powerhouse_source_catalog_v1
  where enabled=true;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'environment-radar:'||p_tenant_id||':'||(timezone('Europe/Amsterdam',now())::date)::text,
    'environment_radar_refreshed',
    'powerhouse-environment-radar-v1',
    p_tenant_id,
    'data-intelligence',
    now(),
    jsonb_build_object(
      'assessments_refreshed',v_rows,
      'high_attention',v_high,
      'catalogued_sources',v_sources,
      'observed_or_live_sources',v_live
    ),
    jsonb_build_object(
      'lineage','source->signal->relevance->impact->company-context->recommendation->action->outcome->learning',
      'company_exposure_synthesized',false,
      'monetary_impact_synthesized',false,
      'existing_signal_store_reused','bg_externe_signalen'
    ),
    'actioned','VERIFIED',1
  )
  on conflict (dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-environment-radar-v1',
    'tenant_id',p_tenant_id,
    'assessments_refreshed',v_rows,
    'high_attention',v_high,
    'catalogued_sources',v_sources,
    'observed_or_live_sources',v_live,
    'company_exposure_synthesized',false,
    'monetary_impact_synthesized',false,
    'refreshed_at',now()
  );
end
$$;

revoke all on function public.powerhouse_refresh_environment_radar_v1(text) from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_environment_radar_v1(text) to service_role;

create or replace view public.powerhouse_source_universe_health_v1
with (security_invoker = true)
as
select
  domain_key,
  count(*)::int as catalogued_sources,
  count(*) filter (where availability_state in ('CONNECTED','OBSERVED','LIVE'))::int as connected_sources,
  count(*) filter (where availability_state in ('OBSERVED','LIVE'))::int as observed_sources,
  count(*) filter (where availability_state='LIVE')::int as live_sources,
  min(refresh_cadence) as fastest_cadence,
  max(updated_at) as updated_at
from public.powerhouse_source_catalog_v1
where enabled=true
group by domain_key;

revoke all on public.powerhouse_source_universe_health_v1 from anon, authenticated, public;
grant select on public.powerhouse_source_universe_health_v1 to service_role;

insert into public.powerhouse_evidence_sources(
  source_key,source_class,required,max_age,writer_contract,owner_component,notes
) values (
  'environment-radar',
  'external_intelligence',
  false,
  interval '2 hours',
  'powerhouse_refresh_environment_radar_v1',
  'ONE BRAIN / Signals & External Intelligence',
  'Derived Source Universe radar. Required=false until provider-specific acquisition is owned; missing provider evidence may never be synthesized.'
)
on conflict (source_key) do update set
  source_class=excluded.source_class,
  max_age=excluded.max_age,
  writer_contract=excluded.writer_contract,
  owner_component=excluded.owner_component,
  notes=excluded.notes,
  updated_at=now();

insert into public.powerhouse_source_catalog_v1
(source_key,domain_key,source_type,provider,label,authority_tier,geography,acquisition_mode,official_url,refresh_cadence,availability_state,description)
values
('eu-ai-act','REGULATION_COMPLIANCE','regulator','European Commission','EU AI Act','OFFICIAL','EU','official-web','https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',interval '1 day','OBSERVED','AI rules, implementation, guidance and milestones'),
('eur-lex','REGULATION_COMPLIANCE','legal-register','European Union','EUR-Lex','OFFICIAL','EU','official-web','https://eur-lex.europa.eu/',interval '1 day','CATALOGUED','EU legislation and amendments'),
('autoriteit-persoonsgegevens','REGULATION_COMPLIANCE','regulator','Autoriteit Persoonsgegevens','Autoriteit Persoonsgegevens','OFFICIAL','NL','official-web','https://www.autoriteitpersoonsgegevens.nl/',interval '1 day','CATALOGUED','Privacy and data protection'),
('acm','REGULATION_COMPLIANCE','regulator','ACM','Autoriteit Consument & Markt','OFFICIAL','NL','official-web','https://www.acm.nl/',interval '1 day','CATALOGUED','Competition, consumer and digital-market supervision'),
('ncsc-nl','CYBER_SECURITY','cyber-authority','NCSC','NCSC Nederland','OFFICIAL','NL','official-web','https://www.ncsc.nl/',interval '1 hour','CATALOGUED','Cyber threats, vulnerabilities and advisories'),
('enisa','CYBER_SECURITY','cyber-authority','ENISA','ENISA','OFFICIAL','EU','official-web','https://www.enisa.europa.eu/',interval '6 hours','CATALOGUED','EU cyber threat and resilience intelligence'),
('cve','CYBER_SECURITY','vulnerability-feed','CVE Program','CVE','PRIMARY','GLOBAL','feed','https://www.cve.org/',interval '1 hour','CATALOGUED','Public vulnerability identifiers and records'),
('cisa-kev','CYBER_SECURITY','vulnerability-feed','CISA','Known Exploited Vulnerabilities','OFFICIAL','GLOBAL','feed','https://www.cisa.gov/known-exploited-vulnerabilities-catalog',interval '1 hour','CATALOGUED','Actively exploited vulnerability catalog'),
('openai-updates','AI_TECHNOLOGY','technology-provider','OpenAI','OpenAI product & model updates','PRIMARY','GLOBAL','official-web','https://openai.com/news/',interval '6 hours','CATALOGUED','AI model, platform and product changes'),
('microsoft-ai','AI_TECHNOLOGY','technology-provider','Microsoft','Microsoft AI & Azure updates','PRIMARY','GLOBAL','official-web','https://azure.microsoft.com/en-us/updates/',interval '6 hours','CATALOGUED','Azure, Fabric, AI and platform changes'),
('google-cloud','AI_TECHNOLOGY','technology-provider','Google','Google Cloud releases','PRIMARY','GLOBAL','official-web','https://cloud.google.com/release-notes',interval '6 hours','CATALOGUED','Cloud, data and AI releases'),
('aws-whats-new','AI_TECHNOLOGY','technology-provider','AWS','AWS What’s New','PRIMARY','GLOBAL','official-web','https://aws.amazon.com/new/',interval '6 hours','CATALOGUED','Cloud and AI releases'),
('github-trends','AI_TECHNOLOGY','developer-ecosystem','GitHub','GitHub ecosystem','SPECIALIST','GLOBAL','connector','https://github.com/',interval '6 hours','CONNECTED','Open-source and developer ecosystem signals'),
('rvo','SUBSIDIES_INCENTIVES','public-funding','RVO','RVO subsidies & programmes','OFFICIAL','NL','official-web','https://www.rvo.nl/subsidies-financiering',interval '6 hours','OBSERVED','Dutch subsidies, financing and schemes'),
('funding-tenders-eu','SUBSIDIES_INCENTIVES','public-funding','European Commission','EU Funding & Tenders','OFFICIAL','EU','official-web','https://ec.europa.eu/info/funding-tenders/opportunities/portal/',interval '12 hours','CATALOGUED','EU grants, calls and funding programmes'),
('uwv-labour','LABOR_SKILLS','labour-market','UWV','UWV Arbeidsmarktinformatie','OFFICIAL','NL','official-web','https://www.uwv.nl/nl/arbeidsmarktinformatie',interval '1 day','OBSERVED','Labour shortages, occupations and regional labour market'),
('cbs','ECONOMY_FINANCE','statistics','CBS','Centraal Bureau voor de Statistiek','OFFICIAL','NL','official-web','https://www.cbs.nl/',interval '6 hours','OBSERVED','Economy, sectors, labour, demography and business statistics'),
('dnb','ECONOMY_FINANCE','central-bank','DNB','De Nederlandsche Bank','OFFICIAL','NL','official-web','https://www.dnb.nl/',interval '6 hours','CATALOGUED','Dutch economy, financial stability and financing'),
('ecb','ECONOMY_FINANCE','central-bank','ECB','European Central Bank','OFFICIAL','EU','official-web','https://www.ecb.europa.eu/',interval '1 hour','CATALOGUED','Interest rates, monetary policy and financing conditions'),
('eurostat','ECONOMY_FINANCE','statistics','Eurostat','Eurostat','OFFICIAL','EU','official-web','https://ec.europa.eu/eurostat/',interval '1 day','CATALOGUED','European economic, labour and demographic statistics'),
('kvk','COMPANY_MARKET','company-register','KVK','Kamer van Koophandel','OFFICIAL','NL','official-web','https://www.kvk.nl/',interval '1 day','CATALOGUED','Company registrations, sector and business information'),
('tenderned','PUBLIC_PROCUREMENT','procurement','TenderNed','TenderNed','OFFICIAL','NL','official-web','https://www.tenderned.nl/',interval '1 hour','CATALOGUED','Dutch public procurement opportunities'),
('ted-europa','PUBLIC_PROCUREMENT','procurement','European Union','TED Europa','OFFICIAL','EU','official-web','https://ted.europa.eu/',interval '1 hour','CATALOGUED','European public procurement opportunities'),
('epo','IP_INNOVATION','patents','European Patent Office','EPO','OFFICIAL','EU','official-web','https://www.epo.org/',interval '1 day','CATALOGUED','Patent and technology intelligence'),
('wipo','IP_INNOVATION','ip-register','WIPO','WIPO','OFFICIAL','GLOBAL','official-web','https://www.wipo.int/',interval '1 day','CATALOGUED','International patent and IP intelligence'),
('euipo','IP_INNOVATION','ip-register','EUIPO','EUIPO','OFFICIAL','EU','official-web','https://www.euipo.europa.eu/',interval '1 day','CATALOGUED','EU trademarks and designs'),
('knmi','ENERGY_CLIMATE','weather-climate','KNMI','KNMI','OFFICIAL','NL','official-web','https://www.knmi.nl/',interval '1 hour','CATALOGUED','Weather and climate risk'),
('tennet','ENERGY_CLIMATE','grid','TenneT','TenneT','PRIMARY','NL','official-web','https://www.tennet.eu/',interval '1 hour','CATALOGUED','Grid and electricity-system signals'),
('rvo-energy','ENERGY_CLIMATE','energy-policy','RVO','RVO Energie & verduurzaming','OFFICIAL','NL','official-web','https://www.rvo.nl/onderwerpen/energie',interval '6 hours','CATALOGUED','Energy policy, schemes and transition'),
('port-rotterdam','SUPPLY_CHAIN','logistics','Port of Rotterdam','Port of Rotterdam','PRIMARY','NL','official-web','https://www.portofrotterdam.com/',interval '6 hours','CATALOGUED','Port, logistics and supply-chain disruption'),
('eurostat-trade','GEOPOLITICS_TRADE','trade-statistics','Eurostat','EU trade statistics','OFFICIAL','EU','official-web','https://ec.europa.eu/eurostat/web/international-trade-in-goods',interval '1 day','CATALOGUED','EU trade flows'),
('eu-sanctions','GEOPOLITICS_TRADE','sanctions','European Union','EU sanctions','OFFICIAL','EU','official-web','https://www.consilium.europa.eu/en/policies/sanctions/',interval '6 hours','CATALOGUED','EU sanctions and restrictive measures'),
('overheid-nl','LOCAL_ENVIRONMENT','government','Overheid.nl','Overheid.nl','OFFICIAL','NL','official-web','https://www.overheid.nl/',interval '6 hours','CATALOGUED','National and local government publications'),
('rechtspraak','TRUST_FINANCIAL_CRIME','legal','Rechtspraak','Rechtspraak.nl','OFFICIAL','NL','official-web','https://www.rechtspraak.nl/',interval '1 day','CATALOGUED','Public court decisions and legal risk signals'),
('afm','TRUST_FINANCIAL_CRIME','financial-regulator','AFM','Autoriteit Financiële Markten','OFFICIAL','NL','official-web','https://www.afm.nl/',interval '1 day','CATALOGUED','Financial-market supervision and fraud warnings'),
('google-trends','MARKET_CUSTOMER','search-demand','Google','Google Trends','PRIMARY','GLOBAL','connector','https://trends.google.com/',interval '6 hours','CATALOGUED','Search-demand shifts and emerging customer interest'),
('google-search-console','MARKET_CUSTOMER','owned-search','Google','Google Search Console','INTERNAL','OWNED','connector','https://search.google.com/search-console/',interval '6 hours','CONNECTED','Owned search demand, impressions, clicks and queries'),
('google-analytics','MARKET_CUSTOMER','owned-analytics','Google','Google Analytics','INTERNAL','OWNED','connector','https://analytics.google.com/',interval '6 hours','CONNECTED','Owned customer and website behaviour'),
('linkedin','MARKET_CUSTOMER','social-market','LinkedIn','LinkedIn','COMMUNITY','GLOBAL','connector','https://www.linkedin.com/',interval '6 hours','CONNECTED','Company, hiring and professional-market signals'),
('reddit','MARKET_CUSTOMER','community','Reddit','Reddit','COMMUNITY','GLOBAL','search','https://www.reddit.com/',interval '6 hours','CATALOGUED','Community questions, sentiment and emerging themes'),
('trustpilot','MARKET_CUSTOMER','reviews','Trustpilot','Trustpilot','COMMUNITY','GLOBAL','search','https://www.trustpilot.com/',interval '1 day','CATALOGUED','Customer review and reputation signals'),
('company-websites','COMPETITION','competitor-web','Public web','Competitor websites','PRIMARY','GLOBAL','search',null,interval '1 day','CATALOGUED','Competitor proposition, pricing, hiring, product and case changes'),
('competitor-jobs','COMPETITION','hiring-signal','Public web','Competitor vacancies','PRIMARY','GLOBAL','search',null,interval '1 day','CATALOGUED','Hiring intensity and capability investments'),
('competitor-pricing','COMPETITION','pricing-signal','Public web','Competitor pricing','PRIMARY','GLOBAL','search',null,interval '1 day','CATALOGUED','Pricing and packaging changes'),
('supplier-websites','SUPPLY_CHAIN','supplier-signal','Public web','Supplier signals','PRIMARY','GLOBAL','search',null,interval '1 day','CATALOGUED','Supplier continuity, pricing and product changes'),
('customer-reviews','MARKET_CUSTOMER','customer-voice','Public + owned','Customer reviews & complaints','COMMUNITY','GLOBAL','connector',null,interval '6 hours','CATALOGUED','Voice-of-customer and reputation'),
('erp','INTERNAL_OPERATIONS','business-system','Customer ERP','ERP / finance / orders','INTERNAL','TENANT','connector',null,interval '1 hour','CATALOGUED','Revenue, margin, orders, inventory and supplier exposure'),
('crm','INTERNAL_OPERATIONS','business-system','Customer CRM','CRM / customers / pipeline','INTERNAL','TENANT','connector',null,interval '1 hour','CATALOGUED','Customer, pipeline, churn and sales context'),
('hris','INTERNAL_OPERATIONS','business-system','Customer HRIS','HR / people / skills','INTERNAL','TENANT','connector',null,interval '6 hours','CATALOGUED','People, capacity, absence, turnover and skills'),
('service-desk','INTERNAL_OPERATIONS','business-system','Customer Service Desk','Service / support / incidents','INTERNAL','TENANT','connector',null,interval '1 hour','CATALOGUED','Operational incidents, customer issues and service quality'),
('procurement','INTERNAL_OPERATIONS','business-system','Customer Procurement','Procurement / suppliers','INTERNAL','TENANT','connector',null,interval '1 hour','CATALOGUED','Supplier contracts, spend and dependency'),
('contracts','INTERNAL_OPERATIONS','documents','Customer contracts','Contracts','INTERNAL','TENANT','connector',null,interval '6 hours','CATALOGUED','Commercial, supplier, renewal and compliance obligations'),
('documents','INTERNAL_OPERATIONS','knowledge','Customer documents','Documents & knowledge','INTERNAL','TENANT','connector',null,interval '6 hours','CATALOGUED','Policies, plans, procedures, research and institutional memory'),
('email-calendar','INTERNAL_OPERATIONS','communication','Customer workspace','Email & calendar','INTERNAL','TENANT','connector',null,interval '1 hour','CATALOGUED','Commitments, decisions, customer contact and upcoming events'),
('projects-tasks','INTERNAL_OPERATIONS','execution','Customer work management','Projects & tasks','INTERNAL','TENANT','connector',null,interval '1 hour','CATALOGUED','Execution, owners, deadlines and delivery risk')
on conflict (source_key) do update set
  domain_key=excluded.domain_key,
  source_type=excluded.source_type,
  provider=excluded.provider,
  label=excluded.label,
  authority_tier=excluded.authority_tier,
  geography=excluded.geography,
  acquisition_mode=excluded.acquisition_mode,
  official_url=excluded.official_url,
  refresh_cadence=excluded.refresh_cadence,
  description=excluded.description,
  updated_at=now();

insert into public.bg_signaal_onderwerpen(onderwerp,zoekvraag,actief,segmenten,contentpijler)
values
('AI-wetgeving en toezicht','EU AI Act AI regulation guidance enforcement Netherlands Europe',true,array['alle-bedrijven'],'wet-regelgeving'),
('Privacy en dataregels','GDPR AVG Data Act Data Governance Act privacy regulatory changes Netherlands Europe',true,array['alle-bedrijven'],'wet-regelgeving'),
('NIS2 en cyberwetgeving','NIS2 Cyberbeveiligingswet CRA cyber security regulation Netherlands Europe',true,array['alle-bedrijven'],'wet-regelgeving'),
('Cyberdreigingen en kwetsbaarheden','NCSC ENISA ransomware CVE zero-day exploited vulnerabilities supply chain cyber',true,array['alle-bedrijven'],'cyber-security'),
('AI-modellen en agents','new AI models agents enterprise AI releases reasoning multimodal automation',true,array['alle-bedrijven'],'ai-technologie'),
('Cloud data en software','Microsoft Azure Fabric AWS Google Cloud data software releases enterprise',true,array['alle-bedrijven'],'ai-technologie'),
('Robotica chips en quantum','robotics semiconductors chips quantum computing enterprise technology developments',true,array['industrie','technologie'],'ai-technologie'),
('Marktvraag en klantgedrag','Netherlands customer demand consumer behaviour B2B buying behaviour market shift',true,array['alle-bedrijven'],'markt-klant'),
('Concurrenten en prijsbewegingen','competitor pricing product launches partnerships acquisitions Netherlands business',true,array['alle-bedrijven'],'markt-klant'),
('Zoekgedrag en digitale vraag','search demand trends Netherlands business consumer emerging queries',true,array['alle-bedrijven'],'markt-klant'),
('Subsidies en fondsen','RVO subsidies funding schemes WBSO MIT innovation energy digitalisation Netherlands',true,array['mkb'],'subsidies-regelingen'),
('EU-subsidies en calls','EU funding tenders grants calls SMEs innovation digital green Europe',true,array['mkb'],'subsidies-regelingen'),
('Rente en financiering','ECB interest rates Dutch business financing credit conditions lending insolvencies',true,array['alle-bedrijven'],'economie-finance'),
('Inflatie en economische groei','CBS DNB Eurostat inflation GDP business confidence Netherlands sector economy',true,array['alle-bedrijven'],'economie-finance'),
('Faillissementen en kredietrisico','Netherlands bankruptcies payment behaviour credit risk business insolvency',true,array['alle-bedrijven'],'economie-finance'),
('Arbeidsmarkt en personeel','UWV CBS labour shortage vacancies wages absence turnover Netherlands',true,array['alle-bedrijven'],'arbeidsmarkt-personeel'),
('Skills en beroepen','skills shortages occupations AI literacy digital skills Netherlands workforce',true,array['alle-bedrijven'],'arbeidsmarkt-personeel'),
('Energieprijzen en netcongestie','Netherlands electricity gas prices net congestion grid business energy',true,array['industrie','mkb'],'energie-klimaat'),
('Klimaat en fysieke risico’s','KNMI climate heat drought flooding extreme weather business Netherlands',true,array['alle-bedrijven'],'energie-klimaat'),
('CO2 circulariteit en duurzaamheid','CSRD ESRS carbon circular economy packaging sustainability business Europe',true,array['alle-bedrijven'],'duurzaamheid'),
('Grondstoffen en commodities','commodity raw material metals plastics chemicals food price supply risk Europe',true,array['industrie','handel'],'keten'),
('Leveranciers en supply chain','supplier disruption logistics shipping port lead times supply chain Europe Netherlands',true,array['alle-bedrijven'],'keten'),
('Geopolitiek en sancties','EU sanctions geopolitics trade restrictions business supply chain Europe',true,array['alle-bedrijven'],'geopolitiek-handel'),
('Import export en tarieven','EU international trade tariffs customs CBAM export restrictions Netherlands',true,array['handel','industrie'],'geopolitiek-handel'),
('Publieke aanbestedingen','TenderNed TED public procurement tenders Netherlands Europe opportunities',true,array['b2b','mkb'],'aanbestedingen'),
('Patenten merken en IP','EPO WIPO EUIPO patents trademarks new technology Europe',true,array['technologie','industrie'],'innovatie-ip'),
('M&A investeringen en consolidatie','Netherlands mergers acquisitions private equity investment consolidation sector',true,array['alle-bedrijven'],'markt-klant'),
('Normen en standaarden','ISO NEN CEN standards AI security quality changes business',true,array['alle-bedrijven'],'wet-regelgeving'),
('Reputatie reviews en recalls','customer reviews reputation complaints product recalls Netherlands companies',true,array['alle-bedrijven'],'markt-klant'),
('Fraude AML en sanctielijsten','business fraud invoice fraud AML sanctions PEP cyber financial crime Netherlands',true,array['alle-bedrijven'],'risk'),
('Verzekeringen en verzekerbaarheid','business insurance cyber insurance premiums coverage Netherlands risk',true,array['alle-bedrijven'],'risk'),
('Vastgoed en bedrijfslocaties','commercial real estate rent vacancy business parks Netherlands zoning',true,array['alle-bedrijven'],'locatie'),
('Mobiliteit en infrastructuur','Netherlands mobility transport infrastructure freight road rail business',true,array['alle-bedrijven'],'locatie'),
('Demografie en regionale ontwikkeling','CBS demographics migration ageing regional economy Netherlands business',true,array['alle-bedrijven'],'markt-klant'),
('Gezondheid en maatschappelijke verstoring','public health workforce absence disruption Netherlands business continuity',true,array['alle-bedrijven'],'continuiteit')
on conflict (onderwerp) do update set
  zoekvraag=excluded.zoekvraag,
  actief=true,
  segmenten=excluded.segmenten,
  contentpijler=excluded.contentpijler;

insert into public.powerhouse_loop_assurance_registry_v1(
  loop_key,label,runtime_source,cron_jobname,expected_cadence_minutes,critical,required_stages,active,evidence_contract
) values (
  'environment-radar',
  'Source Universe & Environment Radar',
  'powerhouse-environment-radar-v1',
  'powerhouse-evidence-maintenance-hourly-v1',
  60,
  false,
  array['input','decision','action','readback','outcome','measurement','learning','guard'],
  true,
  jsonb_build_object(
    'input','active source taxonomy + observed external signals',
    'decision','deterministic relevance/impact baseline without synthetic exposure',
    'action','recommendation only after context gate',
    'readback','runtime event + persisted assessment',
    'outcome','requires later observed business outcome',
    'measurement','impact/outcome evidence',
    'learning','verified outcome learning only',
    'guard','unknown exposure/value remain unknown'
  )
)
on conflict (loop_key) do update set
  label=excluded.label,
  runtime_source=excluded.runtime_source,
  cron_jobname=excluded.cron_jobname,
  expected_cadence_minutes=excluded.expected_cadence_minutes,
  critical=excluded.critical,
  required_stages=excluded.required_stages,
  active=true,
  evidence_contract=excluded.evidence_contract,
  updated_at=now();

create or replace function public.powerhouse_evidence_daily_maintenance_v1()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_close jsonb;
  v_truth jsonb;
  v_health jsonb;
  v_environment jsonb;
  r record;
  v_promotions jsonb:='[]'::jsonb;
  v_one jsonb;
begin
  v_close:=public.powerhouse_close_matured_no_response_v1();
  select to_jsonb(h) into v_health from public.powerhouse_experiment_evidence_health_v1 h;
  begin
    v_truth:=public.powerhouse_market_truth_daily_v1((now() at time zone 'Europe/Amsterdam')::date);
  exception when others then
    v_truth:=jsonb_build_object('error',sqlerrm);
  end;
  begin
    v_environment:=public.powerhouse_refresh_environment_radar_v1('canonical');
  exception when others then
    v_environment:=jsonb_build_object('error',sqlerrm);
  end;
  for r in select experiment_key from public.powerhouse_experiment_policies where status='active' loop
    begin
      v_one:=public.powerhouse_promote_policy_if_proven_v1(r.experiment_key);
    exception when others then
      v_one:=jsonb_build_object('promoted',false,'experiment_key',r.experiment_key,'error',sqlerrm);
    end;
    v_promotions:=v_promotions||jsonb_build_array(v_one);
  end loop;
  return jsonb_build_object(
    'close',v_close,
    'health',v_health,
    'market_truth',v_truth,
    'environment_radar',v_environment,
    'promotion_checks',v_promotions,
    'ran_at',now()
  );
end
$$;

-- Prime only the deterministic baseline. No provider calls and no fabricated outcome/value.
select public.powerhouse_refresh_environment_radar_v1('canonical');
