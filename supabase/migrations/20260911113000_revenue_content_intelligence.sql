alter table public.bg_post_kenmerken
  add column if not exists persona text,
  add column if not exists pain_trigger text,
  add column if not exists fomo_trigger text,
  add column if not exists comedy_device text,
  add column if not exists proof_type text,
  add column if not exists offer_type text,
  add column if not exists source_signal text,
  add column if not exists commercial_hypothesis text,
  add column if not exists experiment_id text,
  add column if not exists objective text;

alter table public.social_experiments
  drop constraint if exists social_experiments_status_check;
alter table public.social_experiments
  add constraint social_experiments_status_check
  check (status = any (array['PLANNED'::text,'ACTIVE'::text,'COMPLETE'::text,'ROLLED_BACK'::text,'INSUFFICIENT_EVIDENCE'::text]));

alter table public.social_experiments
  add column if not exists recipe jsonb not null default '{}'::jsonb,
  add column if not exists source_signals jsonb not null default '[]'::jsonb,
  add column if not exists commercial_hypothesis text,
  add column if not exists target_channels jsonb not null default '[]'::jsonb,
  add column if not exists calendar_date date;

create index if not exists social_experiments_status_started_idx
  on public.social_experiments(status, started_at desc);
create index if not exists social_experiments_calendar_date_idx
  on public.social_experiments(calendar_date);
create index if not exists bg_post_kenmerken_experiment_idx
  on public.bg_post_kenmerken(experiment_id);

-- Strategic creative policy. These are explicit experiment instructions, not empirical wins.
insert into public.bg_schrijfregels(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bron)
values
  ('rci-personal-standup','Persoonlijk LinkedIn','Gebruik observational business stand-up als standaard experimentele stijl: begin met een herkenbare werksituatie, maak het concrete detail licht absurd of grappig, voeg zelfspot of een menselijke draai toe, benoem daarna de emotionele waarheid en pas dan het zakelijke probleem. Wissel dit af; kopieer nooit een volledige winnaar.','Strategisch experimentcontract Revenue Content Intelligence v1.',0,0.60,'actief','revenue-content-policy'),
  ('rci-emotion','Emotie','Elke persoonlijke post kiest bewust één primaire emotie zoals herkenning, geamuseerde frustratie, opluchting, ambitie of productief ongemak. De emotie moet uit een echte werksituatie komen en niet uit kunstmatig drama.','Strategisch experimentcontract; effect wordt per post teruggeleerd.',0,0.60,'actief','revenue-content-policy'),
  ('rci-comedy','Humor','Experimenteer gecontroleerd met observational contrast, understatement, rule-of-three, self-deprecation, exaggeration en callback. Humor is een mechanisme voor herkenning en gesprek, nooit het einddoel.','Strategisch experimentcontract; comedy_device wordt als postkenmerk gemeten.',0,0.60,'actief','revenue-content-policy'),
  ('rci-latent-pain','Latent probleem en FOMO','Activeer problemen die de lezer nog niet als probleem benoemt door de verborgen kosten van wachten, zoeken, afhankelijkheid, rework en gemiste snelheid concreet te maken. Gebruik FOMO alleen met plausibele zakelijke consequenties, nooit met verzonnen schaarste.','Koppelt opportunity-signalen aan probleemactivatie.',0,0.65,'actief','revenue-content-policy'),
  ('rci-conversation-cta','Reactie-uitlokking','Vraag op persoonlijk LinkedIn om één concreet eigen voorbeeld uit de week van één herkenbaar type lezer. Vermijd algemene vragen om een mening. Laat de CTA voelen als het vervolg van het verhaal.','51 posts hadden 0 reacties op 7.871 impressies; dit is het expliciete verbeterexperiment.',51,0.90,'actief','revenue-content-policy'),
  ('rci-commercial-priority','Commerciële prioriteit','Optimaliseer in deze volgorde: omzet/orders, offertes, gekwalificeerde leads/meetings/DMs, inhoudelijke reacties en shares, clicks, bereik en likes. Een virale post zonder commerciële vervolgactie is geen automatische winnaar.','Revenue-first Powerhouse-contract.',0,0.80,'actief','revenue-content-policy'),
  ('rci-company-formats','Bedrijfspagina formats','Gebruik op de Bedrijfsgeheugen-pagina vooral carrousels, cases/bewijs, diagnostische posts, benchmarks en concrete how-to content. Iedere asset moet een meetbare hypothese en een passende instapoffer hebben.','Strategische kanaalrol in Revenue Content Intelligence v1.',0,0.60,'actief','revenue-content-policy'),
  ('rci-seo-opportunity','SEO naar content','Gebruik actuele zoekvraag, positie, CPC, kansscore en Search Console/DataForSEO signalen als aanleiding voor blogs én social content. Vertaal zoekwoorden naar het onderliggende bedrijfsprobleem; publiceer niet alleen keyword-copy.','Verbindt bg_zoekwoordkansen en Powerhouse opportunity decisioning.',0,0.65,'actief','revenue-content-policy'),
  ('rci-offer-ladder','Offer ladder','Kies CTA en aanbod passend bij intentie: gesprek of gratis Frisse Blik voor lage frictie, checklist/template/calculator of mini-diagnose als tussenstap, daarna Frisse Blik Scan, implementatie en abonnement. Meet welke route orders oplevert.','Commerciële experimenteerregel.',0,0.65,'actief','revenue-content-policy'),
  ('rci-fresh-copy','Adaptieve tekst','Schrijf de definitieve tekst zo dicht mogelijk op publicatiemoment en gebruik de nieuwste Powerhouse recommendations, social/revenue learnings, SEO-kansen en recente uitkomsten. De kalender legt het experiment vast, niet maanden vooraf de exacte copy.','Voorkomt statische contentkalender en maakt dagelijkse learning mogelijk.',0,0.80,'actief','revenue-content-policy'),
  ('rci-privacy','Publieke content privacy','Gebruik connectie-, DM- en relatiegegevens uitsluitend als geaggregeerde patronen en signalen voor publieke content. Neem geen privécontext, namen of herleidbare individuele gegevens over in posts zonder expliciete publieke bron.','Privacygrens voor network_relationship signalen.',0,1.00,'actief','revenue-content-policy')
