# MKB Voice of Customer, Probleemradar & Opportunity Intelligence

## Purpose
Make public, first-hand entrepreneur complaints and frustrations a canonical input for Powerhouse opportunity detection, product intelligence, blogs, and LinkedIn company content. This is not a separate content island: it is the front end of the existing Powerhouse intelligence/opportunity/content loop.

## Canonical closed loop
voice of customer -> normalize -> deduplicate -> cluster -> quantify -> opportunity score -> problem hypothesis -> buying trigger -> company/sector relevance -> recommended Powerhouse capability -> content candidate -> blog/company LinkedIn -> publish gate -> readback -> engagement/lead/outcome -> learning writeback

## Source policy
Use:
- first-hand entrepreneur signals from public forums, Reddit, Higherlevel, public business communities and interviews;
- quantitative validation from CBS, KVK, RVO, DNB, MKB-Nederland/VNO-NCW, banks and industry bodies;
- existing Powerhouse external signals such as sector changes, growth, new management, M&A, ERP/accounting changes, margin pressure, staff shortages, regulation, financing and post-acquisition integration.

Forum/interview evidence is qualitative and must never be represented as a market statistic.

## Signal schema
For every signal store:
- date;
- source type;
- sector/company type;
- company size if public;
- short paraphrased complaint;
- symptom;
- root problem;
- business impact;
- buying trigger;
- urgency;
- recurrence count;
- sector spread;
- quantitative validation status;
- related Powerhouse capability;
- opportunity hypothesis;
- content angle;
- source URL;
- evidence status.

## Canonical recurring problems
1. Growth breaks Excel, Outlook and loose task lists.
2. The owner becomes the operational bottleneck.
3. Knowledge and customer commitments live in people's heads.
4. Disconnected systems create duplicate entry and reconciliation.
5. Planning, capacity and availability become opaque.
6. CRM/ERP/software is too heavy, expensive or creates extra administration.
7. Accountant/bookkeeper dependency without real-time management insight.
8. Tax, cash-flow and forecast surprises.
9. Manual invoicing, debtor follow-up and bank reconciliation.
10. Inventory growth requires working-capital financing.
11. Staff shortages, absenteeism and knowledge loss.
12. Sales/acquisition activity without predictable conversion.
13. Permits, subsidies, privacy and regulatory burden are hard to navigate.
14. Grid congestion blocks expansion, locations and sustainability investments.
15. Energy, labour, purchasing and transport costs compress margins.
16. Lack of time, people and expertise slows innovation, digitalisation and AI.
17. Cyber, cloud, internet and operational continuity risks.
18. Strategy exists but ownership, prioritisation and execution lag.
19. Management information is late, fragmented or not decision-ready.
20. Business sale, succession, due diligence or acquisition exposes undocumented knowledge and weak processes.

## Opportunity Intelligence integration
Every normalized signal is eligible for the existing Powerhouse Opportunity layer.

Create or update an opportunity when at least one of these holds:
- the same problem recurs independently;
- the problem is quantitatively validated;
- a buying trigger is visible;
- a concrete company/sector trigger matches the problem;
- the problem maps to a measurable Powerhouse capability;
- the expected business impact is material.

For every opportunity derive:
- target segment/sector;
- trigger;
- problem hypothesis;
- decision-maker;
- evidence strength;
- urgency;
- commercial intent;
- Powerhouse fit;
- next best action;
- recommended content;
- recommended Frisse Blik/scan/implementation route.

## Opportunity scoring
Use a 0-100 score with explicit components:
- recurrence 0-15;
- recency 0-10;
- quantitative validation 0-15;
- business impact 0-15;
- buying-trigger strength 0-15;
- decision-maker relevance 0-10;
- Powerhouse capability fit 0-10;
- content/SEO opportunity 0-5;
- lead/revenue potential 0-5.

Do not fabricate numeric evidence. The score is prioritisation logic, not a market statistic.

## Content engine integration
The problem radar is a mandatory candidate source for:
- company LinkedIn posts;
- blogs;
- SEO opportunity content;
- Frisse Blik hooks;
- sector pages;
- case/problem explainers;
- commercial outreach hypotheses.

Company LinkedIn and blogs must start with a concrete CEO/MT problem in entrepreneur language, not with product features.

Preferred structure:
problem recognition -> concrete symptoms -> business impact -> current evidence -> root cause -> practical approach -> relevant Powerhouse capability -> measurable result -> CTA

## Daily content selection
When selecting the next company LinkedIn post or blog:
1. read current entrepreneur signals and existing content state;
2. exclude duplicates and recently exhausted angles;
3. rank candidate problems by opportunity score;
4. prefer a current signal with concrete entrepreneur language plus quantitative validation;
5. connect it to a real Powerhouse capability already present or explicitly mark a product gap;
6. generate channel-specific copy;
7. pass existing publication, identity and duplicate gates;
8. after publishing, write back reach, clicks, leads and qualitative reactions;
9. increase/decrease future priority based on observed outcome.

