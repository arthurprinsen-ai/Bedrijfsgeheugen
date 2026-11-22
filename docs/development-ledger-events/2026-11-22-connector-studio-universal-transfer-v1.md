# Koppeling Studio V2 — universele verbindingsrequirements

Datum: 2026-11-22. Owner: bestaande Koppeling Studio (portal-v2), single tenant connector store, ONE BRAIN, Powerhouse/Heartbeat.

- Designfout: templates waren niet onafhankelijk te combineren; de gebruiker kon geen direction/frequency/conflict-/deletion-/incremental-keys instellen. Een tekstuele 'dag'-planning is geen scheduler.
- Oplossing: catalogus + source→target configuratie, source/target provider IDs, versioned transfer policy, eenvoudige native configuratie in bestaande wizard, en server fail-closed gate op activatie/synchronisatie. Geen extra datastore, OAuth-bypass, cron of parallelle runtime.
- Functionele basis: handmatig, 5 min t/m wekelijks, webhook en CDC als niet-geactiveerde intent; richting bron→doel, doel→bron, bi-directioneel als ontwerp; snapshot, append en upsert met sleutel/cursor; deletes en backfill pas na geverifieerde uitvoerder.
- Bestaande AFAS read-only GET blijft operationeel als opt-in handmatige route, tot echte klantproviderautorisatie en doel-readback. Overige providers alleen ontwerp.
- Beveiliging: tenant, least privilege, selected pages, no secrets in draft, provider allowlist, plan limit, SQL schema versie; oude provider-test moet ongeldig worden bij scopewijzigingen.
- Tests: `tests/brain-connector-studio-universal-transfer-v1.test.mjs`, `tests/connector-koppelingen-wizard.test.mjs`, `tests/brain-portal-connector-real-afas-v1.test.mjs`. Status candidate pending exact-head CI + production browser.
- Requirements: `docs/changes/2026-11-22-connector-studio-universal-requirements-v2.md`.
