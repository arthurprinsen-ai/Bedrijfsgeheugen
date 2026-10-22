# Alle Powerhouse-incidenten → herbruikbare preventie voor agents en chats

Datum: 2026-10-22
Fingerprint: `powerhouse|incident-learning|fingerprint-preflight-recurrence-prevention|20261022-v1`
Scope: bestaande Brain/Powerhouse/Heartbeat en alle repository-geautoriseerde agents, chats, delivery-workflows en providers.

## Vastgestelde uitgangssituatie
De repository had al `AGENTS.md`, `docs/learning/powerhouse-failure-learning-contract-v1.md`, `docs/learning/known-error-preflight-contract.md`, `scripts/brain/material-writeback-closure-guard.mjs`, `scripts/brain/powerhouse-skill-projection.mjs`, `brain/learning` en de brede continuïteitsskill. Er is dus geen reden voor een tweede geheugen- of incidentstore. Bestaande automatische afdekking is sterk voor repository-governed werk, maar bewijst niet dat willekeurige niet-aangesloten externe chats/tools volledige foutdetectie en writeback hebben.

## Verplicht protocol
1. **Preflight:** laad actuele open obligations + relevante fingerprints/guards/skillprojectie, lees provider-/prod-/CI-evidence en zoek root-cause-dupes vóór iedere mutatie.
2. **Intake:** log iedere materiële fout met deterministische fingerprint, exacte evidence en `ACTIVE`, `HISTORICAL`, `UNKNOWN` of `RECOVERING` toestand. Geen root cause verzinnen.
3. **Deduplicatie:** bestaande root cause heeft één remediation owner; eerdere occurrences blijven append-only en verhogen telling. Zelfde failure class alleen is niet genoeg om verschillende oorzaken te combineren.
4. **Herstel:** oorzaakgerichte minimale fix + fail-first regressie, bestaande writer/PR/scheduler en side-effect guard; geen CI-groenzetten door tests/security te versoepelen.
5. **Verificatie:** exact candidate SHA, lane/Required/CodeQL, waar van toepassing protected merge en productie/provider-readback, resultaat/outcome; geen `PROVEN` zonder bewijs.
6. **Leerprojectie:** upsert naar `public.brain_failure_registry` langs bestaande Brain authority, `brain/learning` en ledger, afgeleide `powerhouse-learning-skill-index-v1`, relevante skilltargets en nieuwe-agent discovery receipt.
7. **Herhaalcontrole:** bij elke nieuwe occurrence vraag waarom guard en regressie de fout niet voorkwamen; verbeter oorzaak en test, tel recurrence. Een onbereikbare of derdepartij-chat blijft buiten afdwingbare repositorydekking tot die route aan de canonieke ingress is verbonden.

## Historische concrete dossiers om herhaling tegen te gaan
- [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742): bestaande historische CI/SQL-herstelowner; behandel assertions en scope eerlijk, niet als allemaal onafhankelijke root causes.
- [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215): overkoepelende production/acceptance-evidence; groen per release is niet geheel-systeem groen.
- [#4478](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478): cron-mux waarin sommige branchminuten onmogelijk worden geraakt door de ingeschakelde cron.
- [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439): één canonieke publication obligation per kanaal/dag; provider-readback, media-evidence en geen dubbele dispatch.

## Acceptatie
De governancewijziging op een candidate branch is geen bewijs dat alle historische fouten in productie zijn gerepareerd. `LIVE_PROVEN` voor deze borging vereist protected merge, groen regressie/skill-projectie, readback uit actuele main en bewijs dat een volgende agent de nieuwe fingerprint daadwerkelijk uit het canonieke preflight-resultaat terugvindt. Tot die tijd: `CANDIDATE / ACCEPTANCE_PENDING`.

Geen nieuwe opslag, cron, betaalde cloudbranch of onbewezen green override.


## Vervolgcorrectie: verplichte baseline in standaard agentpreflight (22 oktober 2026)

Een read-only audit na de eerste governed merge identificeerde een echt overdrachtsgat: `selectSkillProjection()` retourneerde met lege `fingerprints` én lege `targets` uitsluitend een samenvatting zonder `selected_entries`. De standaard CLI- en contextloze agentstart kon daardoor de nieuwe universele preventieregels niet zien, ook al bestond de learning en waren de projectiecontroles groen.

De bestaande runtimeprojector includeert voortaan expliciet aangewezen `mandatory_preflight`-regels met aantoonbaar universele `compiler.scope=ALL_POWERHOUSE_AGENTS_CHATS` en `machine_enforceable=true`, ook zonder hints. Alle niet-universele regels blijven op fingerprint/taakdomein geselecteerd om output begrensd te houden. Het regressiecontract controleert projectie, default selectie, gerichte selectie en het werkelijk gebouwde preflight-pakket. `CANDIDATE` blijft onveranderd zolang exacte release- en daadwerkelijke externe-agentbewijzen ontbreken: zichtbaarheid is niet hetzelfde als bewezen effectiviteit.

Deze opvolgcorrectie is deel van dezelfde learning-fingerprint/obligation en gebruikt de bestaande Brain/skillprojectie; er ontstaat geen parallelle registry, scheduler of herstelowner.