## Product intelligence
A repeated complaint that Powerhouse cannot currently solve is not forced into marketing. Mark it as PRODUCT_GAP and feed it to product/portal intelligence with:
- problem evidence;
- affected segment;
- expected value;
- missing capability;
- suggested experiment;
- success metric.

## Quality and privacy gates
- Do not identify or profile forum users.
- Do not invent numbers, quotes or company details.
- Always retain source URL and date.
- Deduplicate repeated signals while preserving recurrence counts.
- Old signals may support a pattern, but current content requires current validation.
- Do not claim representative prevalence from anecdotes.
- Do not publish a capability claim that production evidence cannot support.
- Fail closed on duplicate publication or uncertain provider readback.

## Operating loop
1. Gather new entrepreneur signals.
2. Normalize into the signal schema.
3. Deduplicate and cluster.
4. Validate high-value clusters quantitatively.
5. Score for urgency, recurrence, commercial intent and Powerhouse fit.
6. Feed the canonical problem radar and Opportunity Intelligence.
7. Generate content/opportunity candidates.
8. Publish through existing company LinkedIn/blog gates.
9. Read back publication and performance.
10. Write outcome and learning back to opportunity, problem radar and this skill.


## Canonical PH-Pxxx mapping — 24 september 2026

Fingerprint: `powerhouse-50-problem-library-v1`.

De Probleemradar projecteert vanaf nu ieder genormaliseerd ondernemerssignaal naar een bestaande `PH-Pxxx` uit `config/powerhouse-problem-library.json` wanneer er een geldige match is. De radar mag geen parallelle probleemwaarheid onderhouden.

Regels:
- Voice-of-Customer is standaard `signal`, niet `fact` over een specifiek bedrijf;
- een signaal zonder passende Problem ID wordt als `PROBLEM_LIBRARY_CANDIDATE` opgeslagen met bron/evidence, niet geforceerd gemapt;
- dezelfde Problem ID wordt hergebruikt voor opportunity scoring, content, Frisse Blik, portal-detectie, capability-selectie en outcome-learning;
- impactclaims volgen uitsluitend `OBSERVED`, `ESTIMATED`, `POTENTIAL`;
- confidence en evidence-status blijven zichtbaar en kwalitatieve fora-signalen blijven expliciet niet-representatief.


## Executive cockpit projection — 24 september 2026

Fingerprint: `powerhouse-50-problem-radar-executive-p0-v1`.

De directiecockpit projecteert voortaan maximaal vijf geprioriteerde problemen uit de canonieke `PH-Pxxx`-taal. De cockpit mag geen lokale probleem-ID's of tweede taxonomie tonen.

Verplicht per probleemkaart:
- canonieke `PH-Pxxx`;
- evidence health en confidence;
- impactlabel uitsluitend `OBSERVED`, `ESTIMATED` of `POTENTIAL`;
- eerstvolgende actie;
- capability-koppeling;
- outcome-meetlat;
- uitklapbaar antwoord op “Waarom zegt Powerhouse dit?” met bronreferenties en root-cause-status.

Onbekende impactlabels degraderen fail-safe naar `POTENTIAL`. Ongeldige probleem-ID's worden niet in de directieprojectie opgenomen.

## Mens, werk & organisatie — P0 people domain

Fingerprint: `powerhouse-people-problem-radar-p0-v1`.

De MKB Probleemradar behandelt personele problematiek als first-class canonieke probleemlaag en niet als losse HR-widget. De canonieke people-problemen zijn:
- `PH-P031` ziekteverzuim structureel hoog;
- `PH-P032` langdurig verzuim en re-integratierisico;
- `PH-P033` werkdruk en overbelasting;
- `PH-P034` personeelsverloop te hoog;
- `PH-P035` werving en vacaturevervulling stagneert;
- `PH-P036` skills-gap en onvoldoende ontwikkeling;
- `PH-P037` personeelskosten drukken marge;
- `PH-P038` HR-compliance en personeelsdossiers niet op orde;
- `PH-P039` leiderschap en teamdynamiek veroorzaken uitval of vertrek;
- `PH-P040` sociale of fysieke arbeidsveiligheid onder druk.

Regels:
- externe CBS/UWV/TNO/branchecijfers zijn context/benchmark en nooit zelfstandig bewijs dat een tenant het probleem heeft;
- Voice-of-Customer-signalen blijven kwalitatief en niet-representatief;
- interne HRM/verzuim/payroll/planning/ATS/LMS/finance-evidence krijgt prioriteit;
- people-problemen mogen causale ketens vormen, bijvoorbeeld vacaturekrapte → werkdruk → verzuim → capaciteitstekort;
- nooit medische diagnoses, mentale toestand of gevoelige persoonskenmerken afleiden;
- executive surfaces tonen standaard alleen geaggregeerde/teamniveau signalen en nooit identificeerbare gezondheids- of klachtdata;
- impactclaims blijven uitsluitend `OBSERVED`, `ESTIMATED` of `POTENTIAL`.


## Cross-domain intelligence — alles werkt met alles

