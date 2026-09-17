# Powerhouse Execution Resilience

## Doel

Deze standaard voorkomt dat tijdelijke client-, netwerk-, streaming-, sessie-, tool-, worker- of modelonderbrekingen leiden tot verloren werk, dubbele side effects, een valse eindstatus of een workflow die stilvalt.

De canonieke machineleesbare authority is `config/powerhouse-execution-resilience-v1.json`. Runtime-beslislogica staat in `brain/guards/execution-resilience.mjs`. De duurzame databaseprojectie staat in `supabase/migrations/20260917083000_powerhouse_execution_resilience_v1.sql`; de production watchdog-wiring staat in `supabase/migrations/20260917090000_powerhouse_execution_resilience_watchdog_schedule_v1.sql`. Regressiedekking staat in `tests/brain-execution-resilience-guard.test.mjs` en valt onder de bestaande `*guard*.test.mjs` CI-familie.

## Niet-onderhandelbare regel

Een onderbreking is geen taakafronding. Meldingen als `De netwerkverbinding is verbroken`, `Streaming onderbroken`, `Redeneren mislukt` en `Gestopt met nadenken` worden als recoverable interruption behandeld zolang geen geldige terminale uitkomst is bewezen.

Alle materiële chats en agents moeten via de bestaande Brain chat-learning preflight deze contractbron meekrijgen. Er ontstaat geen tweede recovery-database of parallelle waarheid: recovery gebruikt dezelfde canonieke Powerhouse-state, obligations, evidence en learning writeback.

## State machine

`PENDING -> RUNNING -> EFFECT_APPLIED -> VERIFIED -> COMPLETED`

Bij iedere onverwachte onderbreking van een niet-terminale run:

`PENDING|RUNNING|EFFECT_APPLIED|VERIFIED -> RECOVERY_REQUIRED`

Alleen `COMPLETED` en `BLOCKED_HARD_BOUNDARY` zijn terminale run-states. `RECOVERY_REQUIRED`, een afgebroken modelrun, een verdwenen stream of een clientfout zijn nooit terminale success-states.

## Durable execution

Voor multistep of async werk worden minimaal bewaard: run-id, obligation/task-id, owner agent, actuele state, laatste bewezen checkpoint, heartbeat, retryteller, idempotency key, side-effect-state, laatste bewezen side effect, interruption-class, evidence references en timestamp.

De UI/chatstream is dus niet de authority voor voortgang. De duurzame Powerhouse-state is dat wel.

### Canonieke runtimeprojectie

De database-implementatie hergebruikt bewust bestaande Powerhouse/Brain-componenten in plaats van een nieuwe execution database te introduceren:

- `brain_operations` blijft de operationele authority. De bestaande unieke `(capability_id, operation_type, idempotency_key)` beschermt operationele identiteit. Het abstracte `RECOVERY_REQUIRED` wordt weergegeven als `status='RESULT_UNKNOWN'` plus `evidence.execution_resilience.state='RECOVERY_REQUIRED'`.
- `brain_reconciliation_jobs` blijft de recovery queue en bevat leases, `attempt_count`, `max_attempts`, no-progress-detectie en `next_attempt_at`.
- `brain_obligations` blijft de authority voor verschuldigde outcomes; een interruption mag obligations niet laten verdwijnen.
- bestaande event/idempotency-mechanismen blijven de dedupe-authority. Er wordt geen tweede idempotency store toegevoegd.

De basis-migratie voegt drie compositiefuncties toe: `powerhouse_execution_heartbeat_v1`, `powerhouse_mark_execution_interrupted_v1` en `powerhouse_execution_resilience_watchdog_v1`. Zij schrijven checkpoints in bestaande operation evidence en plannen recovery via de bestaande `brain_schedule_reconciliation` route.

Iedere interruption-cycle krijgt een versiegebonden reconciliation key (`execution-resilience:<operation-id>:v<version>`), zodat een latere onafhankelijke interruption van dezelfde operation niet botst met een reeds afgesloten historisch recovery-jobrecord.

## Watchdog en heartbeat

