# Canonical portal source clock and money unknown semantics — 2026-10-20
Obligation-ID: `portal|entrepreneur-snapshot-evidence-freshness|20261020`.
Owner: existing Portal V2 / Supabase EU entrepreneur Edge read-model.
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Fingerprint: `portal|entrepreneur-source|stale-current-and-null-eur-zero|v1`.

Source evidence: source `CURRENT` derived from any signals, fallback `new Date()`, `Number(null)` in source aggregation. Canonical Source Universe snapshot older than expected post-merge slot; 0 tenant financial forecasts and action outcome links (not known-real zero commercial value).

Change: isolate pure numeric and clock evidence policy; import into existing tenant overlay, preserve originally observed timestamp, expose independent freshness label. Follow protected CI, CodeQL, Edge QA. No service token disclosed, no cross-tenant signal synthesis.

Historical replay: `tests/brain-portal-entrepreneur-source-freshness-v1.test.mjs`. This change does not resolve DB load, upstream Source Universe cron lapse, full authenticated route 504, missing tenant finance/CSRD inputs or commercial realized value. Production end-to-end remains P0 OPEN pending separate independent proofs.
