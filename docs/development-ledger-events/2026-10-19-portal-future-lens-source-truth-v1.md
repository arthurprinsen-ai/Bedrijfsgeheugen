# Development event — 2026-10-19 — Portal Future Lens source truth

- Obligation-ID: `portal-source-truth-no-fake-confidence-20261019`
- Finding: DOM-derived KPI numeric data were reused to project future values and to display invented 35–95% reliability.
- Root cause: no tenant evidence/time series, scoring based on DOM presence, arbitrary 0–100 normalization, arbitrary scenario coefficients.
- Secondary verified incident: live external data producer invoked; Tavily rejected three of three queries `HTTP_432` plan usage limit, edge responded HTTP 502. Date of latest ingested raw signals 14 Oct 2026.
- Remediation: reject numeric Future Lens claims without independently backed canonical forecast source; preserve existing verified scenario workspace and source-gated actions.
- No backfill, provider upgrade, customer financial data, or fabricated outcome.
- Prevention: DOM is view, never evidentiary source; calibrated prediction quality comes from resolved outcomes; per-provider 2xx readback and source observation are separate from cron COMPLETED.
- Regression: `portal-v2/tests/nextgen-intelligence.test.mjs`.
- Release status: `CANDIDATE_PROTECTED_DELIVERY` until Required/CodeQL, protected merge, exact Netlify production readback and authenticated portal visual verification succeed.

- Additional Portal V2 acceptance: Omgevingsradar separates actual source observation age from snapshot computation time and labels 24-hour observation gaps; source capabilities display available/connectable state. Candidate intelligence actions show ranked signal priority, owner/streefdatum and whether already materialized, with no pretend execution authority.
- Regression: `portal-v2/tests/entrepreneur-intelligence-front-end.test.mjs`.
