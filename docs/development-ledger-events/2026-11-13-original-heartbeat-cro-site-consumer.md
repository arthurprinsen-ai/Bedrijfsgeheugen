# Original SEO/ONE BRAIN → Heartbeat CRO actual receiving ACK — 2026-11-13

Fingerprint: `powerhouse|seo|original-heartbeat-cro-site-consumer|20261113-v1`.
Original owner: #140 `powerhouse-content-orchestrator-daily-v1`, existing commercial heartbeat SQL; source #175; SEO writer #105; website BG169 original protected Netlify.
Actual observed gap: two exact site execution/source ACK linked receipts, but no independent original CRO consumer ACK within heartbeat event; CRO experiment not executed.
Revision: same existing `commercial-intelligence-heartbeat:<date>` event, no new row or queue; distinct nested `original_site_to_cro_handoff` receipt (site proof only), fail closed when current source table SHA/ACK, tenant/date, release commit, URL, provider request or CTA disagree.
Evidence and negative controls: existing 13-Nov original obligation ID `40b62d82-dcd3-4a44-98d0-3f94071008a9`, source SHA `937fd65725813cf0320465b5a92231d86f0faf5327bdd128057e2b6c16baacfb`, Exact Online and Twinfield release `66b67ac366e073ca068e5f1e23938a9792ae7dce`; website experiment assignments not proven.
Historical/shadow/canary regression `tests/brain-original-seo-heartbeat-cro-consumer-20261113.test.mjs`.
Security: internal-only function access, no new scheduler, no table, no Graph/RLS extension, no external send; protected CI/CD, provider migration and production function readback mandatory.
Status at candidate creation: NOT_LIVE_PROVEN. Original CRO treatment, causal/paid outcomes, next-run learning: OPEN.
Original tracking: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## 13 november 2026 — Eindbewijs uit bestaande productie, zonder valse CRO-orderstatus
Protected PR #5756 werd na Required + CodeQL, database replay en Supabase Preview gemerged naar `main` als `3588638975030bb58f73d4b5b14629c84e8123da`. Onafhankelijke Supabase-readback op project `adhjwmvyoixzjtmiroln` bevestigt native werkelijk toegepaste migratie `20261113190000/original_seo_heartbeat_cro_consumer_receipt_v1`, exacte `pg_get_functiondef` met `ORIGINAL_SEO_TO_HEARTBEAT_CRO_RECEIPT_V1` en service-only EXECUTE (`anon=false, authenticated=false, service_role=true`).

Een veilig afgebakende, echte uitvoering van de bestaande `public.powerhouse_commercial_intelligence_heartbeat_v1(date '2026-11-13')` gaf `healthy=true`, exact oorspronkelijke #175→#140 bron-ACK SHA `937fd65725813cf0320465b5a92231d86f0faf5327bdd128057e2b6c16baacfb` en `original_site_to_cro_handoff.accepted=true`, `site_receipt_count=2`. Het bewijst originele CRO-ontvangst voor Exact Online en Twinfield met originele BRAIN obligation `40b62d82-dcd3-4a44-98d0-3f94071008a9`, publieke URL, onafhankelijke DataForSEO-provider-request-ID en website-merge `66b67ac366e073ca068e5f1e23938a9792ae7dce`.

**Onafhankelijke originele event-readback:** precies 1 `powerhouse_runtime_events` met dedupe-key `commercial-intelligence-heartbeat:2026-11-13`, met 2 afzonderlijke ontvangersbewijzen. Een tweede gecontroleerde aanroep geeft opnieuw precies deze 2 bewijzen en geen dubbele daggebeurtenis. Originele job #140 bleef actief, geen nieuwe cron, publicatie, klantcontact, queue of experiment.

**Correct niet-groen:** CRO treatment uitgevoerd = false, onafhankelijk A/B-effect = false, betaalde order = false, volgende natuurlijke leertoepassing = false. Alle oorspronkelijke `GROWTH_SOURCE_DAILY_HANDOFF` blijven `OPEN`; een bestaand bron/site/Heartbeat ontvangstbewijs sluit commerciële omzet niet af.

De originele Git migratiehistorie bevatte nog 850 werkelijk toegepaste provideridentiteiten tegenover provider 851. Vóór bronreconciliatie zijn alle eerste 850 paarwaarden (versie én naam) onafhankelijk één voor één vergeleken: 0 verschillen. Alleen de daadwerkelijk toegepaste 851e `20261113190000/original_seo_heartbeat_cro_consumer_receipt_v1` en provider-capture-timestamp toevoegen; nooit SQL opnieuw uitvoeren of APPLIED verzinnen. Follow-up parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
