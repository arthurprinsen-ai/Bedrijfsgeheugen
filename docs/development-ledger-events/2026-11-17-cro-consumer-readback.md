# Development ledger — oorspronkelijke CRO source→consumer handoff, 17 november 2026

- Oorspronkelijke eigenaar: Powerhouse #140 ONE BRAIN consumer, Heartbeat; geen nieuwe scheduler.
- Bron: production views uit merged PR #5964; oude consumer MD5 `0f08b2e3dc972498a5298e10e3e7e71c`.
- Incident: drie beveiligde CRO-bronnen live, maar ontbreken in originele consumer-readback. Het bestaande cron #175 → #140 bronmanifest en ACK waren actief; dit was een apart execution/learning-coverage gat.
- Herstel: originele `public.powerhouse_daily_source_consume_v1` leest gebundelde site/social/email source-only-diagnoses, bewaart dezelfde dag-obligation en laatste runtime event; status en uurbron worden expliciet opgeschreven. Fouten blijven UNVERIFIED en worden niet groen.
- Rehearsal: werkelijke Supabase-transactie met `CREATE OR REPLACE FUNCTION`, source SELECT en `ROLLBACK` gaf `SOURCE_DIAGNOSTICS_READBACK`; geen gegevens of migratie persistente gewijzigd door deze rehearsal.
- Volgende controle: protected PR Required/CodeQL, migration preview, protected merge, applied production migration, eerste eigen #140/Heartbeat natural-run met data; pas daarna kan consumer-readback live heten. Niet gelijk aan verzonden email, ingevoerde A/B-test, betaald orderresultaat of 14 innovatieclosures.
