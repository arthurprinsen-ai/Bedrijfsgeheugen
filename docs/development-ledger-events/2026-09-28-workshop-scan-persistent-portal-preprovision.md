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

- 2026-09-28: capability gepromoveerd tot expliciete chat/agent-invariant; alle huidige en toekomstige nodes moeten dezelfde submission-lineage, private PII-intake, portal-preprovisioning en identity-claim hergebruiken.
- 2026-09-28: System Map registratie en repository-governance toegevoegd zodat preflight deze capability als bestaande Powerhouse-architectuur ontdekt.

- 2026-09-29: persoonlijke workshop-PDF toont deelnemernaam op beide pagina's en gebruikt bedrijf + deelnemer in de bestandsnaam; naam blijft onderdeel van dezelfde private intake/submission-lineage.
