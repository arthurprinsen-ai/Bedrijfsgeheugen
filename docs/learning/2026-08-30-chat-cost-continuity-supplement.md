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

### BG89_PROJECTED_SCORER_EQUIVALENCE
Fingerprint: `bg89|projected-66-fields|merged-scorer-equivalent|2026-08-30-v1`.

- Live BG89 blueprintanalyse bewees dat de twee scorers samen 64 unieke business-properties lezen; eligibility/write-compatibility brengt de projected contractset op 66 scorer-properties plus attributionvelden vóór cutover.
- Repeated Notion `filter_properties[]` in de URL werkt betrouwbaar; een 4-property single-record probe was 2 ops / 3 credits / 3.1 KB.
- Projected-vs-full comparator gebruikt exact de live BG89 stage-1 en stage-2 code uit de blueprint, niet een handmatige benadering.
- Vier representatieve klassen waren exact equivalent, met nul diff-keys in beide stages: inbound LinkedIn DM, BG98 research, native social measurement en `post_reply_prepared` cockpitactie.
- De twee live scorers zijn daarnaast in één code-operation gewrapt zonder formulewijziging; dezelfde vier klassen hadden nul merged-stage diff-keys.
- Volledige 66-property projected eligible batch van 10 records: 3 ops / 5 credits / 70,744 bytes. Recente brede Watch-batch: ongeveer 931 KB. Dat is circa 92% minder read-transfer.
- Read-only batch-shadow met projected query + één merged scorer per 10 kandidaten: 16 ops / 33 credits / 235,941 bytes. Dit bevat nog tijdelijke shadow-overhead voor live blueprint-read + code-build en geen writes; de uiteindelijke static successor hoort die overhead niet te hebben.
- Cutoverregel: scorer moet statisch/versioned worden ingevroren; geen permanente runtime dependency op de retired/legacy BG89-blueprint.
- Attribution Root Key/Touch Key moeten expliciet in de projection blijven, ook al gebruikt de scorer ze niet, omdat de writeback ze preservation-first doorgeeft.

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
- Voor projecties telt niet alleen scorer-consumption: ook downstream write-preservationvelden zoals attribution horen in het minimal contract.

## Open vervolg
1. Freeze de bewezen merged BG89 scorer statisch in een inactive successor.
2. Voeg Attribution Root Key en Attribution Touch Key toe aan de projected contractset en test preservation.
3. Voer één bounded write-canary uit op één echt backlogrecord; vergelijk alle beschermde outputvelden en attribution.
4. Pas daarna maximaal 10 per batch, activeer successor en retire oude Watch-owner compatibility-first.
5. Trace BG145 Chrome caller/timer; pas requestcadence alleen aan met exacte caller + freshness evidence.
6. Voeg deze fingerprints uiteindelijk toe aan promotion/QA admission checks zodat regressies release-blocking worden.
