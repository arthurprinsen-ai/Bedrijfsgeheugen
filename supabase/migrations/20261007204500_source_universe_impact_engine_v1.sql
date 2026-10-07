-- Source Universe + Company Impact Engine v1
-- Existing-state-first extension of the canonical evidence -> signal -> decision -> action -> outcome spine.
-- No parallel scheduler, CRM, learning store or business-action authority is introduced.

create table if not exists public.powerhouse_intelligence_domain_registry_v1 (
  domain_key text primary key,
  label text not null,
  pillar text not null,
  scope text not null check (scope in ('external','internal')),
  description text not null,
  default_signal_type text not null,
  default_action_type text not null,
  default_horizon_days integer not null check (default_horizon_days between 0 and 3650),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_intelligence_source_catalog_v1 (
  source_key text primary key,
  label text not null,
  publisher text not null,
  scope text not null check (scope in ('external','internal')),
  domain_keys text[] not null default '{}'::text[],
  source_kind text not null,
  authority_tier smallint not null check (authority_tier between 1 and 5),
  activation_mode text not null check (activation_mode in ('PUBLIC_ALWAYS','CONNECTOR_REQUIRED','PROVIDER_REQUIRED','MANUAL_EVIDENCE')),
  canonical_url text,
  adapter_key text,
  update_cadence interval,
  jurisdiction text,
  availability_state text not null default 'CATALOGUED'
    check (availability_state in ('CATALOGUED','AVAILABLE','CONNECTED','OBSERVED','LIVE','STALE','ERROR')),
  last_observed_at timestamptz,
  evidence_source_key text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_intelligence_signal_projection_v1 (
  tenant_id text not null default 'canonical',
  signal_key text not null,
  source_observation_id uuid,
  source_key text not null,
  external_event_id text,
  external_url text,
  domain_key text not null references public.powerhouse_intelligence_domain_registry_v1(domain_key),
  signal_type text not null,
  direction text not null default 'UNKNOWN' check (direction in ('UP','DOWN','MIXED','UNKNOWN')),
  title text not null,
  summary text,
  published_at timestamptz,
  observed_at timestamptz not null,
  deadline date,
  source_trust numeric,
  confirmation numeric,
  freshness numeric,
  relevance numeric,
  source_confidence numeric,
  probability numeric,
  magnitude numeric,
  exposure numeric,
  urgency numeric,
  reversibility numeric,
  signal_score numeric not null default 0 check (signal_score between 0 and 100),
  impact_score numeric check (impact_score is null or impact_score between 0 and 100),
  impact_status text not null default 'NEEDS_COMPANY_CONTEXT'
    check (impact_status in ('NEEDS_COMPANY_CONTEXT','PARTIAL','SCORED','DISMISSED')),
  estimated_value_eur numeric,
  estimated_loss_eur numeric,
  time_horizon_days integer,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','WATCH','ACTIONED','RESOLVED','DISMISSED')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (signal_key)
);


create table if not exists public.powerhouse_intelligence_signal_relation_v1 (
  tenant_id text not null default 'canonical',
  relation_key text not null,
  left_signal_key text not null references public.powerhouse_intelligence_signal_projection_v1(signal_key) on delete cascade,
  right_signal_key text not null references public.powerhouse_intelligence_signal_projection_v1(signal_key) on delete cascade,
  relation_type text not null
    check (relation_type in ('SHARED_DOMAIN','COMPANY_DEPENDENCY','CAUSAL_HYPOTHESIS')),
  confidence numeric check (confidence is null or confidence between 0 and 1),
  rationale text not null,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISMISSED','CONFIRMED')),
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,relation_key),
  check (left_signal_key<>right_signal_key)
);

comment on table public.powerhouse_intelligence_signal_relation_v1 is
  'Evidence-bounded relationships between signals. Automatic logic may assert shared-domain or shared-company-dependency relations; causal hypotheses require explicit evidence and are never inferred from co-occurrence alone.';

create table if not exists public.powerhouse_intelligence_company_impact_v1 (
  tenant_id text not null,
  impact_key text not null,
  signal_key text not null,
  target_node_key text,
  target_node_type text,
  target_label text,
  relevance numeric check (relevance is null or relevance between 0 and 1),
  probability numeric check (probability is null or probability between 0 and 1),
  magnitude numeric check (magnitude is null or magnitude between 0 and 1),
  urgency numeric check (urgency is null or urgency between 0 and 1),
  exposure numeric check (exposure is null or exposure between 0 and 1),
  source_confidence numeric check (source_confidence is null or source_confidence between 0 and 1),
  reversibility numeric check (reversibility is null or reversibility between 0 and 1),
  impact_score numeric check (impact_score is null or impact_score between 0 and 100),
  estimated_value_eur numeric,
  estimated_loss_eur numeric,
  impact_dimensions jsonb not null default '{}'::jsonb,
  rationale text,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'PARTIAL' check (status in ('PARTIAL','SCORED','ACTIONED','RESOLVED','DISMISSED')),
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,impact_key),
  foreign key (signal_key)
    references public.powerhouse_intelligence_signal_projection_v1(signal_key)
    on delete cascade
);

create table if not exists public.powerhouse_intelligence_action_candidate_v1 (
  tenant_id text not null,
  action_key text not null,
  signal_key text not null,
  impact_key text,
  domain_key text not null references public.powerhouse_intelligence_domain_registry_v1(domain_key),
  title text not null,
  rationale text not null,
  action_type text not null,
  priority_score numeric not null check (priority_score between 0 and 100),
  owner_hint text,
  due_at timestamptz,
  expected_value_eur numeric,
  estimated_loss_avoided_eur numeric,
  canonical_action_ref text,
  outcome_ref text,
  status text not null default 'CANDIDATE'
    check (status in ('CANDIDATE','READY','MATERIALIZED','DONE','DISMISSED')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,action_key),
  foreign key (signal_key)
    references public.powerhouse_intelligence_signal_projection_v1(signal_key)
    on delete cascade
);

