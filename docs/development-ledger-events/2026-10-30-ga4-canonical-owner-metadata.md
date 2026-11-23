# GA4 owner metadata drift — append-only development evidence — 30 oktober 2026
- Parent: #4198, PR #5207/#5208, bestaande ONE BRAIN fingerprint `powerhouse|ga4-calibration|provider-report-empty-and-private-outcomes-not-public-ai|20261030-v1`.
- Source proof: `public.powerhouse_evidence_sources('ga4-analytics').owner_component='bg-ga4-sync'` terwijl de geregistreerde Edge `bg-ga4-sync` is uitgefaseerd (410) en `bg-analytics-sync-composio` actief is.
- Exact scope: één bestaande bronregisterrij idempotent herlabelen op de oorspronkelijke eigenaar. Niet automatisch bronfrisheid, bezoekers of kalibratie op groen zetten.
- Test: `tests/brain-ga4-original-owner-metadata-20261030.test.mjs`.
- Acceptance: beschermd GitHub Required/CodeQL, originele SQL-migratie en read-after-write eigenaar, daarna pas onafhankelijke providerreadback, Heartbeat natural run, relevante agent learning application.
- No extra cron, publisher, GA4 client, data writer, forecast resolver, public/private data transfer, spend or consent bypass.
- Status: candidate; production readback and source business impact not yet verified.
