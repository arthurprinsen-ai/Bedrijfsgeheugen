# Profile KPI falsity incident — 2026-10-20

Canonical obligation: `portal|profile-input-backed-kpis|20261020`.
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

Incident: fallback values 24 employees, €52/hour, maturity=2 inside `portal-v2/modules/company-input.js` contaminated real-customer capacity and finance views. This violated measured-vs-estimated-vs-unknown truth rules.

Fix: require all explicitly entered profile source fields. Unknown propagates as `null` and UI '—'; modeled forecast/baseline clearly labeled estimate and no realized savings. Parent obligation remains OPEN until Frisse Blik claim identity and 2-tenant exact source-browser readback passed.

Tests: `tests/brain-portal-profile-no-synthetic-kpis-v1.test.mjs`, covering missing, partial, zero and complete explicit states and aggregate overview gate.
No parallel API/state/cron or source-authority changes.