on conflict (regel_id) do update set
  onderwerp=excluded.onderwerp,
  regel=excluded.regel,
  onderbouwing=excluded.onderbouwing,
  bewijs_n=excluded.bewijs_n,
  vertrouwen=excluded.vertrouwen,
  status=excluded.status,
  bron=excluded.bron,
  bijgewerkt_op=now();

-- Adaptive experiment slots through 31 Dec 2026. These reserve the hypothesis, not frozen copy.
with days as (
  select d::date as calendar_date,
         (d::date - date '2026-09-12')::int as day_index
  from generate_series(date '2026-09-12', date '2026-12-31', interval '1 day') d
), planned as (
  select calendar_date,
         day_index,
         case (day_index % 8)
           when 0 then 'standup_recognition'
           when 1 then 'latent_problem_activation'
           when 2 then 'diagnostic_fomo'
           when 3 then 'proof_case'
           when 4 then 'carousel_practical'
           when 5 then 'seo_opportunity'
           when 6 then 'offer_ladder'
           else 'authority_contrarian'
         end as family,
         case when day_index % 5 = 0 then 'EXPLORE' else 'EXPLOIT' end as decision_mode
  from days
), tenants(tenant_id) as (values ('canonical'::text),('bedrijfsgeheugen'::text))
insert into public.social_experiments(
  tenant_id,experiment_id,hypothesis,primary_metric,comparison_scope,started_at,status,
  recipe,source_signals,commercial_hypothesis,target_channels,calendar_date
)
select
  t.tenant_id,
  'rci-'||to_char(p.calendar_date,'YYYY-MM-DD'),
  'Test whether '||replace(p.family,'_',' ')||' creates more downstream commercial movement than the current baseline.',
  'revenue',
  jsonb_build_object(
    'family',p.family,
    'mode',p.decision_mode,
    'copy_policy','generate_near_publish_from_latest_learning',
    'exploration_target',0.20
  ),
  p.calendar_date::timestamptz,
  'PLANNED',
  jsonb_build_object(
    'experiment_family',p.family,
    'mode',p.decision_mode,
    'personal',jsonb_build_object('text_type','observational_business_standup','objective','commercial_conversation'),
    'company',jsonb_build_object('formats',jsonb_build_array('carousel','case_proof','diagnostic'),'objective','qualified_demand'),
    'blog',jsonb_build_object('text_type','search_demand_to_problem_activation','objective','organic_qualified_demand')
  ),
  jsonb_build_array('social_learning','revenue_learning','seo_growth','site_analytics','network_relationships','sales_outcomes','powerhouse_opportunities'),
  'Generate measurable qualified conversations, leads, offers, orders or revenue while learning which mechanism works for this topic, audience and channel.',
  jsonb_build_array('linkedin_personal','linkedin_company','blog'),
  p.calendar_date
from planned p cross join tenants t
on conflict (tenant_id,experiment_id) do update set
  hypothesis=excluded.hypothesis,
  primary_metric=excluded.primary_metric,
  comparison_scope=excluded.comparison_scope,
  recipe=excluded.recipe,
  source_signals=excluded.source_signals,
  commercial_hypothesis=excluded.commercial_hypothesis,
  target_channels=excluded.target_channels,
  calendar_date=excluded.calendar_date,
  updated_at=now();
