# Shared Agent Memory & Cross-System Self-Healing — Design

## Doel
Bedrijfsgeheugen werkt als één agentteam over GitHub, Netlify, Make en Notion. Iedere agent leest dezelfde actuele kennis vóór uitvoering en schrijft iedere materiële fout, recovery, verbetering, kans of contractwijziging terug naar hetzelfde gedeelde geheugen.

Het team is niet alleen self-healing, maar ook self-improving en opportunity-seeking: het detecteert dagelijks aantoonbare kansen op SEO, websitegedrag/conversie, marktpositionering, content, product, distributie, performance, kosten, security en betrouwbaarheid; het test en benut veilige kansen autonoom binnen de afgesproken grenzen.

## Bestaande bronnen
- `AGENTS.md` is het primaire agentcontract.
- `docs/self-healing-agents.md` definieert de autonome herstelcyclus, retrybeleid, fallbacks en stopgrenzen.
- `docs/development-ledger.md` is het repo-ledger voor fouten, fixes, mislukte pogingen, regressiegates, verbeteringen, kansen en bewezen deploys.
- Make BG166 is de centrale Error & Learning Ledger Writer.
- Make BG167 is de Shared Multi-Agent Team Context Hub.
- Make BG168 is de Multi-Agent Outcome & Learning Router.
- BG165/BG159 zijn runtime/status authorities; BG162/BG160 sturen en voeren veilige optimalisaties/reparaties uit.

## Eén teamcontract
Iedere agent moet vóór werk:
1. `AGENTS.md` en relevante repo-runbooks lezen;
2. de laatste gedeelde teamcontext ophalen;
3. de specialistische eigenaar van het probleem of de kans bepalen;
4. bekende fingerprints, eerdere fixes en eerdere experimenten hergebruiken;
5. geen eerder mislukte aanpak herhalen zonder nieuw bewijs;
6. conflicterende parallelle initiatieven voorkomen door dezelfde opportunity/error fingerprint te gebruiken.

Iedere materiële uitkomst moet bevatten:
- source system;
- agent/component;
- fingerprint;
- failure/improvement/opportunity class;
- symptoom, signaal of kans;
- impact;
- root cause of opportunity rationale;
- mislukte pogingen/eerdere experimenten;
- gekozen fix/optimalisatie/experiment;
- regressietest/gate;
- rollback/last-known-good;
- exact commit/deploy/runtimebewijs;
- kosten/performance/security/SEO/conversie-impact indien relevant;
- status: observed, qualified, testing, fixed, verified, guarded, optimized, won, rejected of blocked-at-boundary.

## Cross-system dataflow
### GitHub/Netlify → gedeelde kennis
De Self Heal-watch produceert na iedere materiële run één compact JSON outcome-record. Dat record wordt:
1. append-only in `docs/development-ledger.md` vastgelegd;
2. via de centrale bridge aan BG168 aangeboden;
3. door BG168 geclassificeerd;
4. via BG166 in het Powerhouse-leergeheugen opgeslagen;
5. waarna BG167 `team-context:latest` vernieuwt.

### Make/Notion → repo-kennis
Materiële Make/Notion-fouten, verbeteringen en kansen blijven via BG168/BG166 lopen. Voor repo-relevante lessen wordt een compacte, dedupliceerbare ledger-entry voorbereid zodat repo-agents dezelfde foutklasse of opportunity kennen. Geen secrets, tokens, PII of publicatiecontent worden gekopieerd.

## Bridge contract
Een gedeeld `learning_event` gebruikt minimaal:
```json
{
  "type": "ERROR|RECOVERY|IMPROVEMENT|OPPORTUNITY|EXPERIMENT_RESULT|CONTRACT_CHANGE",
  "source": "github|netlify|make|notion|web|analytics|search|market|competitor|customer-signal",
  "component": "string",
  "fingerprint": "stable-string",
  "severity": "info|warn|error|critical",
  "root_cause": "optional string",
  "opportunity_rationale": "optional string",
  "evidence_score": "optional 0-100",
  "novelty_score": "optional 0-100",
  "business_impact_score": "optional 0-100",
  "confidence": "optional 0-1",
  "owner_agent": "string",
  "action": "string",
  "verification": "string",
  "rollback": "string",
  "commit_sha": "optional",
  "deploy_id": "optional",
  "regression_test": "string",
  "cost_impact": "optional",
  "performance_impact": "optional",
  "security_impact": "optional",
  "seo_impact": "optional",
  "conversion_impact": "optional"
}
```

## Opportunity Intelligence
### Doel
Het team zoekt actief naar gaten die Bedrijfsgeheugen kan benutten en zet sterke signalen om in meetbare acties, niet alleen adviezen.