Langlopende of asynchrone runs krijgen heartbeat/lease-detectie. Een ontbrekende of verlopen heartbeat op een niet-terminale run veroorzaakt `RECOVERY_REQUIRED`. De standaard timeout is 120 seconden tenzij een domeinspecifiek contract aantoonbaar een andere waarde vereist.

In productie wordt `powerhouse_execution_resilience_watchdog_v1()` iedere minuut aangeroepen via pg_cron job `powerhouse-execution-resilience-watchdog-v1`. De scheduler-wiring is source-controlled en idempotent: een bestaande job met dezelfde naam wordt eerst vervangen.

De watchdog hervat nooit blind. Hij markeert alleen de canonical operation als outcome-onzeker en plant een reconciliation job. De domeinspecifieke recovery executor moet daarna eerst actuele state en reeds uitgevoerde side effects teruglezen. Er is bewust geen generieke side-effect replay-worker toegevoegd: publicaties, mails, deploys en andere mutaties hebben verschillende readback- en idempotency-contracten en mogen niet door een generieke scheduler opnieuw worden uitgevoerd.

## Idempotency en side effects

Voor iedere muterende replay geldt:

1. lees extern of canoniek bewijs terug;
2. als de side effect al `VERIFIED` is: overslaan;
3. als de side effect mogelijk is toegepast maar onbewezen is: eerst readback;
4. voer alleen opnieuw uit met idempotency key of aantoonbare dedupe-proof;
5. zonder bescherming wordt de mutatie fail-closed geblokkeerd totdat veilige reconciliatie mogelijk is.

Dit voorkomt dubbele posts, dubbele mails, dubbele databasewrites, dubbele deploys en vergelijkbare replay-schade.

## Retrybeleid

Retries gebruiken bounded exponential backoff met jitter. Standaard: 1 seconde start, maximaal 60 seconden, 20% jitter, maximaal vijf pogingen. Maximaal twee identieke retries zijn toegestaan zonder nieuwe evidence. Daarna moet de agent van hypothese veranderen, een andere oorzaakgerichte fix kiezen of een bewezen fallback gebruiken.

Repeated external failure hoort achter een circuit breaker te komen zodat een defecte dependency niet onbeperkt resources verbruikt of side effects blijft triggeren. De bestaande `brain_reconciliation_jobs` lease/no-progress-mechaniek is de duurzame recoveryprojectie; applicatie-/agentlogica blijft verantwoordelijk voor de contractuele backoff/jitter en het veranderen van hypothese na identieke retries.

## Recovery sequence

Een recovery-run voert in deze volgorde uit:

1. lees de actuele canonieke Powerhouse-state;
2. laad het laatste bewezen checkpoint;
3. reconcile open obligations;
4. readback reeds uitgevoerde side effects;
5. classificeer de interruption;
6. pas idempotency/dedupe-guard toe;
7. hervat alleen resterende stappen;
8. verifieer outcome en side effects;
9. schrijf incident, recovery, evidence en preventie terug;
10. ververs shared team context.

## Production proof — 17 september 2026

De resilience-keten is op de productie-Supabase daadwerkelijk uitgevoerd met een synthetische, side-effect-vrije selftest. Bewijs:

- operation `fe02a49c-f57c-48cf-ad75-6dc313f99096` kreeg een duurzaam heartbeat/checkpoint `prod-proof:checkpoint-1`;
- na stale-heartbeat-detectie werd de operation `RESULT_UNKNOWN` met `execution_resilience.state=RECOVERY_REQUIRED`, `interruption_class=WORKER_LOST` en `readback_before_replay=true`;
- dezelfde cycle maakte canonical reconciliation job `0b2ae9b0-e315-4a95-8de3-dbbfe8f86790` met reden `EXECUTION_RESILIENCE_RECOVERY`, state `PENDING`, `max_attempts=5` en trigger `STALE_HEARTBEAT`;
- pg_cron job `powerhouse-execution-resilience-watchdog-v1` staat actief op `* * * * *` en roept exact `select public.powerhouse_execution_resilience_watchdog_v1();` aan;
- de databasefuncties zijn niet uitvoerbaar voor `public`, `anon` of `authenticated`; uitvoering is beperkt tot `service_role`.

