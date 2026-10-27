# Powerhouse Loop Assurance v2

Fingerprint: `powerhouse-loop-assurance-v2`.

## Doel
Voorkomt dat een eerder gesloten Powerhouse-loop ongemerkt later weer open raakt. De laag valideert niet alleen code of deploystatus, maar bewaakt continu de operationele eigenschap **gesloten loop**.

## Canonieke keten
Iedere geregistreerde loop moet actuele evidence hebben voor:
`input → decision → action → readback → outcome → measurement → learning → guard`.

Daarboven geldt: als een scheduler is geregistreerd moet die actief zijn, runtime-evidence mag niet ouder zijn dan de vastgelegde cadence, en `next_expected_at` moet aantoonbaar berekenbaar zijn.

## Status
- **GREEN**: scheduler/runtime en alle acht closure stages zijn actueel.
- **AMBER**: de runtime is niet hard gefaald, maar closure-stage evidence ontbreekt/is stale of de cadence begint te driften.
- **RED**: scheduler ontbreekt/inactief of runtime-evidence ontbreekt/is ouder dan 2× de cadence.

Geen foutmelding is dus niet gelijk aan GREEN.

## Runtime authority
De controller gebruikt bestaande truth:
- `powerhouse_runtime_events`;
- `cron.job`;
- `brain_obligations`;
- loop-stage receipts in `powerhouse_loop_assurance_receipts_v1`.

De afgeleide actuele status staat in `powerhouse_loop_assurance_state_v1`. Dit is assurance-state en geen parallelle business truth.

## Self-healing handoff
Iedere niet-GREEN loop wordt automatisch als `OPERATIONS_ASSURANCE` obligation in de bestaande Brain-obligationruimte gezet. Zodra de loop weer GREEN is, wordt dezelfde obligation `FULFILLED`; er wordt geen tweede queue gemaakt.

## Cadence
`powerhouse-loop-assurance-v2` draait elke vijf minuten via pg_cron.

## Integratiecontract
Nieuwe workflows/capabilities moeten:
1. worden geregistreerd in `powerhouse/assurance/loop-registry.json`;
2. hun runtime/scheduler authority expliciet maken;
3. de acht loop stages via `powerhouse_record_loop_stage_v1` evidence geven;
4. niet-GREEN status als open operational obligation accepteren;
5. hun contract via Powerhouse Assurance CI laten valideren.

Een capability die dit niet kan aantonen is niet production-ready.