### Bronnen
Opportunity-signalen mogen komen uit onder meer:
- search/SEO data: rankings, impressions, CTR, query gaps, crawl/index issues, SERP changes;
- websitegedrag: routegebruik, CTA's, funnels, bounce/exit, engagement, errors, performance, device/browserverschillen;
- markt/concurrenten: pricing, proposities, features, messaging, content, funding, partnerships, nieuwe categorieën;
- klant- en CRM-signalen: terugkerende vragen, bezwaren, verloren deals, koopfasen, response/outcome-data;
- externe publieke bronnen: nieuws, regelgeving, technologiewijzigingen, leveranciers, platformwijzigingen, community-discussies en relevante benchmarks;
- interne systeemdata: Make-credits, latency, fouten, security findings, content performance en deployment quality.

### Kwalificatie
Een kans wordt niet gebouwd alleen omdat hij nieuw is. Iedere kans krijgt minimaal:
1. **Evidence score** — kwaliteit en onafhankelijkheid van bewijs;
2. **Novelty score** — is dit echt nieuw versus bestaand geheugen/backlog?;
3. **Business impact score** — potentiële omzet, leads, SEO, conversie, kosten, snelheid, risico of strategische waarde;
4. **Effort/risk** — klein, middel, groot plus blast radius;
5. **Owner agent** — één specialist is eindverantwoordelijk;
6. **Hypothese + metric** — wat moet aantoonbaar verbeteren?;
7. **Rollback** — hoe terug naar last-known-good?;
8. **Execution class** — autonomous-safe, preview-experiment, governed-review of blocked-boundary.

### Prioritering
Standaard prioriteitsscore:
`priority = evidence × impact × confidence / max(effort, 1)`
waar security/continuity-critical bevindingen altijd voorrang krijgen op commerciële experimenten.

### Uitvoering
Voor een `autonomous-safe` of `preview-experiment` kans:
1. dedupe tegen bestaand geheugen/experimenten;
2. eigenaar aanwijzen;
3. baseline vastleggen;
4. minimale wijziging/experiment bouwen;
5. regressie- en veiligheidschecks draaien;
6. alleen preview/test deployen;
7. exact deploy/runtime/SEO/performance-resultaat meten;
8. behouden wanneer aantoonbaar beter en binnen grenzen;
9. automatisch rollbacken bij regressie;
10. resultaat als `EXPERIMENT_RESULT` terugschrijven zodat alle agents leren.

### Sprint in het gat
Bij een sterk extern signaal mag het team niet blijven hangen in analyse. Als evidence, impact, scope en rollback voldoende zijn, maakt het team zelfstandig de kleinste testbare versie: landingpage/SEO-cluster, contentverbetering, navigatie-/CTA-experiment, caching/performancefix, security-hardening, integratie-adapter, dataflow of andere previewbare productverbetering. Daarna beslist bewijs, niet enthousiasme.

## Self-healing regels
De bestaande lus blijft bindend:
**detect → evidence → root cause → regression gate → minimal repair → retest → preview deploy → exact deploy verification → ledger → prevention automation.**

Een agent mag bij een veilig oplosbare fout niet eindigen met alleen advies.

## Self-improving regels
Voor verbeteringen/kansen geldt:
**observe → dedupe → qualify → baseline → hypothesis → minimal experiment → verify → compare → keep/rollback → learn → distribute.**

Een agent mag een sterke, veilig testbare kans niet eindeloos als advies laten staan als hij die binnen preview/testgrenzen zelf kan bouwen en meten.

## Continuïteit
- Geen scenario/workflow/site-stop als normale herstelactie.
- Laatste groene preview blijft beschikbaar.
- Nieuwe defecte build wordt geïsoleerd, niet als acceptatieversie gepromoveerd.
- Externe storing gebruikt cache/last-known-good waar technisch verantwoord.
- Maximaal twee identieke retries zonder nieuwe informatie; daarna hypothese/fallback wijzigen.

## Kosten en performance
Te duur of te traag betekent niet stoppen. Agents proberen in volgorde:
1. dedupe;
2. cache/precomputed state;
3. delta i.p.v. full read;
4. kleinere payload;
5. batch/concurrency-optimalisatie;
6. polling verlagen als SLA dat toelaat;
7. deterministic logic i.p.v. AI;
8. één specialist i.p.v. multi-agent chain;
9. non-critical enrichment uit critical path.

Iedere materiële optimalisatie krijgt before/after bewijs en rollback. Dagelijks moet het team minimaal de grootste kosten- en performanceverspillers opnieuw rangschikken en de veiligste hoogste-impact verbetering uitvoeren of als governed candidate vastleggen.