create table if not exists public.powerhouse_intelligence_snapshot_v1 (
  tenant_id text primary key,
  refreshed_at timestamptz not null,
  catalog_source_count integer not null default 0,
  public_source_count integer not null default 0,
  connector_source_count integer not null default 0,
  domain_count integer not null default 0,
  observed_signal_count integer not null default 0,
  signals_24h integer not null default 0,
  signals_7d integer not null default 0,
  high_attention_count integer not null default 0,
  scored_impact_count integer not null default 0,
  action_candidate_count integer not null default 0,
  known_opportunity_value_eur numeric,
  known_risk_value_eur numeric,
  top_domains jsonb not null default '[]'::jsonb,
  source_health jsonb not null default '{}'::jsonb,
  status text not null check (status in ('CURRENT','PARTIAL','EMPTY')),
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.powerhouse_intelligence_domain_registry_v1 is
  'Canonical taxonomy for the external and internal company-intelligence universe. This is taxonomy, not evidence that a source is connected.';
comment on table public.powerhouse_intelligence_source_catalog_v1 is
  'Capability catalog of potential public/provider/internal sources. activation_mode distinguishes public sources from sources that require a customer connector.';
comment on table public.powerhouse_intelligence_signal_projection_v1 is
  'Derived explainable signal projection over canonical raw/evidence observations. Raw observations remain authoritative.';
comment on table public.powerhouse_intelligence_company_impact_v1 is
  'Company-context enrichment of signals. Financial impact remains NULL until supported by company exposure/evidence.';
comment on table public.powerhouse_intelligence_action_candidate_v1 is
  'Derived recommendation projection only. Canonical execution remains in the existing Brain/action/obligation authorities.';
comment on table public.powerhouse_intelligence_snapshot_v1 is
  'Tenant-scoped read model for Portal V2 environmental radar and daily change summary.';

create index if not exists powerhouse_intelligence_signal_projection_v1_rank_idx
  on public.powerhouse_intelligence_signal_projection_v1(tenant_id,signal_score desc,observed_at desc);
create index if not exists powerhouse_intelligence_signal_projection_v1_domain_idx
  on public.powerhouse_intelligence_signal_projection_v1(tenant_id,domain_key,observed_at desc);
create index if not exists powerhouse_intelligence_signal_relation_v1_rank_idx
  on public.powerhouse_intelligence_signal_relation_v1(tenant_id,confidence desc,observed_at desc);
create index if not exists powerhouse_intelligence_company_impact_v1_signal_idx
  on public.powerhouse_intelligence_company_impact_v1(tenant_id,signal_key,impact_score desc nulls last);
create index if not exists powerhouse_intelligence_action_candidate_v1_rank_idx
  on public.powerhouse_intelligence_action_candidate_v1(tenant_id,status,priority_score desc);
create index if not exists powerhouse_intelligence_source_catalog_v1_scope_idx
  on public.powerhouse_intelligence_source_catalog_v1(scope,activation_mode,active);

alter table public.powerhouse_intelligence_domain_registry_v1 enable row level security;
alter table public.powerhouse_intelligence_source_catalog_v1 enable row level security;
alter table public.powerhouse_intelligence_signal_projection_v1 enable row level security;
alter table public.powerhouse_intelligence_signal_relation_v1 enable row level security;
alter table public.powerhouse_intelligence_company_impact_v1 enable row level security;
alter table public.powerhouse_intelligence_action_candidate_v1 enable row level security;
alter table public.powerhouse_intelligence_snapshot_v1 enable row level security;

revoke all on table public.powerhouse_intelligence_domain_registry_v1 from public, anon, authenticated;
revoke all on table public.powerhouse_intelligence_source_catalog_v1 from public, anon, authenticated;
revoke all on table public.powerhouse_intelligence_signal_projection_v1 from public, anon, authenticated;
revoke all on table public.powerhouse_intelligence_signal_relation_v1 from public, anon, authenticated;
revoke all on table public.powerhouse_intelligence_company_impact_v1 from public, anon, authenticated;
revoke all on table public.powerhouse_intelligence_action_candidate_v1 from public, anon, authenticated;
revoke all on table public.powerhouse_intelligence_snapshot_v1 from public, anon, authenticated;

grant select,insert,update,delete on table public.powerhouse_intelligence_domain_registry_v1 to service_role;
grant select,insert,update,delete on table public.powerhouse_intelligence_source_catalog_v1 to service_role;
grant select,insert,update,delete on table public.powerhouse_intelligence_signal_projection_v1 to service_role;
grant select,insert,update,delete on table public.powerhouse_intelligence_signal_relation_v1 to service_role;
grant select,insert,update,delete on table public.powerhouse_intelligence_company_impact_v1 to service_role;
grant select,insert,update,delete on table public.powerhouse_intelligence_action_candidate_v1 to service_role;
grant select,insert,update,delete on table public.powerhouse_intelligence_snapshot_v1 to service_role;

insert into public.powerhouse_intelligence_domain_registry_v1
(domain_key,label,pillar,scope,description,default_signal_type,default_action_type,default_horizon_days)
values
('legal-regulation','Wet- & regelgeving','Regels & vertrouwen','external','Nieuwe of gewijzigde wetten, regels, toezicht, vergunningen en sectorspecifieke verplichtingen.','REGULATORY_CHANGE','COMPLIANCE_ASSESSMENT',90),
('cyber-threats','Cyberdreigingen','Regels & vertrouwen','external','Kwetsbaarheden, ransomware, supply-chain attacks, identity threats en advisories.','CYBER_RISK','SECURITY_ASSESSMENT',7),
('ai-technology','AI & technologie','Technologie','external','AI-modellen, agents, cloud, chips, software, APIs, data-platforms en technische doorbraken.','TECH_CHANGE','TECHNOLOGY_ASSESSMENT',30),
('competition','Concurrentie','Markt & klant','external','Nieuwe producten, prijzen, vacatures, campagnes, partnerships, managementwissels en investeringen van concurrenten.','COMPETITOR_MOVE','COMPETITIVE_RESPONSE',30),
('customer-market-behavior','Klant- & marktgedrag','Markt & klant','external','Vraag, zoekgedrag, reviews, koopintentie, prijsgevoeligheid, churn, voorkeuren en segmentverschuivingen.','DEMAND_CHANGE','COMMERCIAL_ASSESSMENT',14),
('macro-economy','Macro-economie','Economie & kapitaal','external','BBP, inflatie, producentenprijzen, vertrouwen, faillissementen, wisselkoersen en prognoses.','MACRO_CHANGE','FINANCIAL_SCENARIO',30),
('finance-capital','Financiering & kapitaal','Economie & kapitaal','external','Rente, kredietvoorwaarden, leasing, factoring, waarderingen, werkkapitaal en financieringsruimte.','CAPITAL_CHANGE','FINANCING_REVIEW',30),
('subsidies-tax','Subsidies & fiscale kansen','Economie & kapitaal','external','Subsidies, fiscale regelingen, fondsen, garanties en investeringssteun.','FUNDING_OPPORTUNITY','ELIGIBILITY_CHECK',30),
('labor-market','Arbeidsmarkt','Mensen','external','Vacatures, lonen, schaarste, instroom, uitstroom, beroepen, regio en freelancerprijzen.','LABOR_CHANGE','WORKFORCE_REVIEW',30),
('skills-capabilities','Skills & capabilities','Mensen','external','Nieuwe vaardigheden, certificeringen, opleidingen, AI literacy en veranderende beroepsprofielen.','SKILL_CHANGE','CAPABILITY_REVIEW',90),
('energy','Energie','Resources & keten','external','Elektriciteit, gas, olie, netcongestie, transporttarieven, aansluitingen en energiebelasting.','ENERGY_CHANGE','ENERGY_REVIEW',14),
('climate-physical-risk','Klimaat & fysieke risico’s','Resources & keten','external','Hitte, droogte, water, overstroming, storm, klimaatadaptatie en verzekerbaarheid.','PHYSICAL_RISK','CONTINUITY_REVIEW',30),
('commodities','Grondstoffen & commodities','Resources & keten','external','Metalen, plastics, hout, voedsel, chemicaliën, halfgeleiders en kritieke mineralen.','INPUT_COST_CHANGE','PROCUREMENT_REVIEW',14),
('supply-chain-logistics','Supply chain & logistiek','Resources & keten','external','Leveranciers, havens, vracht, levertijd, congestie, productie-uitval, stakingen en single-source dependencies.','SUPPLY_RISK','SUPPLY_CHAIN_REVIEW',14),
('geopolitics','Geopolitiek','Wereld & handel','external','Conflicten, sancties, verkiezingen, politieke stabiliteit, exportbeperkingen en landsrisico.','GEOPOLITICAL_CHANGE','EXPOSURE_REVIEW',14),
('international-trade','Internationale handel','Wereld & handel','external','Import/export, douane, handelsakkoorden, CBAM, tarieven en exportrestricties.','TRADE_CHANGE','TRADE_REVIEW',30),
('sustainability-esg','Duurzaamheid & ESG','Regels & vertrouwen','external','CSRD/ESRS, CO2, circulariteit, water, biodiversiteit, ketentransparantie en duurzaamheidsclaims.','ESG_CHANGE','SUSTAINABILITY_REVIEW',60),
('demography','Demografie','Maatschappij','external','Vergrijzing, huishoudens, migratie, opleiding, urbanisatie en regionale bevolkingsontwikkeling.','DEMOGRAPHIC_CHANGE','STRATEGY_REVIEW',180),
('social-cultural','Sociaal-culturele trends','Maatschappij','external','Werkhouding, thuiswerken, gezondheid, duurzaamheid, vertrouwen, privacyhouding en normen.','SOCIAL_CHANGE','STRATEGY_REVIEW',90),
('media-news','Media & nieuws','Markt & klant','external','Landelijke, regionale en vakmedia, nieuwsbrieven, podcasts en persberichten.','MEDIA_SIGNAL','REPUTATION_REVIEW',7),
('social-communities','Social media & communities','Markt & klant','external','Publieke conversaties op LinkedIn, Reddit, YouTube, fora en communities als vroeg signaal.','COMMUNITY_SIGNAL','MARKET_REVIEW',7),
('search-internet','Zoek- & internetgedrag','Markt & klant','external','Zoekvolume, SEO, nieuwe vragen, concurrentieverkeer, backlinks en digitale intentie.','SEARCH_DEMAND_CHANGE','DEMAND_REVIEW',14),
('pricing','Prijsinformatie','Markt & klant','external','Concurrentprijzen, leveranciersprijzen, marktprijzen, indexaties, catalogi en promoties.','PRICE_CHANGE','PRICING_REVIEW',14),
('real-estate-location','Vastgoed & locaties','Assets & locatie','external','Huur, koopprijzen, leegstand, bestemmingsplannen, bedrijfsterreinen, vergunningen en bereikbaarheid.','LOCATION_CHANGE','LOCATION_REVIEW',60),
('mobility','Mobiliteit','Assets & locatie','external','Brandstof, EV, infrastructuur, kilometerheffing, wagenpark en OV.','MOBILITY_CHANGE','MOBILITY_REVIEW',30),
('public-procurement','Publieke aanbestedingen','Markt & klant','external','TenderNed, TED en publieke inkoopkansen passend bij capabilities.','TENDER_OPPORTUNITY','TENDER_QUALIFICATION',14),
('business-registers','Bedrijfsregisters','Markt & klant','external','Oprichtingen, jaarrekeningen, bestuurderswissels, faillissementen, fusies en bedrijfsstatus.','COMPANY_EVENT','ACCOUNT_REVIEW',30),
('ma-investment','M&A & investeringsmarkt','Economie & kapitaal','external','Overnames, verkooptransacties, multiples, consolidatie, private equity en strategische kopers.','M_AND_A_CHANGE','STRATEGY_REVIEW',30),
('patents-ip','Patenten & intellectueel eigendom','Technologie','external','Octrooien, merken, technologieclusters en nieuwe IP-activiteit.','IP_CHANGE','INNOVATION_REVIEW',30),
('standards','Normen & standaarden','Regels & vertrouwen','external','ISO, NEN, CEN/CENELEC, branchecertificering, security- en interoperabiliteitsstandaarden.','STANDARD_CHANGE','CONTROL_REVIEW',60),
('reputation-trust','Reputatie & vertrouwen','Regels & vertrouwen','external','Reviews, klachten, media, rechtszaken, incidenten en recalls.','REPUTATION_CHANGE','REPUTATION_REVIEW',7),
('insurance','Verzekeringen','Economie & kapitaal','external','Premies, dekking, cyberverzekering, aansprakelijkheid, bedrijfsschade en acceptatievoorwaarden.','INSURANCE_CHANGE','INSURANCE_REVIEW',60),
('fraud-fincrime','Fraude & financiële criminaliteit','Regels & vertrouwen','external','Sanctielijsten, PEP, AML, identiteitsfraude, factuurfraude en verdachte leveranciers.','FRAUD_RISK','CONTROL_REVIEW',7),
('health-disruption','Gezondheid & maatschappelijke verstoringen','Maatschappij','external','Epidemieën, ziekteverzuim, zorgcapaciteit en verstoringen die workforce of keten kunnen raken.','DISRUPTION_RISK','CONTINUITY_REVIEW',14),
('local-environment','Lokale omgeving','Assets & locatie','external','Gemeente, provincie, vergunningen, bouwplannen, infrastructuur, lokale economie en arbeidsmarkt.','LOCAL_CHANGE','LOCAL_REVIEW',30),
('internal-finance','Financiën & cashflow','Binnen het bedrijf','internal','Boekhouding, omzet, marge, cashflow, debiteuren, crediteuren, budget en forecast.','INTERNAL_FINANCIAL_SIGNAL','FINANCIAL_ACTION',7),
('internal-customers-sales','Klanten & sales','Binnen het bedrijf','internal','CRM, pipeline, offertes, orders, klantwaarde, churn, behoeften en commerciële uitkomsten.','INTERNAL_CUSTOMER_SIGNAL','COMMERCIAL_ACTION',1),
('internal-people-hr','Mensen & HR','Binnen het bedrijf','internal','HRIS, capaciteit, verzuim, skills, verloop, engagement en workforce planning.','INTERNAL_PEOPLE_SIGNAL','WORKFORCE_ACTION',7),
('internal-operations','Processen & operatie','Binnen het bedrijf','internal','Proces-KPI’s, productie, voorraad, kwaliteit, doorlooptijden en operationele afwijkingen.','INTERNAL_OPERATION_SIGNAL','OPERATIONS_ACTION',1),
('internal-projects','Projecten & delivery','Binnen het bedrijf','internal','Portfolio, projecten, milestones, dependencies, issues, tijd, budget en delivery evidence.','INTERNAL_PROJECT_SIGNAL','DELIVERY_ACTION',1),
('internal-systems-data','Systemen & data','Binnen het bedrijf','internal','Applicaties, integraties, datakwaliteit, observability, security posture en technische afhankelijkheden.','INTERNAL_SYSTEM_SIGNAL','TECHNOLOGY_ACTION',1),
('internal-documents-knowledge','Documenten & kennis','Binnen het bedrijf','internal','Documenten, contracten, besluiten, procedures, e-mailcontext en bedrijfskennis.','INTERNAL_KNOWLEDGE_SIGNAL','KNOWLEDGE_ACTION',7),
('internal-suppliers-procurement','Leveranciers & inkoop','Binnen het bedrijf','internal','Leveranciers, contracten, inkoopprijzen, afhankelijkheden, kwaliteit en supplier performance.','INTERNAL_SUPPLIER_SIGNAL','PROCUREMENT_ACTION',7),
('internal-marketing-digital','Marketing & digitaal','Binnen het bedrijf','internal','Website, analytics, advertenties, content, SEO, campagnes, conversies en kanaalperformance.','INTERNAL_MARKETING_SIGNAL','MARKETING_ACTION',1),
('internal-service-quality','Service & kwaliteit','Binnen het bedrijf','internal','Helpdesk, klachten, NPS, SLA, servicekwaliteit, defecten en herstel.','INTERNAL_SERVICE_SIGNAL','SERVICE_ACTION',1)
on conflict (domain_key) do update set
  label=excluded.label,pillar=excluded.pillar,scope=excluded.scope,description=excluded.description,
  default_signal_type=excluded.default_signal_type,default_action_type=excluded.default_action_type,
  default_horizon_days=excluded.default_horizon_days,active=true,updated_at=now();

insert into public.powerhouse_intelligence_source_catalog_v1
(source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,metadata)
values
('eur-lex','EUR-Lex','European Union','external',array['legal-regulation','international-trade','sustainability-esg'],'official-law',5,'PUBLIC_ALWAYS','https://eur-lex.europa.eu/','web',interval '1 day','EU','{"official":true}'),
('eu-digital-strategy','European Commission Digital Strategy','European Commission','external',array['legal-regulation','ai-technology'],'official-policy',5,'PUBLIC_ALWAYS','https://digital-strategy.ec.europa.eu/','web',interval '1 day','EU','{"official":true}'),
('eu-ai-office','European AI Office','European Commission','external',array['legal-regulation','ai-technology'],'official-regulator',5,'PUBLIC_ALWAYS','https://digital-strategy.ec.europa.eu/en/policies/ai-office','web',interval '1 day','EU','{"official":true}'),
('autoriteit-persoonsgegevens','Autoriteit Persoonsgegevens','Autoriteit Persoonsgegevens','external',array['legal-regulation','reputation-trust'],'official-regulator',5,'PUBLIC_ALWAYS','https://autoriteitpersoonsgegevens.nl/','web',interval '1 day','NL','{"official":true}'),
('rijksoverheid','Rijksoverheid','Rijksoverheid','external',array['legal-regulation','labor-market','local-environment'],'official-government',5,'PUBLIC_ALWAYS','https://www.rijksoverheid.nl/','web',interval '1 day','NL','{"official":true}'),
('overheid-wetten','Wettenbank','Overheid.nl','external',array['legal-regulation'],'official-law',5,'PUBLIC_ALWAYS','https://wetten.overheid.nl/','web',interval '1 day','NL','{"official":true}'),
('acm','Autoriteit Consument & Markt','ACM','external',array['legal-regulation','competition','energy'],'official-regulator',5,'PUBLIC_ALWAYS','https://www.acm.nl/','web',interval '1 day','NL','{"official":true}'),
('ncsc-nl','NCSC Nederland','NCSC','external',array['cyber-threats'],'official-cyber',5,'PUBLIC_ALWAYS','https://www.ncsc.nl/','web',interval '6 hours','NL','{"official":true}'),
('enisa','ENISA','European Union Agency for Cybersecurity','external',array['cyber-threats','legal-regulation'],'official-cyber',5,'PUBLIC_ALWAYS','https://www.enisa.europa.eu/','web',interval '6 hours','EU','{"official":true}'),
('cisa-kev','CISA Known Exploited Vulnerabilities','CISA','external',array['cyber-threats'],'official-cyber',5,'PUBLIC_ALWAYS','https://www.cisa.gov/known-exploited-vulnerabilities-catalog','web',interval '6 hours','US','{"official":true}'),
('nvd','National Vulnerability Database','NIST','external',array['cyber-threats'],'official-cve',5,'PUBLIC_ALWAYS','https://nvd.nist.gov/','web',interval '6 hours','US','{"official":true}'),
('cbs','CBS','Centraal Bureau voor de Statistiek','external',array['macro-economy','labor-market','demography','customer-market-behavior'],'official-statistics',5,'PUBLIC_ALWAYS','https://www.cbs.nl/','existing-bronnen',interval '1 day','NL','{"official":true}'),
('dnb','De Nederlandsche Bank','DNB','external',array['macro-economy','finance-capital','insurance'],'official-central-bank',5,'PUBLIC_ALWAYS','https://www.dnb.nl/','existing-bronnen',interval '1 day','NL','{"official":true}'),
('ecb','European Central Bank','ECB','external',array['macro-economy','finance-capital'],'official-central-bank',5,'PUBLIC_ALWAYS','https://www.ecb.europa.eu/','web',interval '1 day','EU','{"official":true}'),
('eurostat','Eurostat','European Commission','external',array['macro-economy','labor-market','demography','international-trade'],'official-statistics',5,'PUBLIC_ALWAYS','https://ec.europa.eu/eurostat/','web',interval '1 day','EU','{"official":true}'),
('cpb','Centraal Planbureau','CPB','external',array['macro-economy','labor-market'],'official-research',5,'PUBLIC_ALWAYS','https://www.cpb.nl/','web',interval '1 day','NL','{"official":true}'),
('rvo','RVO','Rijksdienst voor Ondernemend Nederland','external',array['subsidies-tax','energy','sustainability-esg','international-trade'],'official-government',5,'PUBLIC_ALWAYS','https://www.rvo.nl/','existing-bronnen',interval '1 day','NL','{"official":true}'),
('belastingdienst','Belastingdienst','Belastingdienst','external',array['subsidies-tax','finance-capital'],'official-government',5,'PUBLIC_ALWAYS','https://www.belastingdienst.nl/','web',interval '1 day','NL','{"official":true}'),
('uwv','UWV Arbeidsmarktinformatie','UWV','external',array['labor-market','skills-capabilities'],'official-labor',5,'PUBLIC_ALWAYS','https://www.uwv.nl/nl/arbeidsmarktinformatie','existing-bronnen',interval '1 day','NL','{"official":true}'),
('ser','Sociaal-Economische Raad','SER','external',array['labor-market','skills-capabilities','social-cultural'],'official-advisory',4,'PUBLIC_ALWAYS','https://www.ser.nl/','web',interval '7 days','NL','{"official":true}'),
('tennet','TenneT','TenneT','external',array['energy','supply-chain-logistics'],'grid-operator',5,'PUBLIC_ALWAYS','https://www.tennet.eu/','web',interval '6 hours','NL/EU','{"official":true}'),
('gasunie','Gasunie','Gasunie','external',array['energy'],'grid-operator',5,'PUBLIC_ALWAYS','https://www.gasunie.nl/','web',interval '6 hours','NL/EU','{"official":true}'),
('entsoe','ENTSO-E Transparency Platform','ENTSO-E','external',array['energy'],'energy-data',5,'PUBLIC_ALWAYS','https://transparency.entsoe.eu/','web',interval '1 hour','EU','{"official":true}'),
('knmi','KNMI','KNMI','external',array['climate-physical-risk','health-disruption'],'official-weather',5,'PUBLIC_ALWAYS','https://www.knmi.nl/','web',interval '1 hour','NL','{"official":true}'),
('pbl','Planbureau voor de Leefomgeving','PBL','external',array['climate-physical-risk','sustainability-esg','energy'],'official-research',5,'PUBLIC_ALWAYS','https://www.pbl.nl/','web',interval '7 days','NL','{"official":true}'),
('iea','International Energy Agency','IEA','external',array['energy','commodities','climate-physical-risk'],'intergovernmental',5,'PUBLIC_ALWAYS','https://www.iea.org/','web',interval '1 day','Global','{"official":true}'),
('lme','London Metal Exchange','LME','external',array['commodities'],'market-data',4,'PROVIDER_REQUIRED','https://www.lme.com/','provider',interval '1 day','Global','{"official":false}'),
('port-rotterdam','Port of Rotterdam','Port of Rotterdam Authority','external',array['supply-chain-logistics','international-trade'],'port-data',4,'PUBLIC_ALWAYS','https://www.portofrotterdam.com/','web',interval '6 hours','NL/EU','{"official":true}'),
('wto','World Trade Organization','WTO','external',array['international-trade','geopolitics'],'intergovernmental',5,'PUBLIC_ALWAYS','https://www.wto.org/','web',interval '1 day','Global','{"official":true}'),
('eu-sanctions','EU Sanctions Map','European Union','external',array['geopolitics','fraud-fincrime','international-trade'],'official-sanctions',5,'PUBLIC_ALWAYS','https://www.sanctionsmap.eu/','web',interval '6 hours','EU','{"official":true}'),
('world-bank','World Bank','World Bank','external',array['macro-economy','geopolitics','demography'],'intergovernmental',5,'PUBLIC_ALWAYS','https://www.worldbank.org/','web',interval '1 day','Global','{"official":true}'),
('oecd','OECD','OECD','external',array['macro-economy','skills-capabilities','social-cultural'],'intergovernmental',5,'PUBLIC_ALWAYS','https://www.oecd.org/','web',interval '1 day','Global','{"official":true}'),
('tenderned','TenderNed','PIANOo','external',array['public-procurement'],'official-procurement',5,'PUBLIC_ALWAYS','https://www.tenderned.nl/','web',interval '6 hours','NL','{"official":true}'),
('ted-europa','TED Europa','European Union','external',array['public-procurement'],'official-procurement',5,'PUBLIC_ALWAYS','https://ted.europa.eu/','web',interval '6 hours','EU','{"official":true}'),
('kvk','KVK Handelsregister','Kamer van Koophandel','external',array['business-registers','competition','ma-investment'],'official-register',5,'PROVIDER_REQUIRED','https://www.kvk.nl/handelsregister/','provider',interval '1 day','NL','{"official":true}'),
('insolventies-rechtspraak','Centraal Insolventieregister','Rechtspraak','external',array['business-registers','reputation-trust'],'official-register',5,'PUBLIC_ALWAYS','https://insolventies.rechtspraak.nl/','web',interval '1 day','NL','{"official":true}'),
('epo','European Patent Office','EPO','external',array['patents-ip','ai-technology','competition'],'official-ip',5,'PUBLIC_ALWAYS','https://www.epo.org/','web',interval '1 day','EU','{"official":true}'),
('wipo','WIPO','World Intellectual Property Organization','external',array['patents-ip'],'official-ip',5,'PUBLIC_ALWAYS','https://www.wipo.int/','web',interval '1 day','Global','{"official":true}'),
('euipo','EUIPO','European Union Intellectual Property Office','external',array['patents-ip'],'official-ip',5,'PUBLIC_ALWAYS','https://www.euipo.europa.eu/','web',interval '1 day','EU','{"official":true}'),
('nen','NEN','NEN','external',array['standards'],'standards-body',5,'PUBLIC_ALWAYS','https://www.nen.nl/','web',interval '7 days','NL','{"official":true}'),
('iso','ISO','International Organization for Standardization','external',array['standards'],'standards-body',5,'PUBLIC_ALWAYS','https://www.iso.org/','web',interval '7 days','Global','{"official":true}'),
('afm','Autoriteit Financiële Markten','AFM','external',array['finance-capital','fraud-fincrime','reputation-trust'],'official-regulator',5,'PUBLIC_ALWAYS','https://www.afm.nl/','web',interval '1 day','NL','{"official":true}'),
('fiunederland','FIU-Nederland','FIU-Nederland','external',array['fraud-fincrime'],'official-fincrime',5,'PUBLIC_ALWAYS','https://www.fiu-nederland.nl/','web',interval '1 day','NL','{"official":true}'),
('rivm','RIVM','RIVM','external',array['health-disruption','climate-physical-risk'],'official-health',5,'PUBLIC_ALWAYS','https://www.rivm.nl/','web',interval '1 day','NL','{"official":true}'),
('kadaster','Kadaster','Kadaster','external',array['real-estate-location','local-environment'],'official-register',5,'PROVIDER_REQUIRED','https://www.kadaster.nl/','provider',interval '7 days','NL','{"official":true}'),
('rdw','RDW','RDW','external',array['mobility'],'official-register',5,'PUBLIC_ALWAYS','https://www.rdw.nl/','web',interval '7 days','NL','{"official":true}'),
('google-trends','Google Trends','Google','external',array['search-internet','customer-market-behavior'],'search-demand',3,'PROVIDER_REQUIRED','https://trends.google.com/','provider',interval '1 day','Global','{"official":false}'),
('dataforseo','DataForSEO','DataForSEO','external',array['search-internet','competition','pricing'],'search-provider',3,'PROVIDER_REQUIRED','https://dataforseo.com/','dataforseo',interval '1 day','Global','{"official":false}'),
('tavily','Tavily','Tavily','external',array['media-news','competition','ai-technology','customer-market-behavior'],'web-intelligence',2,'PROVIDER_REQUIRED','https://www.tavily.com/','tavily',interval '6 hours','Global','{"official":false,"role":"discovery_not_authority"}'),
('github-trends','GitHub','GitHub','external',array['ai-technology','cyber-threats'],'developer-signal',2,'PROVIDER_REQUIRED','https://github.com/','github',interval '1 day','Global','{"official":false,"role":"early_signal"}'),
('arxiv','arXiv','Cornell University','external',array['ai-technology'],'research-signal',3,'PUBLIC_ALWAYS','https://arxiv.org/','web',interval '1 day','Global','{"official":false,"role":"research_preprint"}'),
('linkedin-public','LinkedIn public signals','LinkedIn','external',array['competition','labor-market','social-communities'],'social-signal',2,'PROVIDER_REQUIRED','https://www.linkedin.com/','linkedin',interval '1 day','Global','{"official":false,"role":"early_signal"}'),
('reddit-public','Reddit public communities','Reddit','external',array['social-communities','customer-market-behavior','reputation-trust'],'community-signal',1,'PROVIDER_REQUIRED','https://www.reddit.com/','provider',interval '1 day','Global','{"official":false,"role":"weak_signal"}'),
('news-general','General public news','Multiple publishers','external',array['media-news','geopolitics','competition'],'news-discovery',2,'PROVIDER_REQUIRED',null,'tavily',interval '6 hours','Global','{"official":false,"role":"discovery"}'),
('reviews-public','Public reviews','Multiple platforms','external',array['reputation-trust','customer-market-behavior'],'review-signal',2,'PROVIDER_REQUIRED',null,'provider',interval '1 day','Global','{"official":false,"role":"market_signal"}'),
('crm','CRM','Customer CRM','internal',array['internal-customers-sales'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('erp','ERP','Customer ERP','internal',array['internal-finance','internal-operations','internal-suppliers-procurement'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('accounting','Boekhouding','Customer accounting system','internal',array['internal-finance'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('hris','HR-systeem','Customer HRIS','internal',array['internal-people-hr'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '6 hours',null,'{"connected_truth_required":true}'),
('project-management','Projectmanagement','Customer project system','internal',array['internal-projects'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('helpdesk','Helpdesk / service','Customer service system','internal',array['internal-service-quality','internal-customers-sales'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('production-operations','Productie / operatie','Customer operations system','internal',array['internal-operations'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('inventory','Voorraad','Customer inventory system','internal',array['internal-operations','internal-suppliers-procurement'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('contracts','Contracten','Customer contract repository','internal',array['internal-documents-knowledge','internal-suppliers-procurement'],'document-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '6 hours',null,'{"connected_truth_required":true}'),
('email','E-mail','Customer mail system','internal',array['internal-documents-knowledge','internal-customers-sales'],'communication-system',4,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('calendar','Agenda','Customer calendar','internal',array['internal-projects','internal-customers-sales'],'communication-system',4,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('documents','Documenten','Customer document system','internal',array['internal-documents-knowledge'],'document-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '6 hours',null,'{"connected_truth_required":true}'),
('web-analytics','Webanalytics','Customer analytics','internal',array['internal-marketing-digital','internal-customers-sales'],'analytics-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('advertising','Advertenties','Customer ad platforms','internal',array['internal-marketing-digital'],'marketing-system',4,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('sales-pipeline','Salespipeline','Customer sales system','internal',array['internal-customers-sales'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('payments','Betalingen','Customer payment system','internal',array['internal-finance','internal-customers-sales'],'finance-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}'),
('procurement','Inkoop','Customer procurement system','internal',array['internal-suppliers-procurement','internal-finance'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '6 hours',null,'{"connected_truth_required":true}'),
('supplier-master','Leveranciers','Customer supplier system','internal',array['internal-suppliers-procurement'],'business-system',5,'CONNECTOR_REQUIRED',null,'connector:auto',interval '6 hours',null,'{"connected_truth_required":true}'),
('customer-feedback','Klantfeedback','Customer feedback/review system','internal',array['internal-service-quality','internal-customers-sales'],'feedback-system',4,'CONNECTOR_REQUIRED',null,'connector:auto',interval '1 hour',null,'{"connected_truth_required":true}')
on conflict (source_key) do update set
  label=excluded.label,publisher=excluded.publisher,scope=excluded.scope,domain_keys=excluded.domain_keys,
  source_kind=excluded.source_kind,authority_tier=excluded.authority_tier,activation_mode=excluded.activation_mode,
  canonical_url=excluded.canonical_url,adapter_key=excluded.adapter_key,update_cadence=excluded.update_cadence,
  jurisdiction=excluded.jurisdiction,metadata=excluded.metadata,active=true,updated_at=now();

update public.powerhouse_intelligence_source_catalog_v1
set availability_state=case when activation_mode='PUBLIC_ALWAYS' then 'AVAILABLE' else 'CATALOGUED' end,
    evidence_source_key=case source_key
      when 'tavily' then 'tavily-intelligence'
      when 'dataforseo' then 'dataforseo-intelligence'
      when 'linkedin-public' then 'linkedin'
      when 'github-trends' then 'github-delivery'
      else evidence_source_key
    end,
    updated_at=now()
where active=true;

-- Additional explicit source capabilities consolidated from the earlier expansion draft.
-- These remain catalog capabilities; connector/provider evidence is still required before live claims.
insert into public.powerhouse_intelligence_source_catalog_v1
(source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,metadata)
values
('iso','ISO standards','ISO','external',array['standards'],'standards-body',5,'PUBLIC_ALWAYS','https://www.iso.org/standards.html','web',interval '7 days','GLOBAL','{"official":true}'),
('nen','NEN standards','NEN','external',array['standards'],'standards-body',5,'PUBLIC_ALWAYS','https://www.nen.nl/','web',interval '7 days','NL','{"official":true}'),
('cencenelec','European standards','CEN-CENELEC','external',array['standards'],'standards-body',5,'PUBLIC_ALWAYS','https://www.cencenelec.eu/','web',interval '7 days','EU','{"official":true}'),
('pbl','Planbureau voor de Leefomgeving','PBL','external',array['energy','climate-physical-risk','sustainability-esg','local-environment'],'official-research',5,'PUBLIC_ALWAYS','https://www.pbl.nl/','web',interval '7 days','NL','{"official":true}'),
('rivm','RIVM','RIVM','external',array['health-disruption','climate-physical-risk'],'health-authority',5,'PUBLIC_ALWAYS','https://www.rivm.nl/','web',interval '6 hours','NL','{"official":true}'),
('who','World Health Organization','WHO','external',array['health-disruption'],'health-authority',5,'PUBLIC_ALWAYS','https://www.who.int/','web',interval '6 hours','GLOBAL','{"official":true}'),
('iea','International Energy Agency','IEA','external',array['energy','geopolitics'],'energy-authority',5,'PUBLIC_ALWAYS','https://www.iea.org/','web',interval '1 day','GLOBAL','{"official":true}'),
('entsoe','ENTSO-E Transparency Platform','ENTSO-E','external',array['energy'],'grid-data',4,'PUBLIC_ALWAYS','https://transparency.entsoe.eu/','web',interval '1 hour','EU','{"primary":true}'),
('world-bank','World Bank','World Bank','external',array['macro-economy','finance-capital','demography'],'multilateral-data',5,'PUBLIC_ALWAYS','https://www.worldbank.org/','web',interval '1 day','GLOBAL','{"official":true}'),
('oecd','OECD','OECD','external',array['macro-economy','labor-market','skills-capabilities'],'multilateral-data',5,'PUBLIC_ALWAYS','https://www.oecd.org/','web',interval '1 day','GLOBAL','{"official":true}'),
('wto','World Trade Organization','WTO','external',array['international-trade','geopolitics'],'trade-authority',5,'PUBLIC_ALWAYS','https://www.wto.org/','web',interval '1 day','GLOBAL','{"official":true}'),
('un-comtrade','UN Comtrade','United Nations','external',array['international-trade'],'trade-data',5,'PUBLIC_ALWAYS','https://comtradeplus.un.org/','web',interval '1 day','GLOBAL','{"official":true}'),
('fiu-nl','FIU-Nederland','FIU-Nederland','external',array['fraud-fincrime'],'financial-crime-authority',5,'PUBLIC_ALWAYS','https://www.fiu-nederland.nl/','web',interval '1 day','NL','{"official":true}'),
('eu-sanctions-map','EU Sanctions Map','European Union','external',array['fraud-fincrime','geopolitics','international-trade'],'sanctions',5,'PUBLIC_ALWAYS','https://www.sanctionsmap.eu/','web',interval '6 hours','EU','{"official":true}'),
('kadaster','Kadaster','Kadaster','external',array['real-estate-location','local-environment'],'register',5,'PUBLIC_ALWAYS','https://www.kadaster.nl/','web',interval '7 days','NL','{"official":true}'),
('rdw','RDW','RDW','external',array['mobility'],'mobility-register',5,'PUBLIC_ALWAYS','https://www.rdw.nl/','web',interval '7 days','NL','{"official":true}'),
('rws','Rijkswaterstaat','Rijkswaterstaat','external',array['mobility','supply-chain-logistics','climate-physical-risk'],'infrastructure',5,'PUBLIC_ALWAYS','https://www.rijkswaterstaat.nl/','web',interval '1 hour','NL','{"official":true}'),
('cbs-demography','CBS bevolking & demografie','CBS','external',array['demography','social-cultural','labor-market'],'statistics',5,'PUBLIC_ALWAYS','https://www.cbs.nl/nl-nl/maatschappij/bevolking','web',interval '1 day','NL','{"official":true}'),
('scp','Sociaal en Cultureel Planbureau','SCP','external',array['social-cultural','demography'],'social-research',5,'PUBLIC_ALWAYS','https://www.scp.nl/','web',interval '7 days','NL','{"official":true}'),
('official-press','Official press releases','Government + regulators','external',array['media-news','legal-regulation','geopolitics'],'official-press',5,'PROVIDER_REQUIRED',null,'search',interval '1 hour','NL/EU','{"authority_filter_required":true}'),
('sector-media','Vakmedia','Sector publishers','external',array['media-news','competition','customer-market-behavior'],'trade-media',3,'PROVIDER_REQUIRED',null,'search',interval '6 hours','NL/EU','{"specialist":true}'),
('linkedin-public-signals','LinkedIn public signals','LinkedIn','external',array['social-communities','competition','labor-market'],'professional-network',2,'CONNECTOR_REQUIRED','https://www.linkedin.com/','linkedin',interval '6 hours','GLOBAL','{"community_signal":true}'),
('youtube-public-signals','YouTube public signals','YouTube','external',array['social-communities','customer-market-behavior','ai-technology'],'video-community',2,'PROVIDER_REQUIRED','https://www.youtube.com/','search',interval '6 hours','GLOBAL','{"community_signal":true}'),
('reddit-public-signals','Reddit public signals','Reddit','external',array['social-communities','customer-market-behavior'],'community',2,'PROVIDER_REQUIRED','https://www.reddit.com/','search',interval '6 hours','GLOBAL','{"community_signal":true,"authority":false}'),
('search-demand','Search demand','Search providers','external',array['search-internet','customer-market-behavior'],'search-demand',3,'PROVIDER_REQUIRED',null,'search-provider',interval '6 hours','GLOBAL','{"provider_evidence_required":true}'),
('serp-competition','SERP & competitor visibility','Search providers','external',array['search-internet','competition'],'serp',3,'PROVIDER_REQUIRED',null,'search-provider',interval '6 hours','GLOBAL','{"provider_evidence_required":true}'),
('price-monitoring','Market & competitor pricing','Public web + providers','external',array['pricing','competition','supply-chain-logistics'],'price-monitoring',3,'PROVIDER_REQUIRED',null,'search',interval '6 hours','GLOBAL','{"provider_evidence_required":true}'),
('insurance-market','Insurance market','Insurers + regulators','external',array['insurance','finance-capital'],'insurance-market',3,'PROVIDER_REQUIRED',null,'search',interval '7 days','NL/EU','{"specialist":true}'),
('ma-deals','M&A and investment activity','Public registers + press','external',array['ma-investment','business-registers'],'deal-intelligence',3,'PROVIDER_REQUIRED',null,'search',interval '1 day','NL/EU','{"provider_evidence_required":true}'),
('company-registers','Company registers','Official registers','external',array['business-registers','ma-investment'],'company-register',5,'PROVIDER_REQUIRED',null,'company-register-provider',interval '1 day','NL/EU','{"official_or_licensed_provider_required":true}'),

('afas','AFAS','AFAS','internal',array['internal-finance','internal-people-hr','internal-customers-sales'],'erp-hr-finance',5,'CONNECTOR_REQUIRED','https://www.afas.nl/','connector:afas',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('sap','SAP','SAP','internal',array['internal-operations','internal-finance','internal-suppliers-procurement'],'erp',5,'CONNECTOR_REQUIRED','https://www.sap.com/','connector:sap',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('dynamics365','Dynamics 365','Microsoft','internal',array['internal-customers-sales','internal-finance','internal-service-quality'],'crm-erp',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/en-us/dynamics-365','connector:dynamics365',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('exact','Exact','Exact','internal',array['internal-finance','internal-operations'],'accounting',5,'CONNECTOR_REQUIRED','https://www.exact.com/','connector:exact',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('topdesk','TOPdesk','TOPdesk','internal',array['internal-service-quality','internal-systems-data'],'service-management',5,'CONNECTOR_REQUIRED','https://www.topdesk.com/','connector:topdesk',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('salesforce','Salesforce','Salesforce','internal',array['internal-customers-sales','internal-service-quality'],'crm',5,'CONNECTOR_REQUIRED','https://www.salesforce.com/','connector:salesforce',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('hubspot','HubSpot','HubSpot','internal',array['internal-customers-sales','internal-marketing-digital'],'crm-marketing',5,'CONNECTOR_REQUIRED','https://www.hubspot.com/','connector:hubspot',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('power-bi','Power BI','Microsoft','internal',array['internal-systems-data'],'bi',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/en-us/power-platform/products/power-bi','connector:power-bi',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('microsoft-fabric','Microsoft Fabric','Microsoft','internal',array['internal-systems-data'],'data-platform',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/en-us/microsoft-fabric','connector:microsoft-fabric',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('snowflake','Snowflake','Snowflake','internal',array['internal-systems-data'],'data-platform',5,'CONNECTOR_REQUIRED','https://www.snowflake.com/','connector:snowflake',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('databricks','Databricks','Databricks','internal',array['internal-systems-data'],'data-platform',5,'CONNECTOR_REQUIRED','https://www.databricks.com/','connector:databricks',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('bigquery','BigQuery','Google Cloud','internal',array['internal-systems-data'],'data-platform',5,'CONNECTOR_REQUIRED','https://cloud.google.com/bigquery','connector:bigquery',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('azure-data-factory','Azure Data Factory','Microsoft Azure','internal',array['internal-systems-data'],'integration',5,'CONNECTOR_REQUIRED','https://azure.microsoft.com/en-us/products/data-factory','connector:azure-data-factory',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('sharepoint-onedrive','SharePoint & OneDrive','Microsoft','internal',array['internal-documents-knowledge'],'documents',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/en-us/microsoft-365/sharepoint/collaboration','connector:sharepoint-onedrive',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('google-drive','Google Drive','Google','internal',array['internal-documents-knowledge'],'documents',5,'CONNECTOR_REQUIRED','https://drive.google.com/','connector:google-drive',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('notion','Notion','Notion','internal',array['internal-documents-knowledge'],'knowledge',5,'CONNECTOR_REQUIRED','https://www.notion.so/','connector:notion',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('gmail','Gmail','Google','internal',array['internal-documents-knowledge','internal-customers-sales'],'email',5,'CONNECTOR_REQUIRED','https://mail.google.com/','connector:gmail',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('google-calendar','Google Calendar','Google','internal',array['internal-projects','internal-customers-sales'],'calendar',5,'CONNECTOR_REQUIRED','https://calendar.google.com/','connector:google-calendar',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('microsoft-teams','Microsoft Teams','Microsoft','internal',array['internal-documents-knowledge','internal-projects'],'collaboration',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/en-us/microsoft-teams/group-chat-software','connector:microsoft-teams',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('slack','Slack','Slack','internal',array['internal-documents-knowledge','internal-projects'],'collaboration',5,'CONNECTOR_REQUIRED','https://slack.com/','connector:slack',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('jira','Jira','Atlassian','internal',array['internal-projects'],'work-management',5,'CONNECTOR_REQUIRED','https://www.atlassian.com/software/jira','connector:jira',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('asana','Asana','Asana','internal',array['internal-projects'],'work-management',5,'CONNECTOR_REQUIRED','https://asana.com/','connector:asana',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('monday','monday.com','monday.com','internal',array['internal-projects'],'work-management',5,'CONNECTOR_REQUIRED','https://monday.com/','connector:monday',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('stripe','Stripe','Stripe','internal',array['internal-finance','internal-customers-sales'],'payments',5,'CONNECTOR_REQUIRED','https://stripe.com/','connector:stripe',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('banking-open-banking','Bank & open-banking feeds','Banks / PSD2 providers','internal',array['internal-finance'],'banking',5,'CONNECTOR_REQUIRED',null,'connector:banking',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('shopify','Shopify','Shopify','internal',array['internal-customers-sales','internal-operations'],'commerce',5,'CONNECTOR_REQUIRED','https://www.shopify.com/','connector:shopify',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('google-ads','Google Ads','Google','internal',array['internal-marketing-digital'],'advertising',5,'CONNECTOR_REQUIRED','https://ads.google.com/','connector:google-ads',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('meta-ads','Meta Ads','Meta','internal',array['internal-marketing-digital'],'advertising',5,'CONNECTOR_REQUIRED','https://www.facebook.com/business/ads','connector:meta-ads',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('search-console','Google Search Console','Google','internal',array['internal-marketing-digital'],'owned-search',5,'CONNECTOR_REQUIRED','https://search.google.com/search-console/','connector:search-console',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('analytics','Web analytics','Google / Adobe / others','internal',array['internal-marketing-digital','internal-customers-sales'],'owned-analytics',5,'CONNECTOR_REQUIRED',null,'connector:analytics',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('supplier-master-internal','Supplier master & contracts','Customer systems','internal',array['internal-suppliers-procurement','internal-finance'],'supplier-master',5,'CONNECTOR_REQUIRED',null,'connector:supplier-master',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('inventory-internal','Inventory & warehouse','Customer systems','internal',array['internal-operations','internal-finance'],'inventory',5,'CONNECTOR_REQUIRED',null,'connector:inventory',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('production-internal','Production / MES / operations','Customer systems','internal',array['internal-operations'],'production',5,'CONNECTOR_REQUIRED',null,'connector:production',interval '1 hour','TENANT','{"connected_truth_required":true}'),
('customer-feedback-internal','Customer feedback / NPS / complaints','Customer systems','internal',array['internal-service-quality','internal-customers-sales'],'feedback-system',5,'CONNECTOR_REQUIRED',null,'connector:customer-feedback',interval '1 hour','TENANT','{"connected_truth_required":true}')
on conflict (source_key) do update set
  label=excluded.label,publisher=excluded.publisher,scope=excluded.scope,domain_keys=excluded.domain_keys,
  source_kind=excluded.source_kind,authority_tier=excluded.authority_tier,activation_mode=excluded.activation_mode,
  canonical_url=excluded.canonical_url,adapter_key=excluded.adapter_key,update_cadence=excluded.update_cadence,
  jurisdiction=excluded.jurisdiction,metadata=excluded.metadata,active=true,updated_at=now();

-- Expand the existing Tavily topic authority rather than creating a second external crawler.
insert into public.bg_signaal_onderwerpen(onderwerp,zoekvraag,actief,toegevoegd_op,segmenten,contentpijler)
values
('Wet- en regelgeving','nieuwe gewijzigde wetgeving regelgeving Nederland EU ondernemers AI privacy NIS2 Data Act arbeidsrecht belasting',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Cyberdreigingen','actuele cyberdreigingen kwetsbaarheden ransomware supply chain identity Nederland EU NCSC ENISA',true,now(),array['mkb','algemeen'],'external-intelligence'),
('AI en technologie','nieuwe AI modellen agents technologie cloud data software releases bedrijven Europa Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Concurrentie','concurrenten nieuwe producten prijzen vacatures partnerships overnames campagnes Nederlandse bedrijven sector',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Klant- en marktgedrag','veranderend klantgedrag vraag koopintentie prijsgevoeligheid reviews markttrends Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Macro-economie','Nederland economie inflatie producentenprijzen vertrouwen faillissementen groei prognose CBS DNB ECB',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Financiering en kapitaal','rente kredietvoorwaarden bedrijfsfinanciering leasing factoring werkkapitaal ECB DNB Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Subsidies en fiscale kansen','nieuwe subsidies regelingen WBSO RVO fondsen garanties fiscaliteit ondernemers Nederland EU',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Arbeidsmarkt','arbeidsmarkt personeel vacatures lonen schaarste beroepen skills UWV CBS Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Skills en capabilities','skills vaardigheden opleidingen certificeringen AI literacy management arbeidsmarkt Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Energie','energieprijzen elektriciteit gas netcongestie transporttarieven aansluitingen Nederland TenneT ACM',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Klimaat en fysieke risico’s','klimaat hitte droogte overstroming storm water verzekerbaarheid bedrijven Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Grondstoffen en commodities','grondstofprijzen metalen plastics hout voedsel chemicalien chips kritieke mineralen Europa',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Supply chain en logistiek','supply chain logistiek vracht havens levertijden stakingen congestie leveranciers Europa Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Geopolitiek','geopolitiek sancties oorlog verkiezingen handelsconflicten exportbeperkingen Europa bedrijven',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Internationale handel','import export douane tarieven handelsakkoorden CBAM exportrestricties EU Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Duurzaamheid en ESG','CSRD ESRS duurzaamheid CO2 circulariteit water biodiversiteit verpakkingen ketentransparantie EU',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Demografie','demografie vergrijzing huishoudens migratie opleiding urbanisatie regio Nederland CBS',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Sociaal-culturele trends','consumentengedrag werkhouding thuiswerken privacy duurzaamheid vertrouwen maatschappelijke trends Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Media en nieuws','zakelijk nieuws Nederland bedrijven sector economie technologie regelgeving ondernemers',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Social media en communities','LinkedIn Reddit YouTube communities trends ondernemers klanten bedrijven Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Zoek- en internetgedrag','Google Trends zoekvolume SEO zoekvragen digitale vraag markt Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Prijsinformatie','prijsverhogingen concurrentprijzen leveranciersprijzen marktprijzen indexaties Nederland bedrijven',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Vastgoed en locaties','bedrijfsvastgoed huur leegstand bestemmingsplan bedrijventerrein vergunning bereikbaarheid Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Mobiliteit','mobiliteit EV brandstof infrastructuur kilometerheffing wagenpark Nederland bedrijven',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Publieke aanbestedingen','TenderNed TED aanbesteding opdracht digitalisering data AI advies Nederland EU',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Bedrijfsregisters','bedrijven oprichting jaarrekening bestuurder faillissement fusie overname Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('M&A en investeringsmarkt','overnames M&A private equity venture capital waarderingen consolidatie Nederlandse bedrijven',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Patenten en intellectueel eigendom','patenten octrooien merken EPO WIPO EUIPO technologie innovatie Europa',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Normen en standaarden','ISO NEN CEN norm standaard certificering security AI management systemen',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Reputatie en vertrouwen','reviews klachten reputatie recalls rechtszaken incidenten bedrijven Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Verzekeringen','verzekeringspremies cyberverzekering aansprakelijkheid bedrijfsschade acceptatie bedrijven Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Fraude en financiële criminaliteit','fraude AML sancties PEP identiteitsfraude factuurfraude leveranciers Nederland EU',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Gezondheid en maatschappelijke verstoringen','epidemie ziekteverzuim zorgcapaciteit maatschappelijke verstoring workforce supply chain Nederland',true,now(),array['mkb','algemeen'],'external-intelligence'),
('Lokale omgeving','gemeente provincie vergunning bouwplan infrastructuur lokale economie arbeidsmarkt bedrijventerrein Nederland',true,now(),array['mkb','algemeen'],'external-intelligence')
on conflict (onderwerp) do update set
  zoekvraag=excluded.zoekvraag,actief=true,segmenten=excluded.segmenten,contentpijler=excluded.contentpijler;


insert into public.powerhouse_intelligence_source_catalog_v1
(source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,metadata)
values
('supabase-internal','Supabase','Supabase','internal',array['internal-systems-data'],'data-platform',5,'CONNECTOR_REQUIRED','https://supabase.com/','supabase',interval '1 hour','Global','{"capability_only":true}'),
('github-internal','GitHub repositories & delivery','GitHub','internal',array['internal-systems-data','internal-projects','internal-documents-knowledge'],'engineering-platform',5,'CONNECTOR_REQUIRED','https://github.com/','github',interval '1 hour','Global','{"capability_only":true}'),
('netlify-internal','Netlify','Netlify','internal',array['internal-systems-data','internal-marketing-digital'],'deployment-platform',5,'CONNECTOR_REQUIRED','https://www.netlify.com/','netlify',interval '1 hour','Global','{"capability_only":true}'),
('notion-internal','Notion','Notion','internal',array['internal-documents-knowledge','internal-projects'],'knowledge-platform',5,'CONNECTOR_REQUIRED','https://www.notion.so/','notion',interval '1 hour','Global','{"capability_only":true}'),
('google-drive-internal','Google Drive / Docs / Sheets / Slides','Google','internal',array['internal-documents-knowledge','internal-projects'],'workspace-platform',5,'CONNECTOR_REQUIRED','https://workspace.google.com/','google-drive',interval '1 hour','Global','{"capability_only":true}'),
('gmail-internal','Gmail','Google','internal',array['internal-documents-knowledge','internal-customers-sales'],'communication-platform',5,'CONNECTOR_REQUIRED','https://mail.google.com/','gmail',interval '1 hour','Global','{"capability_only":true}'),
('google-calendar-internal','Google Calendar','Google','internal',array['internal-projects','internal-customers-sales'],'calendar-platform',5,'CONNECTOR_REQUIRED','https://calendar.google.com/','google-calendar',interval '1 hour','Global','{"capability_only":true}'),
('microsoft365-internal','Microsoft 365','Microsoft','internal',array['internal-documents-knowledge','internal-projects'],'workspace-platform',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/microsoft-365','microsoft365',interval '1 hour','Global','{"capability_only":true}'),
('sharepoint-internal','SharePoint','Microsoft','internal',array['internal-documents-knowledge','internal-projects'],'knowledge-platform',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/microsoft-365/sharepoint/collaboration','sharepoint',interval '1 hour','Global','{"capability_only":true}'),
('teams-internal','Microsoft Teams','Microsoft','internal',array['internal-documents-knowledge','internal-projects'],'communication-platform',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/microsoft-teams/','teams',interval '1 hour','Global','{"capability_only":true}'),
('slack-internal','Slack','Salesforce','internal',array['internal-documents-knowledge','internal-projects'],'communication-platform',5,'CONNECTOR_REQUIRED','https://slack.com/','slack',interval '1 hour','Global','{"capability_only":true}'),
('salesforce-internal','Salesforce','Salesforce','internal',array['internal-customers-sales'],'crm-platform',5,'CONNECTOR_REQUIRED','https://www.salesforce.com/','salesforce',interval '1 hour','Global','{"capability_only":true}'),
('hubspot-internal','HubSpot','HubSpot','internal',array['internal-customers-sales','internal-marketing-digital'],'crm-marketing-platform',5,'CONNECTOR_REQUIRED','https://www.hubspot.com/','hubspot',interval '1 hour','Global','{"capability_only":true}'),
('dynamics365-internal','Dynamics 365','Microsoft','internal',array['internal-customers-sales','internal-finance','internal-operations'],'erp-crm-platform',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/dynamics-365','dynamics365',interval '1 hour','Global','{"capability_only":true}'),
('sap-internal','SAP','SAP','internal',array['internal-finance','internal-operations','internal-suppliers-procurement'],'erp-platform',5,'CONNECTOR_REQUIRED','https://www.sap.com/','sap',interval '1 hour','Global','{"capability_only":true}'),
('afas-internal','AFAS','AFAS Software','internal',array['internal-finance','internal-people-hr','internal-operations'],'erp-hr-platform',5,'CONNECTOR_REQUIRED','https://www.afas.nl/','afas',interval '1 hour','NL','{"capability_only":true}'),
('exact-internal','Exact','Exact','internal',array['internal-finance','internal-operations'],'accounting-erp-platform',5,'CONNECTOR_REQUIRED','https://www.exact.com/','exact',interval '1 hour','Global','{"capability_only":true}'),
('topdesk-internal','TOPdesk','TOPdesk','internal',array['internal-service-quality','internal-systems-data'],'service-management-platform',5,'CONNECTOR_REQUIRED','https://www.topdesk.com/','topdesk',interval '1 hour','Global','{"capability_only":true}'),
('snowflake-internal','Snowflake','Snowflake','internal',array['internal-systems-data'],'data-platform',5,'CONNECTOR_REQUIRED','https://www.snowflake.com/','snowflake',interval '1 hour','Global','{"capability_only":true}'),
('databricks-internal','Databricks','Databricks','internal',array['internal-systems-data'],'data-ai-platform',5,'CONNECTOR_REQUIRED','https://www.databricks.com/','databricks',interval '1 hour','Global','{"capability_only":true}'),
('bigquery-internal','BigQuery','Google Cloud','internal',array['internal-systems-data'],'data-platform',5,'CONNECTOR_REQUIRED','https://cloud.google.com/bigquery','bigquery',interval '1 hour','Global','{"capability_only":true}'),
('powerbi-internal','Power BI / Fabric','Microsoft','internal',array['internal-systems-data','internal-finance','internal-operations'],'analytics-platform',5,'CONNECTOR_REQUIRED','https://www.microsoft.com/power-platform/products/power-bi','powerbi',interval '1 hour','Global','{"capability_only":true}'),
('azure-internal','Microsoft Azure','Microsoft','internal',array['internal-systems-data'],'cloud-platform',5,'CONNECTOR_REQUIRED','https://azure.microsoft.com/','azure',interval '1 hour','Global','{"capability_only":true}'),
('aws-internal','Amazon Web Services','Amazon','internal',array['internal-systems-data'],'cloud-platform',5,'CONNECTOR_REQUIRED','https://aws.amazon.com/','aws',interval '1 hour','Global','{"capability_only":true}'),
('gcp-internal','Google Cloud','Google','internal',array['internal-systems-data'],'cloud-platform',5,'CONNECTOR_REQUIRED','https://cloud.google.com/','gcp',interval '1 hour','Global','{"capability_only":true}'),
('stripe-internal','Stripe','Stripe','internal',array['internal-finance','internal-customers-sales'],'payments-platform',5,'CONNECTOR_REQUIRED','https://stripe.com/','stripe',interval '1 hour','Global','{"capability_only":true}'),
('shopify-internal','Shopify','Shopify','internal',array['internal-customers-sales','internal-operations','internal-marketing-digital'],'commerce-platform',5,'CONNECTOR_REQUIRED','https://www.shopify.com/','shopify',interval '1 hour','Global','{"capability_only":true}'),
('jira-internal','Jira','Atlassian','internal',array['internal-projects','internal-systems-data'],'work-management-platform',5,'CONNECTOR_REQUIRED','https://www.atlassian.com/software/jira','jira',interval '1 hour','Global','{"capability_only":true}'),
('confluence-internal','Confluence','Atlassian','internal',array['internal-documents-knowledge','internal-projects'],'knowledge-platform',5,'CONNECTOR_REQUIRED','https://www.atlassian.com/software/confluence','confluence',interval '1 hour','Global','{"capability_only":true}')
on conflict (source_key) do update set
  label=excluded.label,publisher=excluded.publisher,scope=excluded.scope,domain_keys=excluded.domain_keys,
  source_kind=excluded.source_kind,authority_tier=excluded.authority_tier,activation_mode=excluded.activation_mode,
  canonical_url=excluded.canonical_url,adapter_key=excluded.adapter_key,update_cadence=excluded.update_cadence,
  jurisdiction=excluded.jurisdiction,metadata=excluded.metadata,active=true,updated_at=now();

create or replace function public.powerhouse_intelligence_domain_from_text_v1(p_text text)
returns text
language sql
immutable
as $$
select case
  when coalesce(p_text,'') ~* 'cyber|ransom|kwetsbaar|vulnerab|zero.?day|phishing|cve|security advisory' then 'cyber-threats'
  when coalesce(p_text,'') ~* 'subsid|wbso|funding|grant|regeling|innovatiecredit|fisca' then 'subsidies-tax'
  when coalesce(p_text,'') ~* 'arbeid|vacature|personeel|werkloos|loon|beroep|talent' then 'labor-market'
  when coalesce(p_text,'') ~* 'skill|vaardig|opleiding|certific|ai literacy' then 'skills-capabilities'
  when coalesce(p_text,'') ~* 'netcongest|elektric|energie|gasprijs|olieprijs|tennet|energiebelasting' then 'energy'
  when coalesce(p_text,'') ~* 'klimaat|overstrom|droogte|storm|hitte|wateroverlast' then 'climate-physical-risk'
  when coalesce(p_text,'') ~* 'grondstof|commodity|metaal|plastic|hout|chip|halfgeleider|mineral' then 'commodities'
  when coalesce(p_text,'') ~* 'logist|vracht|haven|container|levertijd|supply.?chain|leverancier|staking' then 'supply-chain-logistics'
  when coalesce(p_text,'') ~* 'sanctie|oorlog|geopolit|verkiez|politieke stabiliteit' then 'geopolitics'
  when coalesce(p_text,'') ~* 'douane|import|export|tarief|cbam|handelsakkoord|trade' then 'international-trade'
  when coalesce(p_text,'') ~* 'csrd|esrs|duurzaam|circular|co2|biodivers|esg' then 'sustainability-esg'
  when coalesce(p_text,'') ~* 'demograf|vergrij|bevolking|migratie|huishouden|urbanisatie' then 'demography'
  when coalesce(p_text,'') ~* 'thuiswerk|maatschapp|sociaal.?culture|consumententrend|privacyhouding' then 'social-cultural'
  when coalesce(p_text,'') ~* 'tender|aanbested|ted europa|publieke inkoop' then 'public-procurement'
  when coalesce(p_text,'') ~* 'faillissement|handelsregister|bestuurder|oprichting|jaarrekening' then 'business-registers'
  when coalesce(p_text,'') ~* 'overname|acquisit|private equity|venture capital|m&a|waardering|funding round' then 'ma-investment'
  when coalesce(p_text,'') ~* 'patent|octrooi|trademark|merkregistr|wipo|epo|euipo' then 'patents-ip'
  when coalesce(p_text,'') ~* 'iso |nen |standaard|norm |certificering' then 'standards'
  when coalesce(p_text,'') ~* 'review|klacht|reputatie|recall|rechtszaak' then 'reputation-trust'
  when coalesce(p_text,'') ~* 'verzekering|premie|dekking|aansprakelijk|bedrijfsschade' then 'insurance'
  when coalesce(p_text,'') ~* 'fraude|aml|pep|witwas|factuurfraude|financial crime' then 'fraud-fincrime'
  when coalesce(p_text,'') ~* 'epidem|pandem|ziekteverzuim|zorgcapaciteit|gezondheidscrisis' then 'health-disruption'
  when coalesce(p_text,'') ~* 'gemeente|provincie|bestemmingsplan|lokale economie|bedrijventerrein' then 'local-environment'
  when coalesce(p_text,'') ~* 'vastgoed|huurprijs|leegstand|locatiekosten|bedrijfspand' then 'real-estate-location'
  when coalesce(p_text,'') ~* 'mobiliteit|ev |elektrische auto|kilometerheffing|wagenpark|brandstof' then 'mobility'
  when coalesce(p_text,'') ~* 'zoekvolume|seo|google trends|search intent|zoekgedrag' then 'search-internet'
  when coalesce(p_text,'') ~* 'prijsverhog|concurrentprijs|prijsindex|pricing|catalogusprijs' then 'pricing'
  when coalesce(p_text,'') ~* 'linkedin|reddit|youtube|community|social media' then 'social-communities'
  when coalesce(p_text,'') ~* 'concurrent|marktpartij|nieuwe product|partnership|campagne' then 'competition'
  when coalesce(p_text,'') ~* 'klantgedrag|koopintentie|churn|vraagontwikkeling|marktgedrag|consument' then 'customer-market-behavior'
  when coalesce(p_text,'') ~* 'rente|krediet|financier|leasing|factoring|werkkapitaal|ecb' then 'finance-capital'
  when coalesce(p_text,'') ~* 'inflatie|bbp|economie|conjunctuur|vertrouwen|wisselkoers' then 'macro-economy'
  when coalesce(p_text,'') ~* 'ai |kunstmatige intelligent|model|agent|cloud|software|api|technolog|chip' then 'ai-technology'
  when coalesce(p_text,'') ~* 'wet|regelgeving|richtlijn|verordening|avg|gdpr|nis2|data act|arbeidsrecht|toezicht' then 'legal-regulation'
  else 'media-news'
end
$$;

create or replace function public.powerhouse_intelligence_impact_score_v1(
  p_relevance numeric,
  p_probability numeric,
  p_magnitude numeric,
  p_urgency numeric,
  p_exposure numeric,
  p_source_confidence numeric
)
returns numeric
language sql
immutable
as $$
select case
  when p_probability is null or p_magnitude is null or p_exposure is null then null
  else round(
    100 * (
      0.20*least(1,greatest(0,coalesce(p_relevance,0))) +
      0.20*least(1,greatest(0,p_probability)) +
      0.20*least(1,greatest(0,p_magnitude)) +
      0.15*least(1,greatest(0,coalesce(p_urgency,0))) +
      0.15*least(1,greatest(0,p_exposure)) +
      0.10*least(1,greatest(0,coalesce(p_source_confidence,0)))
    ),1
  )
end
$$;

create or replace function public.powerhouse_sync_connector_sources_to_intelligence_v1()
returns integer
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare v_count integer:=0;
begin
  insert into public.powerhouse_intelligence_source_catalog_v1(
    source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,
    canonical_url,adapter_key,update_cadence,jurisdiction,active,metadata,updated_at
  )
  select
    'connector:'||coalesce(
      nullif(to_jsonb(c)->>'connector_key',''),
      nullif(to_jsonb(c)->>'provider_key',''),
      nullif(to_jsonb(c)->>'id',''),
      md5(to_jsonb(c)::text)
    ),
    coalesce(
      nullif(to_jsonb(c)->>'display_name',''),
      nullif(to_jsonb(c)->>'name',''),
      nullif(to_jsonb(c)->>'provider_key',''),
      'Connected app'
    ),
    coalesce(nullif(to_jsonb(c)->>'provider_key',''),'Connected app'),
    'internal',
    array['internal-systems-data'],
    'connected-app',
    5,
    'CONNECTOR_REQUIRED',
    null,
    coalesce(nullif(to_jsonb(c)->>'provider_key',''),'connector:auto'),
    interval '1 hour',
    null,
    true,
    jsonb_build_object('connector_definition',to_jsonb(c),'truth_rule','connection/runtime evidence required'),
    now()
  from public.connector_definitions c
  on conflict (source_key) do update set
    label=excluded.label,publisher=excluded.publisher,adapter_key=excluded.adapter_key,
    metadata=excluded.metadata,active=true,updated_at=now();
  get diagnostics v_count=row_count;
  return v_count;
end
$$;


create or replace function public.powerhouse_refresh_intelligence_source_availability_v1()
returns integer
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  r record;
  v_last timestamptz;
  v_count integer:=0;
  v_fresh_window interval;
begin
  for r in
    select source_key,activation_mode,evidence_source_key,update_cadence
    from public.powerhouse_intelligence_source_catalog_v1
    where active=true
  loop
    if nullif(r.evidence_source_key,'') is null then
      update public.powerhouse_intelligence_source_catalog_v1
      set availability_state=case
            when activation_mode='PUBLIC_ALWAYS' then 'AVAILABLE'
            else 'CATALOGUED'
          end,
          last_observed_at=null,
          updated_at=now()
      where source_key=r.source_key;
      v_count:=v_count+1;
      continue;
    end if;

    select max(o.observed_at) into v_last
    from public.powerhouse_evidence_source_observations o
    where o.source_key=r.evidence_source_key;

    v_fresh_window:=greatest(coalesce(r.update_cadence*2,interval '48 hours'),interval '6 hours');

    update public.powerhouse_intelligence_source_catalog_v1
    set last_observed_at=v_last,
        availability_state=case
          when v_last is null then case when activation_mode='PUBLIC_ALWAYS' then 'AVAILABLE' else 'CATALOGUED' end
          when v_last>=now()-v_fresh_window then 'LIVE'
          else 'STALE'
        end,
        updated_at=now()
    where source_key=r.source_key;
    v_count:=v_count+1;
  end loop;
  return v_count;
end
$$;



create or replace function public.powerhouse_project_internal_evidence_signal_v1(
  p_tenant_id text,
  p_source_observation_id uuid,
  p_domain_key text,
  p_title text,
  p_summary text default null,
  p_signal_type text default 'INTERNAL_SIGNAL',
  p_direction text default 'UNKNOWN',
  p_relevance numeric default null,
  p_source_confidence numeric default null,
  p_urgency numeric default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  o public.powerhouse_evidence_source_observations%rowtype;
  d public.powerhouse_intelligence_domain_registry_v1%rowtype;
  v_signal_key text;
  v_score numeric;
begin
  if nullif(btrim(p_tenant_id),'') is null or p_tenant_id='canonical' then
    raise exception 'TENANT_INTERNAL_SIGNAL_REQUIRED';
  end if;
  if nullif(btrim(p_title),'') is null then raise exception 'INTERNAL_SIGNAL_TITLE_REQUIRED'; end if;
  if p_direction not in ('UP','DOWN','MIXED','UNKNOWN') then raise exception 'INTERNAL_SIGNAL_DIRECTION_INVALID'; end if;

  select * into o
  from public.powerhouse_evidence_source_observations
  where observation_id=p_source_observation_id;
  if not found then raise exception 'SOURCE_OBSERVATION_NOT_FOUND:%',p_source_observation_id; end if;

  select * into d
  from public.powerhouse_intelligence_domain_registry_v1
  where domain_key=p_domain_key and active=true and scope='internal';
  if not found then raise exception 'INTERNAL_INTELLIGENCE_DOMAIN_REQUIRED:%',p_domain_key; end if;

  v_signal_key:=md5(p_tenant_id||'|'||o.observation_id::text||'|'||p_domain_key||'|'||p_title);
  v_score:=round(100*(
    0.45*least(1,greatest(0,coalesce(p_relevance,0.5)))+
    0.35*least(1,greatest(0,coalesce(p_source_confidence,0.5)))+
    0.20*least(1,greatest(0,coalesce(p_urgency,0.5)))
  ),1);

  insert into public.powerhouse_intelligence_signal_projection_v1(
    tenant_id,signal_key,source_observation_id,source_key,external_event_id,external_url,
    domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,
    source_trust,confirmation,freshness,relevance,source_confidence,urgency,signal_score,
    impact_score,impact_status,time_horizon_days,status,evidence,updated_at
  ) values (
    p_tenant_id,v_signal_key,o.observation_id,o.source_key,o.external_event_id,null,
    p_domain_key,coalesce(nullif(p_signal_type,''),d.default_signal_type),p_direction,p_title,p_summary,
    null,o.observed_at,null,null,null,null,p_relevance,p_source_confidence,p_urgency,v_score,
    null,'NEEDS_COMPANY_CONTEXT',d.default_horizon_days,
    case when v_score>=70 then 'WATCH' else 'ACTIVE' end,
    jsonb_build_object(
      'truth_class','OBSERVED_INTERNAL_SIGNAL',
      'source_observation_ref',o.observation_id,
      'raw_evidence_not_projected',true,
      'tenant_scope',p_tenant_id
    )||coalesce(p_metadata,'{}'::jsonb),
    now()
  )
  on conflict (signal_key) do update set
    title=excluded.title,summary=excluded.summary,direction=excluded.direction,
    relevance=excluded.relevance,source_confidence=excluded.source_confidence,
    urgency=excluded.urgency,signal_score=excluded.signal_score,status=excluded.status,
    evidence=public.powerhouse_intelligence_signal_projection_v1.evidence||excluded.evidence,
    observed_at=excluded.observed_at,updated_at=now();

  return jsonb_build_object(
    'tenant_id',p_tenant_id,
    'signal_key',v_signal_key,
    'domain_key',p_domain_key,
    'signal_score',v_score,
    'source_observation_id',p_source_observation_id
  );
end
$$;

create or replace function public.powerhouse_refresh_signal_relations_v1(
  p_tenant_id text default 'canonical',
  p_days integer default 14
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_shared integer:=0;
  v_dependency integer:=0;
begin
  if nullif(btrim(p_tenant_id),'') is null then raise exception 'TENANT_REQUIRED'; end if;

  with visible as (
    select *
    from public.powerhouse_intelligence_signal_projection_v1
    where status<>'DISMISSED'
      and observed_at>=now()-make_interval(days=>greatest(1,least(coalesce(p_days,14),90)))
      and (tenant_id='canonical' or tenant_id=p_tenant_id)
  ),
  pairs as (
    select
      a.signal_key left_key,b.signal_key right_key,a.domain_key,
      greatest(0.20,least(0.95,
        0.45+
        0.25*least(a.signal_score,b.signal_score)/100+
        0.25*(1-least(1,abs(extract(epoch from (a.observed_at-b.observed_at)))/604800))
      )) confidence
    from visible a
    join visible b on a.signal_key<b.signal_key and a.domain_key=b.domain_key
  ),
  ins as (
    insert into public.powerhouse_intelligence_signal_relation_v1(
      tenant_id,relation_key,left_signal_key,right_signal_key,relation_type,confidence,rationale,evidence,status,observed_at,updated_at
    )
    select
      p_tenant_id,
      md5(p_tenant_id||'|SHARED_DOMAIN|'||left_key||'|'||right_key),
      left_key,right_key,'SHARED_DOMAIN',confidence,
      'De signalen vallen in hetzelfde intelligence-domein en zijn in dezelfde periode waargenomen. Dit is samenhang, geen bewezen causaliteit.',
      jsonb_build_object('domain_key',domain_key,'causality_claimed',false,'method','shared-domain-time-window'),
      'ACTIVE',now(),now()
    from pairs
    on conflict (tenant_id,relation_key) do update set
      confidence=excluded.confidence,rationale=excluded.rationale,evidence=excluded.evidence,
      status='ACTIVE',observed_at=excluded.observed_at,updated_at=now()
    returning 1
  )
  select count(*) into v_shared from ins;

  if p_tenant_id<>'canonical' then
    with pairs as (
      select distinct
        least(a.signal_key,b.signal_key) left_key,
        greatest(a.signal_key,b.signal_key) right_key,
        a.target_node_key,
        a.target_node_type,
        greatest(coalesce(a.impact_score,0),coalesce(b.impact_score,0))/100 confidence
      from public.powerhouse_intelligence_company_impact_v1 a
      join public.powerhouse_intelligence_company_impact_v1 b
        on a.tenant_id=b.tenant_id
       and a.impact_key<b.impact_key
       and a.signal_key<>b.signal_key
       and a.target_node_key is not null
       and a.target_node_key=b.target_node_key
       and coalesce(a.target_node_type,'')=coalesce(b.target_node_type,'')
      where a.tenant_id=p_tenant_id
        and a.status='SCORED' and b.status='SCORED'
    ),
    ins as (
      insert into public.powerhouse_intelligence_signal_relation_v1(
        tenant_id,relation_key,left_signal_key,right_signal_key,relation_type,confidence,rationale,evidence,status,observed_at,updated_at
      )
      select
        p_tenant_id,
        md5(p_tenant_id||'|COMPANY_DEPENDENCY|'||left_key||'|'||right_key||'|'||target_node_key),
        left_key,right_key,'COMPANY_DEPENDENCY',least(1,greatest(0.2,confidence)),
        'Beide signalen hebben evidence-backed impact op dezelfde bedrijfsafhankelijkheid. Dit bewijst gedeelde exposure, niet dat het ene signaal het andere veroorzaakt.',
        jsonb_build_object('target_node_key',target_node_key,'target_node_type',target_node_type,'causality_claimed',false),
        'ACTIVE',now(),now()
      from pairs
      on conflict (tenant_id,relation_key) do update set
        confidence=excluded.confidence,rationale=excluded.rationale,evidence=excluded.evidence,
        status='ACTIVE',observed_at=excluded.observed_at,updated_at=now()
      returning 1
    )
    select count(*) into v_dependency from ins;
  end if;

  return jsonb_build_object(
    'tenant_id',p_tenant_id,
    'shared_domain_relations',v_shared,
    'company_dependency_relations',v_dependency,
    'causal_hypotheses_synthesized',false,
    'executed_at',now()
  );
end
$$;

create or replace function public.powerhouse_upsert_intelligence_company_impact_v1(
  p_tenant_id text,
  p_signal_key text,
  p_target_node_key text,
  p_target_node_type text,
  p_target_label text,
  p_relevance numeric,
  p_probability numeric,
  p_magnitude numeric,
  p_urgency numeric,
  p_exposure numeric,
  p_source_confidence numeric,
  p_reversibility numeric,
  p_estimated_value_eur numeric,
  p_estimated_loss_eur numeric,
  p_impact_dimensions jsonb,
  p_rationale text,
  p_evidence jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_impact_key text;
  v_score numeric;
  v_status text;
  v_action_key text;
begin
  if nullif(btrim(p_tenant_id),'') is null or p_tenant_id='canonical' then
    raise exception 'TENANT_COMPANY_CONTEXT_REQUIRED';
  end if;
  if nullif(btrim(p_signal_key),'') is null then
    raise exception 'INTELLIGENCE_SIGNAL_REQUIRED';
  end if;
  if coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb then
    raise exception 'INTELLIGENCE_IMPACT_EVIDENCE_REQUIRED';
  end if;
  if not exists (
    select 1 from public.powerhouse_intelligence_signal_projection_v1
    where signal_key=p_signal_key and (tenant_id='canonical' or tenant_id=p_tenant_id)
  ) then
    raise exception 'INTELLIGENCE_SIGNAL_NOT_FOUND:%',p_signal_key;
  end if;

  v_impact_key:=md5(p_tenant_id||'|'||p_signal_key||'|'||coalesce(p_target_node_key,'company')||'|'||coalesce(p_target_node_type,'company'));
  v_score:=public.powerhouse_intelligence_impact_score_v1(
    p_relevance,p_probability,p_magnitude,p_urgency,p_exposure,p_source_confidence
  );
  v_status:=case when v_score is null then 'PARTIAL' else 'SCORED' end;

  insert into public.powerhouse_intelligence_company_impact_v1(
    tenant_id,impact_key,signal_key,target_node_key,target_node_type,target_label,
    relevance,probability,magnitude,urgency,exposure,source_confidence,reversibility,impact_score,
    estimated_value_eur,estimated_loss_eur,impact_dimensions,rationale,evidence,status,observed_at,updated_at
  ) values (
    p_tenant_id,v_impact_key,p_signal_key,p_target_node_key,p_target_node_type,p_target_label,
    p_relevance,p_probability,p_magnitude,p_urgency,p_exposure,p_source_confidence,p_reversibility,v_score,
    p_estimated_value_eur,p_estimated_loss_eur,coalesce(p_impact_dimensions,'{}'::jsonb),p_rationale,p_evidence,
    v_status,now(),now()
  )
  on conflict (tenant_id,impact_key) do update set
    relevance=excluded.relevance,probability=excluded.probability,magnitude=excluded.magnitude,
    urgency=excluded.urgency,exposure=excluded.exposure,source_confidence=excluded.source_confidence,
    reversibility=excluded.reversibility,impact_score=excluded.impact_score,
    estimated_value_eur=excluded.estimated_value_eur,estimated_loss_eur=excluded.estimated_loss_eur,
    impact_dimensions=excluded.impact_dimensions,rationale=excluded.rationale,evidence=excluded.evidence,
    status=excluded.status,observed_at=excluded.observed_at,updated_at=now();

  v_action_key:='intelligence:'||p_signal_key;

  insert into public.powerhouse_intelligence_action_candidate_v1(
    tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,
    owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,status,evidence,updated_at
  )
  select
    p_tenant_id,
    v_action_key,
    s.signal_key,
    v_impact_key,
    s.domain_key,
    'Beoordeel en handel: '||left(s.title,170),
    coalesce(nullif(p_rationale,''),'Bedrijfsspecifieke exposure is onderbouwd; bepaal en volg de concrete maatregel.'),
    d.default_action_type,
    greatest(s.signal_score,coalesce(v_score,0)),
    null,
    coalesce(s.deadline::timestamptz,now()+make_interval(days=>coalesce(s.time_horizon_days,30))),
    p_estimated_value_eur,
    p_estimated_loss_eur,
    case when v_score>=70 then 'READY' else 'CANDIDATE' end,
    jsonb_build_object(
      'company_impact_key',v_impact_key,
      'company_impact_score',v_score,
      'company_impact_status',v_status,
      'company_context_evidence_backed',true,
      'no_synthetic_money',true,
      'canonical_execution_authority','brain_obligations'
    )||coalesce(p_evidence,'{}'::jsonb),
    now()
  from public.powerhouse_intelligence_signal_projection_v1 s
  join public.powerhouse_intelligence_domain_registry_v1 d on d.domain_key=s.domain_key
  where s.signal_key=p_signal_key and (s.tenant_id='canonical' or s.tenant_id=p_tenant_id)
  on conflict (tenant_id,action_key) do update set
    impact_key=excluded.impact_key,domain_key=excluded.domain_key,title=excluded.title,
    rationale=excluded.rationale,action_type=excluded.action_type,priority_score=excluded.priority_score,
    due_at=excluded.due_at,expected_value_eur=excluded.expected_value_eur,
    estimated_loss_avoided_eur=excluded.estimated_loss_avoided_eur,
    status=case
      when public.powerhouse_intelligence_action_candidate_v1.status in ('MATERIALIZED','DONE','DISMISSED')
        then public.powerhouse_intelligence_action_candidate_v1.status
      else excluded.status
    end,
    evidence=public.powerhouse_intelligence_action_candidate_v1.evidence||excluded.evidence,
    updated_at=now();

  perform public.powerhouse_refresh_signal_relations_v1(p_tenant_id,30);

  return jsonb_build_object(
    'tenant_id',p_tenant_id,
    'impact_key',v_impact_key,
    'impact_score',v_score,
    'status',v_status,
    'action_key',v_action_key,
    'action_status',case when v_score>=70 then 'READY' else 'CANDIDATE' end
  );
end
$$;

create or replace function public.powerhouse_materialize_intelligence_action_v1(
  p_tenant_id text,
  p_action_key text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  a public.powerhouse_intelligence_action_candidate_v1%rowtype;
  o public.brain_obligations%rowtype;
  v_payload text;
  v_hash text;
begin
  if nullif(btrim(p_tenant_id),'') is null or p_tenant_id='canonical' then
    raise exception 'TENANT_ACTION_REQUIRED';
  end if;

  select * into a
  from public.powerhouse_intelligence_action_candidate_v1
  where tenant_id=p_tenant_id and action_key=p_action_key
  for update;

  if not found then raise exception 'INTELLIGENCE_ACTION_NOT_FOUND:%',p_action_key; end if;
  if a.status='MATERIALIZED' and nullif(a.canonical_action_ref,'') is not null then
    return jsonb_build_object('action_key',a.action_key,'canonical_action_ref',a.canonical_action_ref,'status',a.status,'replayed',true);
  end if;
  if a.status<>'READY' then raise exception 'INTELLIGENCE_ACTION_NOT_READY:%',a.status; end if;
  if not exists (
    select 1 from public.powerhouse_intelligence_company_impact_v1 i
    where i.tenant_id=a.tenant_id
      and i.signal_key=a.signal_key
      and i.impact_key=a.impact_key
      and i.status='SCORED'
      and i.impact_score is not null
  ) then
    raise exception 'INTELLIGENCE_COMPANY_IMPACT_NOT_SCORED';
  end if;

  v_payload:=jsonb_build_object(
    'tenant_id',a.tenant_id,
    'action_key',a.action_key,
    'signal_key',a.signal_key,
    'impact_key',a.impact_key,
    'domain_key',a.domain_key,
    'action_type',a.action_type,
    'priority_score',a.priority_score,
    'due_at',a.due_at,
    'expected_value_eur',a.expected_value_eur,
    'estimated_loss_avoided_eur',a.estimated_loss_avoided_eur
  )::text;
  v_hash:=encode(extensions.digest(convert_to(v_payload,'UTF8'),'sha256'),'hex');

  o:=public.brain_create_obligation(
    'INTELLIGENCE_ACTION_REVIEW',
    'powerhouse-source-universe-impact-engine-v1',
    a.tenant_id||':'||a.action_key,
    coalesce(a.due_at::date,current_date)::text,
    'Europe/Amsterdam',
    v_hash,
    a.action_key,
    coalesce(nullif(a.owner_hint,''),'ONE BRAIN')
  );

  update public.powerhouse_intelligence_action_candidate_v1
  set canonical_action_ref='brain_obligation:'||o.id::text,
      status='MATERIALIZED',
      evidence=evidence||jsonb_build_object(
        'canonical_obligation_id',o.id,
        'canonical_obligation_state',o.state,
        'materialized_at',now(),
        'execution_truth','canonical obligation created; no provider side effect implied'
      ),
      updated_at=now()
  where tenant_id=p_tenant_id and action_key=p_action_key;

  return jsonb_build_object(
    'tenant_id',p_tenant_id,
    'action_key',p_action_key,
    'canonical_action_ref','brain_obligation:'||o.id::text,
    'obligation_state',o.state,
    'status','MATERIALIZED'
  );
end
$$;

create or replace function public.powerhouse_materialize_ready_intelligence_actions_v1(
  p_tenant_id text default null,
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  r record;
  v_one jsonb;
  v_results jsonb:='[]'::jsonb;
  v_count integer:=0;
begin
  for r in
    select tenant_id,action_key
    from public.powerhouse_intelligence_action_candidate_v1
    where status='READY'
      and tenant_id<>'canonical'
      and (p_tenant_id is null or tenant_id=p_tenant_id)
    order by priority_score desc,updated_at asc
    limit greatest(1,least(coalesce(p_limit,50),200))
  loop
    begin
      v_one:=public.powerhouse_materialize_intelligence_action_v1(r.tenant_id,r.action_key);
      v_results:=v_results||jsonb_build_array(v_one);
      v_count:=v_count+1;
    exception when others then
      v_results:=v_results||jsonb_build_array(jsonb_build_object('tenant_id',r.tenant_id,'action_key',r.action_key,'error',sqlerrm));
    end;
  end loop;
  return jsonb_build_object('materialized_count',v_count,'results',v_results,'executed_at',now());
end
$$;

create or replace function public.powerhouse_reconcile_intelligence_outcomes_v1(
  p_tenant_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_outcomes integer:=0;
  v_fulfilled_without_outcome integer:=0;
begin
  with matched as (
    select
      a.tenant_id,a.action_key,a.canonical_action_ref,
      m.memory_id,m.outcome_class,m.realized_value,m.unit,m.observed_at,m.canonical_ref
    from public.powerhouse_intelligence_action_candidate_v1 a
    join public.brain_obligations o
      on a.canonical_action_ref='brain_obligation:'||o.id::text
    join public.powerhouse_outcome_memory_v1 m
      on m.verified=true
     and (
       m.origin_action_id=a.action_key
       or m.origin_action_id=o.id::text
       or m.canonical_ref=a.canonical_action_ref
     )
    where a.status='MATERIALIZED'
      and a.tenant_id<>'canonical'
      and (p_tenant_id is null or a.tenant_id=p_tenant_id)
  )
  update public.powerhouse_intelligence_action_candidate_v1 a
  set status='DONE',
      outcome_ref='outcome_memory:'||matched.memory_id,
      evidence=a.evidence||jsonb_build_object(
        'verified_outcome_memory_id',matched.memory_id,
        'outcome_class',matched.outcome_class,
        'realized_value',matched.realized_value,
        'unit',matched.unit,
        'outcome_observed_at',matched.observed_at,
        'outcome_verified',true
      ),
      updated_at=now()
  from matched
  where a.tenant_id=matched.tenant_id and a.action_key=matched.action_key;
  get diagnostics v_outcomes=row_count;

  with fulfilled as (
    select a.tenant_id,a.action_key,o.id obligation_id,o.updated_at
    from public.powerhouse_intelligence_action_candidate_v1 a
    join public.brain_obligations o
      on a.canonical_action_ref='brain_obligation:'||o.id::text
    where a.status='MATERIALIZED'
      and o.state='FULFILLED'
      and a.tenant_id<>'canonical'
      and (p_tenant_id is null or a.tenant_id=p_tenant_id)
  )
  update public.powerhouse_intelligence_action_candidate_v1 a
  set evidence=a.evidence||jsonb_build_object(
        'canonical_obligation_fulfilled',true,
        'canonical_obligation_fulfilled_at',fulfilled.updated_at,
        'outcome_truth','FULFILLED_IS_NOT_BUSINESS_OUTCOME'
      ),
      updated_at=now()
  from fulfilled
  where a.tenant_id=fulfilled.tenant_id and a.action_key=fulfilled.action_key;
  get diagnostics v_fulfilled_without_outcome=row_count;

  return jsonb_build_object(
    'verified_outcomes_linked',v_outcomes,
    'fulfilled_without_verified_outcome',v_fulfilled_without_outcome,
    'learning_authority','powerhouse_run_daily_compound_learning_v1',
    'executed_at',now()
  );
end
$$;

create or replace function public.powerhouse_refresh_external_intelligence_universe_v1(
  p_tenant_id text default 'canonical',
  p_limit integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_now timestamptz:=now();
  v_processed integer:=0;
  v_actions integer:=0;
  v_connectors integer:=0;
  v_source_availability integer:=0;
  v_materialized jsonb:='{}'::jsonb;
  v_outcomes jsonb:='{}'::jsonb;
  v_snapshot jsonb;
begin
  if nullif(btrim(p_tenant_id),'') is null then raise exception 'TENANT_REQUIRED'; end if;
  if p_tenant_id<>'canonical' then raise exception 'EXTERNAL_REFRESH_CANONICAL_ONLY'; end if;
  v_connectors:=public.powerhouse_sync_connector_sources_to_intelligence_v1();
  v_source_availability:=public.powerhouse_refresh_intelligence_source_availability_v1();

  with src as (
    select
      s.*,
      public.powerhouse_intelligence_domain_from_text_v1(
        concat_ws(' ',s.onderwerp,s.domein,s.titel,s.samenvatting)
      ) as resolved_domain,
      greatest(
        0,
        least(
          100,
          100 * (
            0.28*coalesce(s.relevantie,0.5) +
            0.22*coalesce(s.vertrouwen,0.5) +
            0.18*coalesce(s.brontrouw,0.5) +
            0.16*coalesce(s.bevestiging,0.5) +
            0.16*coalesce(s.versheid,0.5)
          )
        )
      )::numeric as resolved_signal_score,
      case
        when s.deadline is null then 0.35::numeric
        when s.deadline < current_date then 1::numeric
        when s.deadline <= current_date+7 then 1::numeric
        when s.deadline <= current_date+30 then 0.8::numeric
        when s.deadline <= current_date+90 then 0.55::numeric
        else 0.35::numeric
      end as resolved_urgency
    from public.bg_externe_signalen s
    where s.toegestaan=true
    order by coalesce(s.gepubliceerd_op,s.opgehaald_op) desc
    limit greatest(1,least(coalesce(p_limit,500),2000))
  ),
  ins as (
    insert into public.powerhouse_intelligence_signal_projection_v1(
      tenant_id,signal_key,source_observation_id,source_key,external_event_id,external_url,
      domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,
      source_trust,confirmation,freshness,relevance,source_confidence,urgency,signal_score,
      impact_score,impact_status,time_horizon_days,status,evidence,updated_at
    )
    select
      p_tenant_id,
      md5(coalesce(src.url,'')||'|'||coalesce(src.titel,'')||'|'||coalesce(src.opgehaald_op::text,'')),
      (
        select o.observation_id
        from public.powerhouse_evidence_source_observations o
        where o.source_key='external-intelligence'
          and coalesce(o.evidence->>'url','')=coalesce(src.url,'')
        order by o.observed_at desc
        limit 1
      ),
      'external-intelligence',
      coalesce(src.url,src.titel),
      src.url,
      src.resolved_domain,
      d.default_signal_type,
      'UNKNOWN',
      coalesce(nullif(src.titel,''),nullif(src.onderwerp,''),'Extern signaal'),
      src.samenvatting,
      src.gepubliceerd_op,
      src.opgehaald_op,
      src.deadline,
      src.brontrouw,src.bevestiging,src.versheid,src.relevantie,src.vertrouwen,
      src.resolved_urgency,
      round(src.resolved_signal_score,1),
      null,
      'NEEDS_COMPANY_CONTEXT',
      d.default_horizon_days,
      case when src.resolved_signal_score>=70 then 'WATCH' else 'ACTIVE' end,
      jsonb_build_object(
        'truth_class','OBSERVED_EXTERNAL_SIGNAL',
        'raw_authority','bg_externe_signalen',
        'company_impact_truth','UNKNOWN_UNTIL_ENRICHED',
        'money_truth','NULL_UNTIL_EVIDENCE_BACKED',
        'topic',src.onderwerp,
        'raw_domain',src.domein,
        'noise_reason',src.ruis_reden
      ),
      v_now
    from src
    join public.powerhouse_intelligence_domain_registry_v1 d on d.domain_key=src.resolved_domain
    on conflict (signal_key) do update set
      source_observation_id=excluded.source_observation_id,
      domain_key=excluded.domain_key,
      signal_type=excluded.signal_type,
      title=excluded.title,
      summary=excluded.summary,
      published_at=excluded.published_at,
      observed_at=excluded.observed_at,
      deadline=excluded.deadline,
      source_trust=excluded.source_trust,
      confirmation=excluded.confirmation,
      freshness=excluded.freshness,
      relevance=excluded.relevance,
      source_confidence=excluded.source_confidence,
      urgency=excluded.urgency,
      signal_score=excluded.signal_score,
      time_horizon_days=excluded.time_horizon_days,
      evidence=public.powerhouse_intelligence_signal_projection_v1.evidence||excluded.evidence,
      updated_at=v_now
    returning 1
  )
  select count(*) into v_processed from ins;

  with candidates as (
    select s.*,d.default_action_type
    from public.powerhouse_intelligence_signal_projection_v1 s
    join public.powerhouse_intelligence_domain_registry_v1 d using(domain_key)
    where s.tenant_id=p_tenant_id
      and s.status in ('ACTIVE','WATCH')
      and s.signal_score>=65
      and s.observed_at>=v_now-interval '30 days'
  ),
  ins as (
    insert into public.powerhouse_intelligence_action_candidate_v1(
      tenant_id,action_key,signal_key,domain_key,title,rationale,action_type,priority_score,
      owner_hint,due_at,status,evidence,updated_at
    )
    select
      p_tenant_id,
      'intelligence:'||c.signal_key,
      c.signal_key,
      c.domain_key,
      'Beoordeel impact: '||left(c.title,180),
      case
        when c.impact_status='SCORED' then 'Bedrijfsspecifieke impact is gescoord; bepaal de volgende concrete actie.'
        else 'Dit externe signaal is relevant genoeg voor beoordeling. Koppel eigen exposure, waarschijnlijkheid en omvang voordat financiële impact wordt gebruikt.'
      end,
      c.default_action_type,
      greatest(c.signal_score,coalesce(c.impact_score,0)),
      null,
      coalesce(c.deadline::timestamptz,v_now+make_interval(days=>coalesce(c.time_horizon_days,30))),
      'CANDIDATE',
      jsonb_build_object(
        'signal_score',c.signal_score,
        'impact_score',c.impact_score,
        'impact_status',c.impact_status,
        'no_fabricated_money',true,
        'canonical_execution_authority','existing Brain/action/obligation layer'
      ),
      v_now
    from candidates c
    on conflict (tenant_id,action_key) do update set
      title=excluded.title,rationale=excluded.rationale,action_type=excluded.action_type,
      priority_score=excluded.priority_score,due_at=excluded.due_at,
      evidence=excluded.evidence,updated_at=v_now
    returning 1
  )
  select count(*) into v_actions from ins;

  insert into public.powerhouse_intelligence_snapshot_v1(
    tenant_id,refreshed_at,catalog_source_count,public_source_count,connector_source_count,domain_count,
    observed_signal_count,signals_24h,signals_7d,high_attention_count,scored_impact_count,
    action_candidate_count,known_opportunity_value_eur,known_risk_value_eur,top_domains,
    source_health,status,evidence,updated_at
  )
  select
    p_tenant_id,
    v_now,
    (select count(*) from public.powerhouse_intelligence_source_catalog_v1 where active),
    (select count(*) from public.powerhouse_intelligence_source_catalog_v1 where active and activation_mode='PUBLIC_ALWAYS'),
    (select count(*) from public.powerhouse_intelligence_source_catalog_v1 where active and activation_mode='CONNECTOR_REQUIRED'),
    (select count(*) from public.powerhouse_intelligence_domain_registry_v1 where active),
    count(*),
    count(*) filter(where s.observed_at>=v_now-interval '24 hours'),
    count(*) filter(where s.observed_at>=v_now-interval '7 days'),
    count(*) filter(where greatest(s.signal_score,coalesce(s.impact_score,0))>=70),
    count(*) filter(where s.impact_status='SCORED'),
    (select count(*) from public.powerhouse_intelligence_action_candidate_v1 a where a.tenant_id=p_tenant_id and a.status in ('CANDIDATE','READY')),
    sum(s.estimated_value_eur) filter(where s.estimated_value_eur is not null),
    sum(s.estimated_loss_eur) filter(where s.estimated_loss_eur is not null),
    coalesce((
      select jsonb_agg(jsonb_build_object('domainKey',x.domain_key,'label',x.label,'count',x.cnt,'maxScore',x.max_score) order by x.max_score desc,x.cnt desc)
      from (
        select s2.domain_key,d.label,count(*) cnt,max(greatest(s2.signal_score,coalesce(s2.impact_score,0))) max_score
        from public.powerhouse_intelligence_signal_projection_v1 s2
        join public.powerhouse_intelligence_domain_registry_v1 d using(domain_key)
        where s2.tenant_id=p_tenant_id and s2.status<>'DISMISSED'
        group by s2.domain_key,d.label
        order by max_score desc,cnt desc
        limit 10
      ) x
    ),'[]'::jsonb),
    jsonb_build_object(
      'raw_external_signal_count',(select count(*) from public.bg_externe_signalen where toegestaan=true),
      'evidence_observation_count',(select count(*) from public.powerhouse_evidence_source_observations where source_key='external-intelligence'),
      'connector_catalog_sync_rows',v_connectors,
      'availability',jsonb_build_object(
        'live',(select count(*) from public.powerhouse_intelligence_source_catalog_v1 where active and availability_state='LIVE'),
        'available',(select count(*) from public.powerhouse_intelligence_source_catalog_v1 where active and availability_state='AVAILABLE'),
        'catalogued',(select count(*) from public.powerhouse_intelligence_source_catalog_v1 where active and availability_state='CATALOGUED'),
        'stale',(select count(*) from public.powerhouse_intelligence_source_catalog_v1 where active and availability_state='STALE')
      ),
      'truth_rule','catalog capability != connected evidence'
    ),
    case when count(*)=0 then 'EMPTY'
         when count(*) filter(where s.observed_at>=v_now-interval '7 days')=0 then 'PARTIAL'
         else 'CURRENT' end,
    jsonb_build_object(
      'contract','powerhouse-source-universe-impact-engine-v1',
      'lineage','source->evidence->signal->company-impact->recommendation->canonical-action->outcome->learning',
      'money_values_require_evidence',true,
      'unknown_never_green',true
    ),
    v_now
  from public.powerhouse_intelligence_signal_projection_v1 s
  where s.tenant_id=p_tenant_id and s.status<>'DISMISSED'
  on conflict (tenant_id) do update set
    refreshed_at=excluded.refreshed_at,
    catalog_source_count=excluded.catalog_source_count,
    public_source_count=excluded.public_source_count,
    connector_source_count=excluded.connector_source_count,
    domain_count=excluded.domain_count,
    observed_signal_count=excluded.observed_signal_count,
    signals_24h=excluded.signals_24h,
    signals_7d=excluded.signals_7d,
    high_attention_count=excluded.high_attention_count,
    scored_impact_count=excluded.scored_impact_count,
    action_candidate_count=excluded.action_candidate_count,
    known_opportunity_value_eur=excluded.known_opportunity_value_eur,
    known_risk_value_eur=excluded.known_risk_value_eur,
    top_domains=excluded.top_domains,
    source_health=excluded.source_health,
    status=excluded.status,
    evidence=excluded.evidence,
    updated_at=v_now;

  perform public.powerhouse_refresh_signal_relations_v1('canonical',14);
  v_materialized:=public.powerhouse_materialize_ready_intelligence_actions_v1(null,50);
  v_outcomes:=public.powerhouse_reconcile_intelligence_outcomes_v1(null);

  select to_jsonb(s) into v_snapshot
  from public.powerhouse_intelligence_snapshot_v1 s
  where s.tenant_id=p_tenant_id;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'external-intelligence-universe:'||p_tenant_id||':'||date_trunc('hour',v_now)::text,
    'external_intelligence_universe_refresh',
    'powerhouse-external-intelligence-universe-v1',
    p_tenant_id,
    'data-intelligence',
    v_now,
    coalesce(v_snapshot,'{}'::jsonb),
    jsonb_build_object(
      'processed_signals',v_processed,
      'action_candidates',v_actions,
      'canonical_actions_materialized',coalesce((v_materialized->>'materialized_count')::int,0),
      'verified_outcomes_linked',coalesce((v_outcomes->>'verified_outcomes_linked')::int,0),
      'existing_state_first',true,
      'parallel_scheduler_created',false,
      'financial_impact_fabricated',false
    ),
    case
      when coalesce((v_outcomes->>'verified_outcomes_linked')::int,0)>0 then 'closed'
      when coalesce((v_materialized->>'materialized_count')::int,0)>0 then 'actioned'
      else 'observed'
    end,
    case when coalesce(v_snapshot->>'status','EMPTY')='CURRENT' then 'VERIFIED' else 'INCOMPLETE' end,
    case when coalesce(v_snapshot->>'status','EMPTY')='CURRENT' then 1 else 0.6 end
  )
  on conflict (dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-source-universe-impact-engine-v1',
    'tenant_id',p_tenant_id,
    'processed_signals',v_processed,
    'action_candidates',v_actions,
    'canonical_actions_materialized',coalesce((v_materialized->>'materialized_count')::int,0),
    'materialization',v_materialized,
    'outcome_reconciliation',v_outcomes,
    'connector_catalog_rows',v_connectors,
    'source_availability_rows',v_source_availability,
    'snapshot',v_snapshot,
    'executed_at',v_now
  );
end
$$;

-- Reuse the existing scheduler mux; do not introduce another cron writer.
create or replace function public.powerhouse_runtime_scheduler_mux_v3(p_now timestamp with time zone default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v jsonb;
  v_email integer:=0;
  v_intelligence jsonb:='{}'::jsonb;
begin
  v:=public.powerhouse_runtime_scheduler_mux_v2(p_now);
  if extract(minute from p_now)::integer=38 then
    v_email:=public.powerhouse_backfill_autonomous_email_economics_v1(p_now);
  end if;
  if extract(minute from p_now)::integer=54 then
    begin
      v_intelligence:=public.powerhouse_refresh_external_intelligence_universe_v1('canonical',500);
    exception when others then
      v_intelligence:=jsonb_build_object('error',sqlerrm,'failed_at',p_now);
    end;
  end if;
  return coalesce(v,'{}'::jsonb)||jsonb_build_object(
    'contract','powerhouse-runtime-scheduler-mux-v5',
    'autonomous_email_economics_backfilled',v_email,
    'external_intelligence_universe',v_intelligence,
    'executed_at',p_now
  );
end
$$;

insert into public.powerhouse_loop_assurance_registry_v1(
  loop_key,label,runtime_source,cron_jobname,expected_cadence_minutes,critical,required_stages,active,evidence_contract,updated_at
)
values(
  'external-intelligence-universe',
  'Source Universe → Impact → Action → Outcome → Learning',
  'powerhouse-external-intelligence-universe-v1',
  'powerhouse-runtime-scheduler-mux-v1',
  60,
  true,
  array['input','decision','action','readback','outcome','measurement','learning','guard'],
  true,
  jsonb_build_object(
    'input','fresh source observations',
    'decision','domain classification and signal ranking',
    'action','derived candidate; canonical execution remains external to projection',
    'readback','Portal/API/runtime snapshot',
    'outcome','must be observed through canonical action/outcome authority; never synthesized',
    'measurement','signal/impact/action counts plus known values only',
    'learning','existing compound-learning/outcome memory',
    'guard','RLS + server-only access + evidence-first money truth'
  ),
  now()
)
on conflict (loop_key) do update set
  label=excluded.label,runtime_source=excluded.runtime_source,cron_jobname=excluded.cron_jobname,
  expected_cadence_minutes=excluded.expected_cadence_minutes,critical=excluded.critical,
  required_stages=excluded.required_stages,active=true,evidence_contract=excluded.evidence_contract,updated_at=now();

-- Server-only execution. SECURITY DEFINER functions are never browser APIs.
revoke all on function public.powerhouse_intelligence_domain_from_text_v1(text) from public,anon,authenticated;
revoke all on function public.powerhouse_intelligence_impact_score_v1(numeric,numeric,numeric,numeric,numeric,numeric) from public,anon,authenticated;
revoke all on function public.powerhouse_sync_connector_sources_to_intelligence_v1() from public,anon,authenticated;
revoke all on function public.powerhouse_refresh_intelligence_source_availability_v1() from public,anon,authenticated;
revoke all on function public.powerhouse_project_internal_evidence_signal_v1(text,uuid,text,text,text,text,text,numeric,numeric,numeric,jsonb) from public,anon,authenticated;
revoke all on function public.powerhouse_refresh_signal_relations_v1(text,integer) from public,anon,authenticated;
revoke all on function public.powerhouse_upsert_intelligence_company_impact_v1(text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,jsonb,text,jsonb) from public,anon,authenticated;
revoke all on function public.powerhouse_materialize_intelligence_action_v1(text,text) from public,anon,authenticated;
revoke all on function public.powerhouse_materialize_ready_intelligence_actions_v1(text,integer) from public,anon,authenticated;
revoke all on function public.powerhouse_reconcile_intelligence_outcomes_v1(text) from public,anon,authenticated;
revoke all on function public.powerhouse_refresh_external_intelligence_universe_v1(text,integer) from public,anon,authenticated;

grant execute on function public.powerhouse_intelligence_domain_from_text_v1(text) to service_role;
grant execute on function public.powerhouse_intelligence_impact_score_v1(numeric,numeric,numeric,numeric,numeric,numeric) to service_role;
grant execute on function public.powerhouse_sync_connector_sources_to_intelligence_v1() to service_role;
grant execute on function public.powerhouse_refresh_intelligence_source_availability_v1() to service_role;
grant execute on function public.powerhouse_project_internal_evidence_signal_v1(text,uuid,text,text,text,text,text,numeric,numeric,numeric,jsonb) to service_role;
grant execute on function public.powerhouse_refresh_signal_relations_v1(text,integer) to service_role;
grant execute on function public.powerhouse_upsert_intelligence_company_impact_v1(text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,jsonb,text,jsonb) to service_role;
grant execute on function public.powerhouse_materialize_intelligence_action_v1(text,text) to service_role;
grant execute on function public.powerhouse_materialize_ready_intelligence_actions_v1(text,integer) to service_role;
grant execute on function public.powerhouse_reconcile_intelligence_outcomes_v1(text) to service_role;
grant execute on function public.powerhouse_refresh_external_intelligence_universe_v1(text,integer) to service_role;

-- The existing scheduler owner/postgres keeps execution authority for mux v3.
revoke all on function public.powerhouse_runtime_scheduler_mux_v3(timestamptz) from public,anon,authenticated;