People-problemen zijn geen apart HR-eiland. Elke canonieke `PH-Pxxx` wordt als node in dezelfde Powerhouse problem graph behandeld en kan evidence-gedreven relaties hebben naar andere domeinen.

Verplichte projecties voor relevante people-signalen:
- executive cockpit: prioriteit, impact, bewijs, eerstvolgende actie, capability en outcome;
- finance: personeelskosten, verzuimkosten, vervangingskosten, omzet/marge per FTE;
- operations: beschikbare capaciteit, overuren, backlog, planning en throughput;
- sales: capaciteitsgebonden omzetrisico, responstijd, churn/service-impact;
- knowledge: sleutelpersoonafhankelijkheid, bus factor, onboarding en expert dependency;
- risk/compliance: re-integratietermijnen, HR-dossiers, arbeidsveiligheid en continuïteit;
- opportunity scoring: triggersterkte × impact × confidence × urgentie;
- content/acquisitie: dezelfde Problem ID, trigger, sectorcontext en beslisser;
- outcome learning: baseline → interventie → verwacht resultaat → gemeten resultaat → learning.

Preventieregel: nooit een nieuw people-dashboard, probleem-ID of causaliteitsmodel bouwen als parallelle waarheid. Nieuwe detectie, content, cockpitkaarten en commerciële routes projecteren altijd vanuit dezelfde canonieke Problem Library en cross-domain graph.
## LIVE_PROVEN executive problem projection — 24 september 2026

Fingerprint: `powerhouse-50-problem-radar-chat-closure-20260924-v1`.

De Problem Radar gebruikt één canonieke keten:
`TRIGGER → PH-Pxxx → EVIDENCE → IMPACT → ACTION → CAPABILITY → OUTCOME → VERIFIED VALUE → LEARNING`.

Verplicht:
- executive start toont maximaal vijf problemen;
- alleen canonieke `PH-Pxxx` IDs;
- evidence health/confidence en “Waarom zegt Powerhouse dit?”;
- impact uitsluitend `OBSERVED`, `ESTIMATED` of `POTENTIAL`;
- actie, capability en outcome blijven gekoppeld;
- gerealiseerde waarde telt alleen met execution + verification + evidence;
- merge/preview/deploy-start is geen LIVE_BEWEZEN; provider-readback blijft verplicht.



## People evidence source registry — 24 september 2026

Fingerprint: `powerhouse-people-evidence-source-registry-v1`.

Voor `PH-P031` t/m `PH-P040` is `config/powerhouse-people-evidence-sources.json` de canonieke externe bronlaag. Iedere benchmark- of juridische contextclaim moet naar een expliciete bron uit dat register verwijzen, de toepasselijke `PH-Pxxx` bewaren en vóór actuele publicatie op freshness/status worden gecontroleerd.

Permanent:
- externe bronnen zijn nooit tenant-bewijs;
- CBS/TNO-statistiek is benchmarkcontext;
- Arbeidsinspectie/Rijksoverheid is risico-, juridische of beleidscontext;
- wetsvoorstellen/beleidsvoornemens blijven expliciet voorstel en mogen niet als geldend recht worden gepresenteerd;
- actuele claims falen dicht wanneer freshness/status niet opnieuw is geverifieerd;
- dezelfde bronprovenance loopt mee naar cockpit, evidence drawer, content en opportunity intelligence.


## Canonical intake, opslag en projectie — 25 september 2026

Fingerprint: `powerhouse-problem-radar-canonical-intake-v1`.

Iedere nieuwe of veranderde Nederlandse MKB-bron of ondernemerssignaal loopt verplicht via `config/powerhouse-problem-radar-intake-contract.json`.

Standaardketen:
`bron -> evidence-opslag -> deduplicatie -> bestaande PH-Pxxx -> Probleemradar -> portal/customer intelligence -> opportunity/content -> outcome -> learning`.

Permanent:
- een geaccepteerd signaal mag niet als losse research- of contentnotitie eindigen;
- opslag bewaart provenance, bron-/waarnemingsdatum, freshness, confidence, sector/segment, probleem, symptomen, impact en kooptrigger;
- map eerst naar een bestaande `PH-Pxxx`; anders `PROBLEM_LIBRARY_CANDIDATE`;
- dedupe voorkomt dubbele canonical evidence, maar behoudt recurrence;
- externe evidence blijft context/benchmark totdat tenant-evidence relevantie aantoont;
- portalprojectie gebruikt uitsluitend `OBSERVED`, `ESTIMATED` of `POTENTIAL` en behoudt “Waarom zegt Powerhouse dit?”;
- dezelfde evidence mag blog- en LinkedIn-bedrijfskandidaten voeden volgens probleem -> symptomen -> impact -> oorzaak/data -> aanpak -> capability -> meetbaar resultaat -> CTA;
- duplicate content angles en onbewezen publicatie/readback falen dicht;
- gerealiseerde waarde vereist Verified Value-evidence en schrijft terug naar dezelfde Problem ID.