Dit bewijst durable checkpointing, stale-run detectie en veilige enqueue naar de bestaande reconciliation authority. Het bewijst uitdrukkelijk niet dat een willekeurige domeinspecifieke side effect generiek mag worden gereplayed; dat blijft fail-closed en vereist readback plus het juiste idempotency/dedupe-contract.

### CAS/version learning

Tijdens de production selftest gaf een heartbeat-aanroep met een vooraf aangenomen versienummer een `STATE_VERSION_CONFLICT`, terwijl een direct vooraf teruggelezen actuele `brain_operations.version` wel veilig door de compare-and-set guard kwam. De precieze oorzaak van de eerste mismatch is niet bewezen en wordt daarom niet verzonnen. De preventieregel is wel hard: lees onmiddellijk vóór iedere CAS-mutatie de actuele operation/version terug en gebruik die versie; behandel een conflict als bewijs van concurrentie/drift en retry niet blind.

## Learning writeback

Iedere materiële interruption/recovery legt minimaal vast: run-id, correlation-id indien beschikbaar, interruption-class, laatste checkpoint, laatste heartbeat, reeds uitgevoerde side effects, open obligations, herstelpogingen, readback-evidence, uitkomst, root cause indien bekend en de nieuwe preventie-/regressieregel.

Een terugkerende fout mag niet slechts opnieuw worden geretryd; hij moet waar technisch mogelijk leiden tot een structurele guard, test, contract- of runtimeverbetering. De eerste implementatietest vond direct een lokalisatiegat: de classifier herkende aanvankelijk Engelse netwerktermen, maar niet `netwerk`/`verbinding`. Dat is als regressie vastgelegd en structureel gecorrigeerd.

De eerste Shared Agent Memory-run vond daarna een governancefout: de nieuwe regressietest bestond wel, maar draaide nog nergens in CI. De test is onder de bestaande guard-regressiefamilie gebracht. Een latere verificatie bracht nog twee deployment-lessen aan het licht: merged code is niet hetzelfde als productie-state, en een runtimefunctie zonder scheduler-wiring levert nog geen autonome watchdog. Beide worden voortaan afzonderlijk bewezen met source-control parity en production readback.

## Harde grenzen

Autonome recovery stopt alleen op de bestaande harde grenzen: ontbrekende secrets/credentials/permissies, het verzwakken van security-controls, destructieve of onomkeerbare datamutaties, verhoging van betaalde externe resources of juridisch/financieel bindende acties. De open obligation en het exacte hervatpunt blijven dan duurzaam bewaard.

## Definition of Done

Execution resilience is pas groen wanneer:

- de contractbron actief en door de chat-learning preflight verplicht ingelezen wordt;
- regressietests de bekende netwerk-, streaming- en reasoning-interruptions herkennen;
- de resilience-regressie door de bestaande verplichte guard-testfamilie wordt uitgevoerd;
- niet-terminale interruption altijd naar `RECOVERY_REQUIRED` gaat;
- muterende replay zonder readback/idempotency/dedupe wordt geblokkeerd;
- durable checkpoints in de bestaande canonical Brain runtime kunnen worden geschreven;
- stale runs door watchdog-logica detecteerbaar zijn en een bestaande reconciliation job krijgen;
- de watchdog daadwerkelijk periodiek in productie draait en dit met cron-readback is bewezen;
- source control, migrations en productie-runtime dezelfde scheduler-contractversie bevatten;
- recovery vanaf het laatste bewezen checkpoint kan hervatten;
- retrylimieten blinde lussen voorkomen;
- recovery-uitkomst en learning canoniek worden teruggeschreven;
- er geen parallelle run/recovery/idempotency database is ontstaan.

## Bekende platformgrens

De ChatGPT-client of een extern platform kan een specifieke UI/modelrun nog steeds beëindigen. Powerhouse kan die platform-UI niet afdwingen. Wat Powerhouse wel afdwingt, is dat de onderliggende taak, obligation, checkpoint en side-effect-truth buiten die tijdelijke stream blijven bestaan en veilig hervatbaar zijn zodra een volgende worker/chat/agent kan uitvoeren.
