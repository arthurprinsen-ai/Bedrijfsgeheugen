# 2026-09-28 — Workshopscan persistent klantportaal

- Persoonlijke scaninvoer wordt niet meer uitsluitend browser-side gehouden.
- Canonieke score/antwoorden blijven in `scan_inzendingen`.
- PII + bedrijfscontext gaan naar private `workshop_portal_intakes`, service-role only.
- Iedere geldige workshopscan preprovisiont direct een `canonical-brain` portalstate onder `scan:<submission_key>`.
- Dezelfde `submission_key` koppelt scan, PDF, portal en latere identity claim.
- Na authenticated claim wordt de preprovisioned state naar de echte portal tenant gekopieerd en intake gemarkeerd als `claimed`.
- Aggregate benchmark/growth events blijven `no_pii`.
- Productie Supabase Edge Function `powerhouse-scan-ingest` draait op versie 4.
- Regressie: `tests/components/workshop-scan-portal-preprovision.test.mjs`.
