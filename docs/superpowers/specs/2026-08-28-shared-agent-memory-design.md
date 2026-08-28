# Shared Agent Memory & Cross-System Self-Healing — Design

## Doel
Bedrijfsgeheugen werkt als één agentteam over GitHub, Netlify, Make en Notion. Iedere agent leest dezelfde actuele kennis vóór uitvoering en schrijft iedere materiële fout, recovery, verbetering of contractwijziging terug naar hetzelfde gedeelde geheugen.

## Bestaande bronnen
- `AGENTS.md` is het primaire agentcontract.
- `docs/self-healing-agents.md` definieert de autonome herstelcyclus, retrybeleid, fallbacks en stopgrenzen.
- `docs/development-ledger.md` is het repo-ledger voor fouten, fixes, mislukte pogingen, regressiegates en bewezen deploys.
- Make BG166 is de centrale Error & Learning Ledger Writer.
- Make BG167 is de Shared Multi-Agent Team Context Hub.
- Make BG168 is de Multi-Agent Outcome & Learning Router.
- BG165/BG159 zijn runtime/status authorities; BG162/BG160 sturen en voeren veilige optimalisaties/reparaties uit.

## Eén teamcontract
Iedere agent moet vóór werk:
1. `AGENTS.md` en relevante repo-runbooks lezen;
2. de laatste gedeelde teamcontext ophalen;
3. de specialistische eigenaar van het probleem bepalen;
4. bekende fingerprints en eerdere fixes hergebruiken;
5. geen eerder mislukte aanpak herhalen zonder nieuw bewijs.

Iedere materiële uitkomst moet bevatten:
- source system;
- agent/component;
- fingerprint;
- failure/improvement class;
- symptoom en impact;
- root cause;
- mislukte pogingen;
- gekozen fix/optimalisatie;
- regressietest/gate;
- rollback/last-known-good;
- exact commit/deploy/runtimebewijs;
- kosten/performance-impact indien relevant;
- status: observed, fixed, verified, guarded, optimized of blocked-at-boundary.

## Cross-system dataflow
### GitHub/Netlify → gedeelde kennis
De Self Heal-watch produceert na iedere materiële run één compact JSON outcome-record. Dat record wordt:
1. append-only in `docs/development-ledger.md` vastgelegd;
2. via de centrale bridge aan BG168 aangeboden;
3. door BG168 geclassificeerd;
4. via BG166 in het Powerhouse-leergeheugen opgeslagen;
5. waarna BG167 `team-context:latest` vernieuwt.

### Make/Notion → repo-kennis
Materiële Make/Notion-fouten en verbeteringen blijven via BG168/BG166 lopen. Voor repo-relevante lessen wordt een compacte, dedupliceerbare ledger-entry voorbereid zodat repo-agents dezelfde foutklasse kennen. Geen secrets, tokens, PII of publicatiecontent worden gekopieerd.

## Bridge contract
Een gedeeld `learning_event` gebruikt minimaal:
```json
{
  "type": "ERROR|RECOVERY|IMPROVEMENT|CONTRACT_CHANGE",
  "source": "github|netlify|make|notion",
  "component": "string",
  "fingerprint": "stable-string",
  "severity": "info|warn|error|critical",
  "root_cause": "string",
  "action": "string",
  "verification": "string",
  "rollback": "string",
  "commit_sha": "optional",
  "deploy_id": "optional",
  "regression_test": "string",
  "cost_impact": "optional",
  "performance_impact": "optional"
}
```

## Self-healing regels
De bestaande lus blijft bindend:
**detect → evidence → root cause → regression gate → minimal repair → retest → preview deploy → exact deploy verification → ledger → prevention automation.**

Een agent mag bij een veilig oplosbare fout niet eindigen met alleen advies.

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

Iedere materiële optimalisatie krijgt before/after bewijs en rollback.

## Veiligheidsgrenzen
Nooit autonoom:
- `main`/productie mergen of overschrijven;
- secrets/credentials/permissies wijzigen;
- security-controls verzwakken;
- destructieve/onherroepelijke datamutaties uitvoeren;
- betaalde resources/abonnementen verhogen;
- juridisch/financieel bindende acties uitvoeren.

Binnen deze grenzen is zelfstandig oplossen de standaard.

## Componenten
### Repo Self Heal-watch
Observeert previewbranch, CI/build en Netlify preview. Repareert veilige fouten zelfstandig en emit `learning_event`.

### Shared Learning Bridge
Kleine deterministische bridge; geen AI. Dedupliceert op fingerprint + relevante state/commit en levert alleen compacte technische metadata aan BG168/BG166.

### BG166
Persistente machine-readable fout/verbeterkennis.

### BG167
Bouwt compacte actuele teambriefing met rollen, control-plane contract en nieuwste relevante lessen. Live status blijft bij BG165/BG159 om dubbele polling te vermijden.

### BG168
Classificeert agentuitkomsten en routeert alleen materiële learning; `NO_ACTION`/gezonde ruis wordt niet gelogd.

## Preventie van kennisdrift
- `AGENTS.md`, `docs/self-healing-agents.md` en deze spec zijn normatief.
- Nieuwe agents zijn production-blocked als zij shared-context read en material-outcome writeback missen.
- Agent 12/Knowledge Governance controleert coverage.
- Agent 11/QA controleert regressiegates.
- Agent 13/Architect beheert cross-scope routing.

## Testplan
1. Known-fingerprint test: agent krijgt bekende fout en hergebruikt bestaande fix.
2. New-error test: fout wordt gereproduceerd, gefixt, geverifieerd en in beide ledgers zichtbaar.
3. Improvement test: performance/kostenverbetering wordt als `IMPROVEMENT`, niet `ERROR`, geclassificeerd.
4. Duplicate test: hetzelfde event/commit veroorzaakt geen dubbele materiële learning.
5. Preview continuity test: kapotte nieuwe deploy laat last-known-good beschikbaar.
6. Boundary test: wijziging aan main/secrets/destructieve actie wordt geblokkeerd na maximale veilige voorbereiding.
7. Cross-agent test: een les van repo-agent is bij de volgende Make-agenttaak zichtbaar in shared context.
8. Cost test: bridge/contextrefresh gebruikt geen AI en geen volledige scenario-inventaris per event.

## Definition of Done
De integratie is pas PROVEN als:
- de repo-watch een echte previewfout zelfstandig heeft hersteld;
- exact commit + Netlify preview groen zijn geverifieerd;
- dezelfde fout/fix in repo-ledger én Powerhouse shared learning zichtbaar is;
- BG167 daarna de nieuwe les aan een volgende agent levert;
- duplicate events geen dubbele learning creëren;
- `main`/productie ongemoeid is gebleven;
- kosten/performance van de kennisbridge gemeten en begrensd zijn.