## Security
Security is een permanent teamdoel en geen losse audit. Nieuwe dependencies, externe bronnen, dataflows, workflows en deploys worden beoordeeld op secrets exposure, permissies, supply-chain risico, inputvalidatie, data-minimalisatie en blast radius. Security-critical bevindingen mogen commerciële experimenten preëmpten. Onveilige side effects worden geïsoleerd; de kernservice blijft waar mogelijk in safe mode beschikbaar.

## Veiligheidsgrenzen
Nooit autonoom:
- `main`/productie mergen of overschrijven;
- secrets/credentials/permissies wijzigen;
- security-controls verzwakken;
- destructieve/onherroepelijke datamutaties uitvoeren;
- betaalde resources/abonnementen verhogen;
- juridisch/financieel bindende acties uitvoeren.

Binnen deze grenzen is zelfstandig oplossen en veilig experimenteren de standaard.

## Componenten
### Repo Self Heal-watch
Observeert previewbranch, CI/build en Netlify preview. Repareert veilige fouten zelfstandig en emit `learning_event`.

### Opportunity Scout
Deterministische/goedkope intake van externe en interne signalen. Normaliseert bronnen, dedupliceert, scoort bewijs/impact/novelty en routeert alleen gekwalificeerde kansen naar de juiste specialist. AI wordt pas gebruikt wanneer classificatie/synthese aantoonbaar waarde toevoegt.

### Shared Learning Bridge
Kleine deterministische bridge; geen AI. Dedupliceert op fingerprint + relevante state/commit en levert alleen compacte technische metadata aan BG168/BG166.

### BG166
Persistente machine-readable fout/verbeter/opportunity-kennis.

### BG167
Bouwt compacte actuele teambriefing met rollen, control-plane contract en nieuwste relevante lessen/kansen. Live status blijft bij BG165/BG159 om dubbele polling te vermijden.

### BG168
Classificeert agentuitkomsten en routeert alleen materiële learning; `NO_ACTION`/gezonde ruis wordt niet gelogd.

## Preventie van kennisdrift
- `AGENTS.md`, `docs/self-healing-agents.md` en deze spec zijn normatief.
- Nieuwe agents zijn production-blocked als zij shared-context read en material-outcome writeback missen.
- Agent 12/Knowledge Governance controleert coverage.
- Agent 11/QA controleert regressiegates.
- Agent 13/Architect beheert cross-scope routing.
- Opportunity-records zonder eigenaar, metric, evidence of rollback mogen niet autonoom worden uitgevoerd.

## Testplan
1. Known-fingerprint test: agent krijgt bekende fout en hergebruikt bestaande fix.
2. New-error test: fout wordt gereproduceerd, gefixt, geverifieerd en in beide ledgers zichtbaar.
3. Improvement test: performance/kostenverbetering wordt als `IMPROVEMENT`, niet `ERROR`, geclassificeerd.
4. Opportunity test: extern SEO/markt-signaal wordt gededupliceerd, gescoord, toegewezen en als preview-experiment uitgevoerd.
5. Experiment-result test: baseline/post-metric bepaalt KEEP of ROLLBACK en wordt teamlearning.
6. Duplicate test: hetzelfde event/commit/signaal veroorzaakt geen dubbele materiële learning.
7. Preview continuity test: kapotte nieuwe deploy laat last-known-good beschikbaar.
8. Boundary test: wijziging aan main/secrets/destructieve actie wordt geblokkeerd na maximale veilige voorbereiding.
9. Cross-agent test: een les van repo-agent is bij de volgende Make-agenttaak zichtbaar in shared context.
10. Cost test: bridge/contextrefresh gebruikt geen AI en geen volledige scenario-inventaris per event.
11. Security preemption test: critical security finding krijgt voorrang boven commercieel experiment zonder volledige service-stop.
12. SEO/web test: kans bevat baseline, hypothese en meetbare query/CTR/conversie/performance metric.

## Definition of Done
De integratie is pas PROVEN als:
- de repo-watch een echte previewfout zelfstandig heeft hersteld;
- exact commit + Netlify preview groen zijn geverifieerd;
- dezelfde fout/fix in repo-ledger én Powerhouse shared learning zichtbaar is;
- BG167 daarna de nieuwe les aan een volgende agent levert;
- een echte opportunity van externe/interne bron is gekwalificeerd en als veilige previewtest uitgevoerd;
- het experiment een meetbaar KEEP/ROLLBACK-resultaat heeft teruggeschreven;
- duplicate events/signalen geen dubbele learning creëren;
- `main`/productie ongemoeid is gebleven;
- kosten/performance van de kennis- en opportunitybridge gemeten en begrensd zijn.
