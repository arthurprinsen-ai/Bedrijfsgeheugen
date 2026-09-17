# Powerhouse Runtime Authority Governance v1

Fingerprint: `powerhouse-agent-scheduler-authority-drift-2026-09-17-v1`

## Doel

Dit contract voorkomt dat meerdere schedulers, agents of legacy-runtimes tegelijk dezelfde materiële Powerhouse-verplichting bezitten. Execution authority wordt bepaald door één canonieke registry plus bewezen runtime-evidence; providerstatus, `isActive`, scheduler-ack of historische configuratie zijn nooit zelfstandig productie-authority.

## Canonieke bron

- Machineleesbare registry: `config/powerhouse-runtime-authority.json`.
- Evaluator/gate: `brain/operating-loop/runtime-authority-governance.mjs`.
- Regressietests: `tests/runtime-authority-governance.test.mjs` en `tests/brain-adapter-conformance.test.mjs`.
- Durable recovery blijft in de bestaande Supabase/Brain obligation/evidence/runtime; er is geen tweede queue of watchdog-store gebouwd.
- Canonieke learning/writeback blijft `public.brain_append_record` -> `brain_records`.

## Authorityregels

1. Iedere `material_obligation` heeft exact één component met `authority=ACTIVE`.
2. Een `LEGACY_RETIRED_PATH` heeft `authority=NONE` en `production_execution_allowed=false`.
3. Make is historische provenance. Providerteamstatus of `isActive=true` kan Make nooit opnieuw authority geven.
4. Een onbekende of incompleet geregistreerde actieve component faalt gesloten als `UNCERTIFIED_ACTIVE_COMPONENT`.
5. Een kanaalowner moet zelf actieve authority zijn.
6. Unsupported delivery-lanes zijn expliciet `UNSUPPORTED_FAIL_CLOSED_HOLD_ONLY`; de beslislaag mag daar alleen `hold` of `skip` afgeven totdat een echte executor met readback is gecertificeerd.

## Zevenkanaalscontract

- `linkedin_personal`: `powerhouse-social-publisher` via Supabase/Buffer, identity gate + provider/live readback.
- `linkedin_company`: `powerhouse-social-publisher` via Supabase/Buffer, company identity gate + provider/live readback.
- `instagram_company`: `powerhouse-social-publisher` via Supabase/Buffer, Mira identity + exact-final-media proof + provider/live readback.
- `blog`: `approved-central-blog` via GitHub Actions/candidate PR/protected promotion/exact production readback.
- `email_newsletter`: HOLD_ONLY zolang geen gecertificeerde email-executor met delivery/readback bestaat.
- `linkedin_article_personal`: HOLD_ONLY zolang geen gecertificeerde article-executor met live readback bestaat.
- `linkedin_article_company`: HOLD_ONLY zolang geen gecertificeerde company-article-executor met live readback bestaat.

Dit voorkomt dat ontbrekende provider-capability als fictieve productiefunctionaliteit wordt geregistreerd.

## Schedulerrollen

- `Powerhouse Growth & Revenue OS` is coordinator voor dagelijkse intelligence/decision/learning en geen provider execution proof.
- `Powerhouse Social Delivery` is recovery/readback coordinator rond de canonieke sociale delivery en geen tweede publish-authority.
- `powerhouse-content-orchestrator` bezit de zeven dagelijkse `publish|skip|hold` beslissingen.
- `powerhouse-autonomous-improvement-cycle-v1` bezit runtime-authority reconciliation binnen de bestaande Supabase pg_cron improvement-cycle.
- `brain-obligation-runtime` bezit interrupted-run recovery via de bestaande durable obligation/evidence/transition primitives.

## Make retirement

PH Agent 01 t/m 16 blijven als historische evidence geregistreerd. `config/make-agent-resume-learning-guard.json` is omgezet naar `LEGACY_RETIRED_PATH`. Herinschakeling is alleen toegestaan na een expliciete wijziging van de canonieke authority-registry én het opnieuw doorlopen van shared-context, security, cost, dedupe, rollback, execution-proof en outcome-writeback gates. Stil resume na provider-capaciteitsherstel is verboden.

## Failure fingerprint en root cause

Root cause van deze drift: uitvoeringsauthority was verspreid over repositorycontracten, providerstatussen en schedulers. Daardoor konden woorden als `compatibility-first`, `paused` en `isActive` verschillend worden geïnterpreteerd zonder één machineleesbare owner-map.

Failure fingerprint: `powerhouse-agent-scheduler-authority-drift-2026-09-17-v1`.

Preventieregel: iedere materiële runtimewijziging moet de authority-registry aanpassen en `evaluateRuntimeAuthority()` groen houden. Een retired executor die actief wordt of dubbele material ownership ontstaat, blokkeert de release fail-closed.

## Recovery

Een afgebroken substantiële run wordt niet als terminale toestand beschouwd. Recovery hergebruikt de bestaande `brain_obligations`, obligation evidence/dispatch, runtime events en CAS-transition functies. Hervatten vereist durable obligation identity, idempotency, laatst bewezen checkpoint, side-effect readback en een geldige terminale status of aantoonbare hard boundary.

## Notion

Notion blijft projectie/kennis/audit en geen deployed execution authority. Het inventariseren van Notion custom agents kan alleen volledig worden bewezen wanneer de workspace/API-capability daarvoor beschikbaar is. Tot dat moment mag Notion nooit worden gebruikt om een ontbrekende runtime-owner te veronderstellen.

## Definition of Done

Deze hardening is pas `LIVE & BEWEZEN` wanneer:

- Required CI/tests groen zijn op de exacte PR-head;
- de protected merge op `main` is uitgevoerd;
- `main` de registry, evaluator, retired Make-adapter en regressietests terugleest;
- Supabase/Brain een canonical learning/current-state record voor dit fingerprint bevat;
- issue #1886 alleen wordt gesloten als runtime contract, scheduler owner-map en productie-readback dezelfde authoritywaarheid tonen.
