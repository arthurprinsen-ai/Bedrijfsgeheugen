# Originele content-loop 500 door ontbrekende Mira preflight-allowlist — 3 november 2026

## Bronbewijs
PR #5375 voegde `assessPreventivePublicationReadiness` toe in de bestaande `powerhouse-content-loop`, maar de directe DB-adapter had een gesloten `DIRECT_TABLES`-lijst zonder `powerhouse_instagram_media_jobs_v1`. Op 3 november 16:14:35Z en 16:19:39Z gaf exact deze originele Edge-functie HTTP 500. De originele `function_logs` melden `CONTENT_LOOP_ERROR DB_TABLE_REJECTED:powerhouse_instagram_media_jobs_v1`. De ONE BRAIN content-closed-loop registreert terecht `CONTENT_LOOP_INTERNAL_ERROR`. Cron #140 (27 * * * *) zelf toont eerdere `succeeded`, maar dat is alleen een pg_net-enqueue, geen geslaagde Edge-run.

## Minimale herstelingreep
In de bestaande `powerhouse-content-loop/index.ts` is exact de originele mediajob als **read-only** DirectQuery-bron vrijgegeven. Alle mutatieoperaties voor deze tabel worden expliciet geweigerd door `DB_READ_ONLY_TABLE_REJECTED`; de bestaande originele producerclaim blijft de enige bevoegde writer. Geen andere DB-allowlist, auth, lease, providercreate, scheduler, kwaliteitsscore, approval of duplicate gate veranderd.

## Test en afsluiting
`tests/brain-content-loop-preventive-media-direct-adapter-20261103.test.mjs` test het preflight-broncontract en de adapter-mutatieblokkade. Verplicht: exact-head Required/BRAIN/CodeQL, beschermde merge, originele Edge-deploy, onafhankelijk v- en SHA-readback en natuurlijke #140-run met `result.preventive` in het originele ONE BRAIN-record. `PREVENTIVE_ACTION_REQUIRED` is een risico, géén providerbewijs; 24 blockers en 1/4 bewezen kanalen worden niet groen gezet. Alle overige kanaalowners blijven verantwoordelijk voor inhoudelijke herstelacties.

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
