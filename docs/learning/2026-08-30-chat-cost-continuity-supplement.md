# Powerhouse Chat Cost Continuity Supplement — 2026-08-30

Status: append-only handoff voor de nieuwste chatbevindingen bovenop het bestaande cost/reliability-ledger, BG145 recovery-ledger en BG89 eligibility-ledger.

## Permanente werkwijze
Alle materiële kennis uit chats moet worden hergebruikt door nieuwe chats, agents en delivery-workflows. Bewaar minimaal: fingerprint, symptoom, root cause, mislukte aanpak, bewezen fix, regressietest, runtime/production evidence, kosten/performance-effect, rollback en preventieregel. Een technisch groene status is geen eindbewijs; verify het bedoelde outcome.

## Nieuwste bewezen fingerprints

### BG145_SEMANTIC_CONTROL_CORRUPTION
Fingerprint: `bg145|datahub-control-mirror|commercial-scorer-corruption|2026-08-30-v1`.

- Syntactisch geldige control-plane JSON kan semantisch corrupt zijn.
- BG89 behandelde generieke Datahub control-records als commerciële opportunities en overschreef runtimeconfig met commerciële velden.
- Herstel: BG89 exclude `Powerhouse Control Plane Runtime`; herstel alle 12 mirror-records vanuit canonieke Control Plane; test exacte key/value/type/enabled invarianten.
- Nooit opnieuw: alleen HTTP/status/schema/count testen voor control-plane config.
- Minimum regressies: cacheSeconds=300 numeric enabled; remoteRefreshSeconds=60 numeric enabled; releaseGate=true boolean; rollback=true boolean; exact 12 verwachte keys tenzij versioned migration.
- De dedicated canonical source bleef voor Make 404 geven; dus niet blind terugschakelen naar die bron.

### BG89_GENERIC_DATAHUB_NOT_COMMERCIAL
Fingerprint: `bg89|generic-datahub-watch|noncommercial-record-scoring|2026-08-30-v1`.

- Generic Datahub schema betekent niet automatisch commercial signal.
- Baseline BG89 volle batch: ongeveer 31 ops, 51–61 credits, 0.97–1.15 MB elke 2 uur.
- Backlog was 410 ongescoorde records; 234 waren `LinkedIn Radar Heartbeat v21` met expliciet `coverage health only; no AI-call`.
- `network_snapshot` bevatte alleen operationele netwerkcounts maar kreeg ten onrechte Opportunity Score/deadline/WATCH.
- Relevante DM-backfill bevatte wel echte inbound conversatie en human-action context; bronbreed uitsluiten is daarom fout.
- Current eligibility vóór scoring: Duplicate, Control Plane Runtime, Radar Heartbeat, Regression Test, `network_snapshot`, en reeds `Opportunity Updated` worden geweerd.
- Natuurlijke productie-run bewees filter vóór scoring/writeback: 10 triggerrecords, 9 scorer/write invocations, 28 ops / 52 credits / ~931 KB.
- Nooit opnieuw: brede source-exclusion zonder subtype-evidence; Watch-cursor resetten; polling verhogen om backlog weg te werken.

### NOTION_WATCH_NO_FIELD_PROJECTION
Fingerprint: `notion|watchDatabaseItems|wide-page-no-projection`.

- Make `notion:watchDatabaseItems` ondersteunt geen property projection.
- Daardoor blijft brede Datahub transfer bestaan zolang BG89 op deze triggerarchitectuur draait.
- Cost-safe successor-architectuur: `scheduled start -> bounded Notion query -> only unprocessed eligible commercial/evidence records -> only consumed fields -> deterministic scoring -> one deduplicated write`.
- Migratie uitsluitend shadow-first en output-equivalent getest op DM, research/SEO/measurement en action cases vóór cutover.

### NO_PARALLEL_MANUAL_RUN_FOR_EVIDENCE
Fingerprint: `make|verification|natural-run-preferred-over-parallel-canary`.

- Wanneer een natuurlijke execution al loopt, start geen tweede handmatige run alleen om sneller bewijs te krijgen.
- Gebruik de natuurlijke execution als evidence; dubbele starts kunnen dezelfde concurrency/cost amplification veroorzaken die eerder bij BG14 is gevonden.

## Reeds bewezen cost patterns uit dezelfde chat die verplicht herbruikbaar blijven
- Dedupe/gate vóór brede read of AI, niet erna.
- Exact-key Make Data Store GET is in deze omgeving niet betrouwbaar; gebruik dedicated one-record store + bounded list-read.
- Repeated `id[]`/`cols[]` via Make `qs` mapper collapsen; encode arrays expliciet in URL-querystring.
- Agent-context mission-relevant compact maken; permanente invarianten blijven in prompt/contract, dynamische context alleen noodzakelijke facts/latest learnings.
- Healthcheck/no-change-uitkomsten mogen geen false AGENT_ERROR learning veroorzaken.
- Atomic unique-key reservation is een bewezen goedkope dedupe/coalesce primitive.
- Guard-window/due/dedupe/identity eerst evalueren, daarna pas inventory/Notion/AI/API.
- Geen nieuwe AI-media generation zolang transportlaag niet onafhankelijk bewezen is.
- Geen blind retries bij mogelijke externe side-effect success; eerst reconcile extern bewijs.

## Open vervolg
1. Bouw BG89 shadow read-path zonder writes.
2. Vergelijk output-equivalentie op representatieve bestaande records.
3. Pas na groen bewijs bounded projected queue + write-path toe en retire oude Watch-owner compatibility-first.
4. Trace BG145 Chrome caller/timer; pas requestcadence alleen aan met exacte caller + freshness evidence.
5. Voeg deze fingerprints uiteindelijk toe aan promotion/QA admission checks zodat regressies release-blocking worden.
