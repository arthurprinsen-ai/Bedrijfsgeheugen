# Predictive runtime evidence in the existing authenticated Powerhouse portal — 30 October 2026

## Verified baseline and source
- Protected PR #5169 merged as `596c4cbcb5fa0e0cbd953d0483e4f98eb3dff613`; Supabase original `powerhouse-predictive-engine` **ACTIVE v569** and whole `index.ts` equals current GitHub main.
- Independently read `net._http_response.id=16430`: HTTP 200, 18 permitted market signals, 1 forecast written, 0 rejects. `bg_gezondheid` independently reports `signals=18; forecasts=1; rejected=0`, at 2026-10-30 07:02 UTC.
- Parent ONE BRAIN failure fingerprint `predictive|public-market|unfiltered-top80-crowds-out-valid-source-types|20261030-v1` stays maturity OBSERVED. No verified *next naturally scheduled* run, forecast realization, lead or revenue outcome.
- Separate commercial/content blockers still open; this is a scoped predictive runtime fix, not full business-loop health.

## Canonical portal delivery, no parallel system
- `brain/observability/predictive-run-evidence.mjs`: read-only sanitized projection from the EXISTING Supabase `bg_gezondheid` health receipt and `brain_failure_registry` incident evidence. Each request is bounded to one row with 5 s timeout, private service key server-side only. No identifiers, private signal contents or raw error payload passed to the browser.
- `netlify/functions/powerhouse-observability.mjs`: original authenticated/admin-only Portal V2 function obtains that readback alongside existing failure coverage, agent-cycle coverage and publication statuses. Do not add a new endpoint or cron.
- `portal-v2/modules/powerhouse-observability.js`: on existing System Map tab, show market signals, forecasts, rejects; distinguish real runtime receipt from next natural Heartbeat run, realized forecast, revenue and mature learning.
- `.agents/skills/powerhouse-self-improvement-layer/SKILL.md` and `.agents/skills/powerhouse-growth-swarm/SKILL.md`: agents must preserve exact privacy filtering and provenance; a one-off canary is not autonomous learning or orders.
- Root ONE BRAIN learning remains in the existing predictive incident JSON, extended with the portal regression and the independent canary identifiers.
- Regression: `tests/brain-predictive-portal-runtime-proof-20261030.test.mjs`.

## Acceptance and anti-false-green safeguards
1. Original protected PR Required/BRAIN/CodeQL/System Map passed, merged exact main, Netlify deployment applicability evaluated and exact production portal readback completed.
2. Authenticated admin sees `RUN_READBACK_PROVEN` only when a fresh actual `bg_gezondheid` success is corroborated by merge parity + verified HTTP receipt in the existing ONE BRAIN registry.
3. HTTP 401/403, stale health, missing data or malformed counts gives UNVERIFIED; do not leak token, names, PII, arbitrary relationship evidence, or raw provider text.
4. `nextNaturalRunProven`, `realizedOutcomeProven` and `commercialRevenueProven` remain false until independent proof in their original lineage. No green dashboard from release, canary, scheduler acknowledgement, forecast recommendation or content planning alone.
5. Keep same original scheduler/owner. No new deployment of the predictive Edge function is necessary for this portal-only source change. Do not claim LIVE until exact Netlify/portal evidence passes.
