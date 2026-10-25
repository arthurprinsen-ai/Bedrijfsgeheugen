# External signal → klantspecifieke actie — 25 oktober 2026

Fingerprint: `powerhouse|portal-external-signal-to-tenant-action-disconnected|20261025-v1`
Parent-P0: #4198
Obligation-ID: `portal:external-signals-tenant-action-guidance:20261025-v1`
Delivery-Lane: website

## Incident en feitelijke oorzaak
Het bestaande portaal toont externe actualiteit en een aparte toplijst met actievoorstellen, maar koppelt die twee niet per bron aan elkaar. De server leest reeds `powerhouse_intelligence_signal_projection_v1` plus `powerhouse_intelligence_company_impact_v1` uitsluitend voor de geauthenticeerde tenant, en een tenant-gebonden plus canonieke action shortlist. Er was geen browser-zichtbare, geteste bron→bedrijfsreden→volgende stap projectie.

## Wijziging binnen bestaande eigenaar
- `portal-v2/modules/external-signal-action-context.js`: pure, read-only analyse van exact `signal_key`, `company_impacts` en per-tenant actie; expliciete context-gap en review-only fallback, originele veilige HTTPS-bron, bronouderdom en onafhankelijke outcome-waarheid.
- `portal-v2/modules/entrepreneur-intelligence.js`: toon reden, stap en status **op dezelfde signaalkaart**, met alleen tenant-gebonden indicatieve waarde; geen generiek euro-resultaat.
- Bestaande Edge tenant-Scope/RLS, CRM, scheduler, publicatieprovider, outreach-consent en één BRAIN blijven ongewijzigd.
- Geautomatiseerde regressies op klantspecifieke en canonieke gevallen, stale/untrusted sources, ontbreken van bewijs, false-green DONE.

## Acceptatie en effectmeting
1. Exact-branch node-tests plus bestaande portal-tests, GitHub Required/CodeQL.
2. Protected merge met bestaande website writer, Netlify deploy exact SHA.
3. Ingelogde tenant-readback op `omgevingsradar`: bron, reden, actie en bronstatus; geen data van andere tenants.
4. In volgende bestaande commerciële loop: meet `source_observed`, `tenant_impact_scored`, `customer_action_linked`, `action_executed_with_receipt`, `revenue_realized_with_independent_evidence` apart. Geen fictieve conversie.
5. Blijf de bestaande bedrijfsnieuwsradar auditen: recente pg_cron transport-success is niet gelijk aan actuele geaccepteerde bedrijfsnieuwsresultaten.

**Nu:** kandidaatwijziging, niet LIVE_PROVEN vóór onafhankelijke productie-readback. Geen nieuwe queue, cron of parallel schrijver.
