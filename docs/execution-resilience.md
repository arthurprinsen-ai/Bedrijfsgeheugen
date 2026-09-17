# Powerhouse Execution Resilience

## Doel

Deze standaard voorkomt dat tijdelijke client-, netwerk-, streaming-, sessie-, tool-, worker- of modelonderbrekingen leiden tot verloren werk, dubbele side effects, een valse eindstatus of een workflow die stilvalt.

De canonieke machineleesbare authority is `config/powerhouse-execution-resilience-v1.json`. Runtime-beslislogica staat in `brain/guards/execution-resilience.mjs`. Regressiedekking staat in `tests/execution-resilience.test.mjs`.

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

## Watchdog en heartbeat

Langlopende of asynchrone runs krijgen heartbeat/lease-detectie. Een ontbrekende of verlopen heartbeat op een niet-terminale run veroorzaakt `RECOVERY_REQUIRED`. De standaard timeout is 120 seconden tenzij een domeinspecifiek contract aantoonbaar een andere waarde vereist.

De watchdog hervat niet blind. Eerst wordt de actuele canonieke state teruggelezen en worden reeds uitgevoerde side effects gereconcilieerd.

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

Repeated external failure hoort achter een circuit breaker te komen zodat een defecte dependency niet onbeperkt resources verbruikt of side effects blijft triggeren.

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

## Learning writeback

Iedere materiële interruption/recovery legt minimaal vast: run-id, correlation-id indien beschikbaar, interruption-class, laatste checkpoint, laatste heartbeat, reeds uitgevoerde side effects, open obligations, herstelpogingen, readback-evidence, uitkomst, root cause indien bekend en de nieuwe preventie-/regressieregel.

Een terugkerende fout mag niet slechts opnieuw worden geretryd; hij moet waar technisch mogelijk leiden tot een structurele guard, test, contract- of runtimeverbetering.

## Harde grenzen

Autonome recovery stopt alleen op de bestaande harde grenzen: ontbrekende secrets/credentials/permissies, het verzwakken van security-controls, destructieve of onomkeerbare datamutaties, verhoging van betaalde externe resources of juridisch/financieel bindende acties. De open obligation en het exacte hervatpunt blijven dan duurzaam bewaard.

## Definition of Done

Execution resilience is pas groen wanneer:

- de contractbron actief en door de chat-learning preflight verplicht ingelezen wordt;
- regressietests de bekende netwerk-, streaming- en reasoning-interruptions herkennen;
- niet-terminale interruption altijd naar `RECOVERY_REQUIRED` gaat;
- muterende replay zonder readback/idempotency/dedupe wordt geblokkeerd;
- stale runs door watchdog-logica detecteerbaar zijn;
- recovery vanaf het laatste bewezen checkpoint kan hervatten;
- retrylimieten blinde lussen voorkomen;
- recovery-uitkomst en learning canoniek worden teruggeschreven.

## Bekende platformgrens

De ChatGPT-client of een extern platform kan een specifieke UI/modelrun nog steeds beëindigen. Powerhouse kan die platform-UI niet afdwingen. Wat Powerhouse wel afdwingt, is dat de onderliggende taak, obligation, checkpoint en side-effect-truth buiten die tijdelijke stream blijven bestaan en veilig hervatbaar zijn zodra een volgende worker/chat/agent kan uitvoeren.
